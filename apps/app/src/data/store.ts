import { create } from 'zustand';
import {
  BUILTIN_COLLECTIONS, DEFAULT_STATUSES, defaultStatus, firstDoneStatus, getStatus, normalizeUrl, detectSource,
  suggestCollection, hostLabel, toIsoDate,
} from '@pickle/core';
import type { CollectionDef, ExtraLink, FieldValue, Item, Reminder, StatusDef, SortHistory } from '@pickle/core';
import { buildMock, uid } from './mock';
import { generateUuid } from './uuid';
import {
  loadUserData,
  syncInsertItem, syncUpdateItem, syncDeleteItem, syncDeleteMany, syncRestoreItem, syncEmptyTrash,
  syncInsertCollection, syncUpdateCollection,
  syncInsertReminder, syncUpdateReminder, syncDeleteReminder,
} from './sync';

export interface Settings {
  previews: boolean;
  rediscoverOn: boolean;
  rediscoverDay: string;
  defaultReminderTime: string;
  laptopSync: boolean;
}

interface UndoState { id: number; message: string; undo: () => void }

export interface AddLinkResult {
  item?: Item;
  duplicate?: Item;
  error?: string;
}

interface State {
  collections: CollectionDef[];
  items: Item[];
  reminders: Reminder[];
  history: SortHistory;
  settings: Settings;
  undoState: UndoState | null;
  /** True when we have loaded the user's real data from Supabase (or demo data). */
  dataLoaded: boolean;

  // ---- Data lifecycle ----
  loadFromSupabase: () => Promise<void>;
  loadDemoData: () => void;
  clearData: () => void;

  // ---- CRUD ----
  addLink: (raw: string) => AddLinkResult;
  patchItem: (id: string, patch: Partial<Item>) => void;
  setData: (id: string, fieldId: string, value: FieldValue) => void;
  sortItem: (id: string, collectionId: string, input: ItemInput) => void;
  createItem: (collectionId: string, input: ItemInput) => AddLinkResult;
  saveItem: (id: string, input: ItemInput) => void;
  deleteItem: (id: string, undoable?: boolean) => void;
  deleteMany: (ids: string[]) => void;
  restoreItem: (id: string) => void;
  emptyTrash: () => void;
  setStatus: (id: string, statusId: string) => void;
  bumpCounter: (id: string, fieldId: string, delta: number) => void;
  runQuickAction: (id: string) => void;
  markOpened: (id: string) => void;
  addExtraLink: (id: string, link: Omit<ExtraLink, 'id'>) => void;
  removeExtraLink: (id: string, linkId: string) => void;
  addReminder: (r: Omit<Reminder, 'id' | 'doneAt' | 'createdAt'>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  saveCollection: (c: CollectionDef) => void;
  addCollection: (c: Omit<CollectionDef, 'id' | 'builtinKey' | 'builtIn' | 'version' | 'sort'>) => string;
  setSettings: (p: Partial<Settings>) => void;
  dismissUndo: () => void;
  exportJson: () => string;
  importJson: (text: string) => { ok: boolean; message: string };
  resetDemo: () => void;
}

export interface ItemInput {
  title: string;
  link?: string;
  statusId?: string;
  data: Record<string, FieldValue>;
  extraLinks?: ExtraLink[];
  note?: string;
}

const now = () => new Date().toISOString();

function seed() {
  const { items, reminders } = buildMock();
  return { collections: BUILTIN_COLLECTIONS.map((c) => ({ ...c })), items, reminders };
}

function titleFromUrl(raw: string): string {
  const n = normalizeUrl(raw);
  if (!n) return raw;
  const seg = n.url.replace(/^https?:\/\/[^/]+/, '').split('?')[0].split('/').filter(Boolean).pop();
  if (!seg || /^[A-Za-z0-9_-]{8,}$/.test(seg) && !seg.includes('-')) return `Link from ${hostLabel(raw)}`;
  const text = decodeURIComponent(seg).replace(/[-_]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

let undoCounter = 0;

export const useStore = create<State>()((set, get) => ({
  collections: [],
  items: [],
  reminders: [],
  history: {},
  settings: { previews: true, rediscoverOn: false, rediscoverDay: 'Sun', defaultReminderTime: '09:00', laptopSync: false },
  undoState: null,
  dataLoaded: false,

  // ---- Data lifecycle ----

  loadFromSupabase: async () => {
    const data = await loadUserData();
    if (data && data.collections.length > 0) {
      set({
        collections: data.collections,
        items: data.items,
        reminders: data.reminders,
        dataLoaded: true,
        history: {},
        undoState: null,
      });
    } else {
      // If no collections in DB yet, fallback to builtins so UI isn't blank while seeding
      const defaultCols = BUILTIN_COLLECTIONS.map((c) => ({ ...c }));
      set({
        collections: (data && data.collections.length > 0) ? data.collections : defaultCols,
        items: data?.items ?? [],
        reminders: data?.reminders ?? [],
        dataLoaded: true,
        history: {},
        undoState: null,
      });
    }
  },

  loadDemoData: () => {
    set({ ...seed(), history: {}, undoState: null, dataLoaded: true });
  },

  clearData: () => {
    set({ collections: [], items: [], reminders: [], history: {}, undoState: null, dataLoaded: false });
  },

  // ---- CRUD ----

  addLink: (raw) => {
    const n = normalizeUrl(raw);
    if (!n) return { error: 'That does not look like a link.' };
    const dup = get().items.find((i) => !i.deletedAt && i.urlKey === n.key);
    if (dup) return { duplicate: dup };
    const t = now();
    const item: Item = {
      id: generateUuid(),
      stage: 'inbox',
      collectionId: null,
      statusId: null,
      sourceUrl: n.url,
      urlKey: n.key,
      sourceType: detectSource(n.url),
      title: titleFromUrl(raw),
      caption: null,
      siteName: n.host,
      coverUri: null,
      readableText: null,
      linkState: 'unknown',
      note: '',
      extraLinks: [],
      data: {},
      sharedAt: t,
      lastOpenedAt: null,
      openCount: 0,
      enrichState: get().settings.previews ? 'done' : 'skipped',
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
    set((s) => ({ items: [item, ...s.items] }));
    syncInsertItem(item);
    return { item };
  },

  patchItem: (id, patch) => {
    const t = now();
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: t } : i)) }));
    syncUpdateItem(id, { ...patch, updatedAt: t });
  },

  setData: (id, fieldId, value) => {
    const t = now();
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const newData = { ...item.data, [fieldId]: value };
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, data: newData, updatedAt: t } : i)) }));
    syncUpdateItem(id, { data: newData, updatedAt: t } as Partial<Item>);
  },

  sortItem: (id, collectionId, input) => {
    const c = get().collections.find((x) => x.id === collectionId || (x.builtinKey && x.builtinKey === collectionId));
    if (!c) return;
    const item = get().items.find((i) => i.id === id);
    const t = now();
    set((s) => {
      const host = item?.sourceUrl ? hostLabel(item.sourceUrl) : null;
      const history = { ...s.history };
      if (host) history[host] = { ...(history[host] ?? {}), [c.builtinKey ?? c.id]: ((history[host] ?? {})[c.builtinKey ?? c.id] ?? 0) + 1 };
      return {
        history,
        items: s.items.map((i) =>
          i.id === id
            ? { ...i, stage: 'sorted', collectionId: c.id, statusId: input.statusId ?? defaultStatus(c).id, title: input.title || i.title, data: input.data, extraLinks: input.extraLinks ?? i.extraLinks, note: input.note ?? i.note, updatedAt: t }
            : i,
        ),
      };
    });
    syncUpdateItem(id, {
      stage: 'sorted',
      collectionId: c.id,
      statusId: input.statusId ?? defaultStatus(c).id,
      title: input.title || item?.title || null,
      data: input.data,
      extraLinks: input.extraLinks ?? item?.extraLinks ?? [],
      note: input.note ?? item?.note ?? '',
      updatedAt: t,
    } as Partial<Item>);
  },

  createItem: (collectionId, input) => {
    const c = get().collections.find((x) => x.id === collectionId || (x.builtinKey && x.builtinKey === collectionId));
    if (!c) return { error: 'Unknown collection.' };
    let urlKey: string | null = null;
    let url: string | null = null;
    if (input.link && input.link.trim()) {
      const n = normalizeUrl(input.link);
      if (!n) return { error: 'That link does not look right.' };
      const dup = get().items.find((i) => !i.deletedAt && i.urlKey === n.key);
      if (dup) return { duplicate: dup };
      urlKey = n.key;
      url = n.url;
    }
    const t = now();
    const item: Item = {
      id: generateUuid(),
      stage: 'sorted',
      collectionId: c.id,
      statusId: input.statusId ?? defaultStatus(c).id,
      sourceUrl: url,
      urlKey,
      sourceType: url ? detectSource(url) : 'manual',
      title: input.title.trim(),
      caption: null,
      siteName: url ? hostLabel(url) : null,
      coverUri: null,
      readableText: null,
      linkState: 'unknown',
      note: input.note ?? '',
      extraLinks: input.extraLinks ?? [],
      data: input.data,
      sharedAt: t,
      lastOpenedAt: null,
      openCount: 0,
      enrichState: url ? 'done' : 'skipped',
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
    set((s) => ({ items: [item, ...s.items] }));
    syncInsertItem(item);
    return { item };
  },

  saveItem: (id, input) => {
    const t = now();
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id
          ? { ...i, title: input.title, statusId: input.statusId ?? i.statusId, data: input.data, extraLinks: input.extraLinks ?? i.extraLinks, note: input.note ?? i.note, updatedAt: t }
          : i,
      ),
    }));
    const item = get().items.find((i) => i.id === id);
    if (item) {
      syncUpdateItem(id, {
        title: input.title,
        statusId: input.statusId ?? item.statusId,
        data: input.data,
        extraLinks: input.extraLinks ?? item.extraLinks,
        note: input.note ?? item.note,
        updatedAt: t,
      } as Partial<Item>);
    }
  },

  deleteItem: (id, undoable = true) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const t = now();
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, deletedAt: t } : i)) }));
    syncDeleteItem(id, t);
    if (undoable) {
      const myId = ++undoCounter;
      set({ undoState: { id: myId, message: `Deleted "${item.title ?? 'item'}"`, undo: () => get().restoreItem(id) } });
    }
  },

  deleteMany: (ids) => {
    const t = now();
    set((s) => ({ items: s.items.map((i) => (ids.includes(i.id) ? { ...i, deletedAt: t } : i)) }));
    syncDeleteMany(ids, t);
  },

  restoreItem: (id) => {
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, deletedAt: null } : i)), undoState: null }));
    syncRestoreItem(id);
  },

  emptyTrash: () => {
    set((s) => ({ items: s.items.filter((i) => !i.deletedAt) }));
    syncEmptyTrash();
  },

  setStatus: (id, statusId) => {
    const t = now();
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, statusId, updatedAt: t } : i)) }));
    syncUpdateItem(id, { statusId, updatedAt: t } as Partial<Item>);
  },

  bumpCounter: (id, fieldId, delta) => {
    const item = get().items.find((i) => i.id === id);
    const c = item && get().collections.find((x) => x.id === item.collectionId || (x.builtinKey && x.builtinKey === item.collectionId));
    if (!item || !c) return;
    const current = typeof item.data[fieldId] === 'number' ? (item.data[fieldId] as number) : 0;
    const next = Math.max(0, current + delta);
    const data: Record<string, FieldValue> = { ...item.data, [fieldId]: next };
    if (fieldId === 'times_done' && delta > 0) data.last_done = toIsoDate(new Date());
    let statusId = item.statusId;
    // Raising a counter from zero moves an open card to the first done status (Recipes: To make -> Made).
    if (current === 0 && next > 0 && (c.id === 'recipes' || c.builtinKey === 'recipes')) {
      const done = firstDoneStatus(c);
      if (done && getStatus(c, statusId)?.kind === 'open') statusId = done.id;
    }
    const t = now();
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, data, statusId, updatedAt: t } : i)) }));
    syncUpdateItem(id, { data, statusId, updatedAt: t } as Partial<Item>);
  },

  runQuickAction: (id) => {
    const item = get().items.find((i) => i.id === id);
    const c = item && get().collections.find((x) => x.id === item.collectionId || (x.builtinKey && x.builtinKey === item.collectionId));
    if (!item || !c) return;
    const qa = c.quickAction;
    if (qa?.counterFieldId) get().bumpCounter(id, qa.counterFieldId, 1);
    else if (qa?.statusId) get().setStatus(id, qa.statusId);
    else {
      const done = firstDoneStatus(c);
      if (done) get().setStatus(id, done.id);
    }
  },

  markOpened: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const t = now();
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, openCount: i.openCount + 1, lastOpenedAt: t } : i)) }));
    syncUpdateItem(id, { openCount: item.openCount + 1, lastOpenedAt: t, updatedAt: t } as Partial<Item>);
  },

  addExtraLink: (id, link) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const newLink = { ...link, id: uid('link') };
    const extraLinks = [...item.extraLinks, newLink];
    const t = now();
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, extraLinks, updatedAt: t } : i)) }));
    syncUpdateItem(id, { extraLinks, updatedAt: t } as Partial<Item>);
  },

  removeExtraLink: (id, linkId) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const extraLinks = item.extraLinks.filter((l) => l.id !== linkId);
    const t = now();
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, extraLinks, updatedAt: t } : i)) }));
    syncUpdateItem(id, { extraLinks, updatedAt: t } as Partial<Item>);
  },

  addReminder: (r) => {
    const t = now();
    const reminder: Reminder = { ...r, id: generateUuid(), doneAt: null, createdAt: t };
    set((s) => ({ reminders: [reminder, ...s.reminders] }));
    syncInsertReminder(reminder);
  },

  toggleReminder: (id) => {
    const r = get().reminders.find((x) => x.id === id);
    if (!r) return;
    const completing = !r.doneAt;
    const doneAt = completing ? now() : null;
    set((s) => ({ reminders: s.reminders.map((x) => (x.id === id ? { ...x, doneAt } : x)) }));
    syncUpdateReminder(id, { done_at: doneAt });
    if (completing && r.completeMarksItem && r.completeStatusId) get().setStatus(r.itemId, r.completeStatusId);
  },

  deleteReminder: (id) => {
    set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
    syncDeleteReminder(id);
  },

  saveCollection: (c) => {
    set((s) => ({ collections: s.collections.map((x) => (x.id === c.id ? { ...c, version: x.version } : x)) }));
    syncUpdateCollection({ ...c });
  },

  addCollection: (c) => {
    const id = generateUuid();
    const newCol: CollectionDef = { ...c, id, builtinKey: null, builtIn: false, version: 1, sort: get().collections.length };
    set((s) => ({ collections: [...s.collections, newCol] }));
    syncInsertCollection(newCol);
    return id;
  },

  setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
  dismissUndo: () => set({ undoState: null }),

  exportJson: () => {
    const s = get();
    return JSON.stringify({ format: 'pickle-backup', version: 2, exportedAt: now(), collections: s.collections, items: s.items, reminders: s.reminders }, null, 2);
  },

  importJson: (text) => {
    try {
      const parsed = JSON.parse(text);
      if (parsed.format !== 'pickle-backup' || parsed.version !== 2) return { ok: false, message: 'This is not a Pickle backup (version 2).' };
      set({ collections: parsed.collections, items: parsed.items, reminders: parsed.reminders });
      return { ok: true, message: `Imported ${parsed.items.length} items.` };
    } catch {
      return { ok: false, message: 'Could not read that file.' };
    }
  },

  resetDemo: () => set({ ...seed(), history: {}, undoState: null }),
}));

// ---------- helpers that read the store without hooks ----------

export function collectionById(collections: CollectionDef[], id: string | null | undefined): CollectionDef | undefined {
  if (!id) return undefined;
  return collections.find((c) => c.id === id || (c.builtinKey && c.builtinKey === id));
}

export function resolveLink(item: Item, collection: CollectionDef | undefined, target: string): string | null {
  if (target === 'core') return item.sourceUrl;
  const extra = item.extraLinks.find((l) => l.id === target);
  if (extra) return extra.url;
  const v = item.data[target];
  if (typeof v === 'string' && v) return v;
  return item.sourceUrl ?? collection?.fields.map((f) => item.data[f.id]).find((x) => typeof x === 'string' && /^https?:/.test(String(x))) as string | null ?? null;
}

export function suggestFor(item: Item, history: SortHistory): string | null {
  return item.sourceUrl ? suggestCollection(item.sourceUrl, `${item.title ?? ''} ${item.caption ?? ''}`, history) : null;
}

export type { StatusDef };
export { DEFAULT_STATUSES };
