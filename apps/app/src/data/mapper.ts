/**
 * mapper.ts — camelCase ↔ snake_case conversion for Supabase rows.
 *
 * The DB uses snake_case columns; the app uses camelCase types.
 * These pure functions handle the translation in one place.
 */
import { BUILTIN_COLLECTIONS } from '@pickle/core';
import type { CollectionDef, ExtraLink, FieldValue, Item, Reminder } from '@pickle/core';

// ---------- Item ----------

/** Map an app Item to a Supabase `items` row for insert/upsert. Never sends `user_id` (defaults to auth.uid()). */
export function itemToRow(item: Item): Record<string, unknown> {
  return {
    id: item.id,
    stage: item.stage,
    collection_id: item.collectionId,
    status_id: item.statusId,
    source_url: item.sourceUrl,
    url_key: item.urlKey,
    source_type: item.sourceType,
    title: item.title,
    caption: item.caption,
    site_name: item.siteName,
    cover_path: item.coverUri ?? null,
    readable_text: item.readableText,
    link_state: item.linkState,
    note: item.note,
    extra_links: item.extraLinks,
    data: item.data,
    shared_at: item.sharedAt,
    last_opened_at: item.lastOpenedAt,
    open_count: item.openCount,
    enrich_state: item.enrichState,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    deleted_at: item.deletedAt,
  };
}

/** Map a Supabase `items` row to an app Item. */
export function rowToItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string,
    stage: row.stage as Item['stage'],
    collectionId: (row.collection_id as string) ?? null,
    statusId: (row.status_id as string) ?? null,
    sourceUrl: (row.source_url as string) ?? null,
    urlKey: (row.url_key as string) ?? null,
    sourceType: (row.source_type as Item['sourceType']) ?? 'other',
    title: (row.title as string) ?? null,
    caption: (row.caption as string) ?? null,
    siteName: (row.site_name as string) ?? null,
    coverUri: (row.cover_path as string) ?? null,
    readableText: (row.readable_text as string) ?? null,
    linkState: (row.link_state as Item['linkState']) ?? 'unknown',
    note: (row.note as string) ?? '',
    extraLinks: (row.extra_links as ExtraLink[]) ?? [],
    data: (row.data as Record<string, FieldValue>) ?? {},
    sharedAt: row.shared_at as string,
    lastOpenedAt: (row.last_opened_at as string) ?? null,
    openCount: (row.open_count as number) ?? 0,
    enrichState: (row.enrich_state as Item['enrichState']) ?? 'done',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string) ?? null,
  };
}

/** Build a partial update row from a partial Item. Only includes fields present in the patch. */
export function itemPatchToRow(patch: Partial<Item>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ('stage' in patch) row.stage = patch.stage;
  if ('collectionId' in patch) row.collection_id = patch.collectionId;
  if ('statusId' in patch) row.status_id = patch.statusId;
  if ('sourceUrl' in patch) row.source_url = patch.sourceUrl;
  if ('urlKey' in patch) row.url_key = patch.urlKey;
  if ('sourceType' in patch) row.source_type = patch.sourceType;
  if ('title' in patch) row.title = patch.title;
  if ('caption' in patch) row.caption = patch.caption;
  if ('siteName' in patch) row.site_name = patch.siteName;
  if ('coverUri' in patch) row.cover_path = patch.coverUri;
  if ('readableText' in patch) row.readable_text = patch.readableText;
  if ('linkState' in patch) row.link_state = patch.linkState;
  if ('note' in patch) row.note = patch.note;
  if ('extraLinks' in patch) row.extra_links = patch.extraLinks;
  if ('data' in patch) row.data = patch.data;
  if ('sharedAt' in patch) row.shared_at = patch.sharedAt;
  if ('lastOpenedAt' in patch) row.last_opened_at = patch.lastOpenedAt;
  if ('openCount' in patch) row.open_count = patch.openCount;
  if ('enrichState' in patch) row.enrich_state = patch.enrichState;
  if ('updatedAt' in patch) row.updated_at = patch.updatedAt;
  if ('deletedAt' in patch) row.deleted_at = patch.deletedAt;
  return row;
}

// ---------- Collection ----------

/** Map an app CollectionDef to a Supabase `collections` row for insert. */
export function collectionToRow(c: CollectionDef): Record<string, unknown> {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    built_in: c.builtIn,
    builtin_key: c.builtinKey ?? null,
    version: c.version,
    sort: c.sort,
    fields: c.fields,
    statuses: c.statuses,
  };
}

/** Map a Supabase `collections` row to an app CollectionDef. */
export function rowToCollection(row: Record<string, unknown>): CollectionDef {
  const builtin = row.builtin_key ? BUILTIN_COLLECTIONS.find((b) => b.builtinKey === row.builtin_key) : undefined;
  return {
    ...(builtin ?? {}),
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    builtIn: row.built_in as boolean,
    builtinKey: (row.builtin_key as string) ?? null,
    version: (row.version as number) ?? 1,
    sort: (row.sort as number) ?? 0,
    fields: (row.fields as CollectionDef['fields']) ?? [],
    statuses: (row.statuses as CollectionDef['statuses']) ?? [],
  };
}

// ---------- Reminder ----------

/** Map an app Reminder to a Supabase `reminders` row for insert. */
export function reminderToRow(r: Reminder): Record<string, unknown> {
  return {
    id: r.id,
    item_id: r.itemId,
    kind: r.kind,
    label: r.label,
    fire_at: r.fireAt,
    open_link: r.openLink,
    link_target: r.linkTarget,
    complete_marks_item: r.completeMarksItem,
    complete_status_id: r.completeStatusId,
    notify_phone: r.notifyPhone,
    notify_laptop: r.notifyLaptop,
    done_at: r.doneAt,
    created_at: r.createdAt,
  };
}

/** Map a Supabase `reminders` row to an app Reminder. */
export function rowToReminder(row: Record<string, unknown>): Reminder {
  return {
    id: row.id as string,
    itemId: row.item_id as string,
    kind: row.kind as Reminder['kind'],
    label: row.label as string,
    fireAt: (row.fire_at as string) ?? null,
    openLink: row.open_link as boolean,
    linkTarget: (row.link_target as string) ?? 'core',
    completeMarksItem: row.complete_marks_item as boolean,
    completeStatusId: (row.complete_status_id as string) ?? null,
    notifyPhone: row.notify_phone as boolean,
    notifyLaptop: row.notify_laptop as boolean,
    doneAt: (row.done_at as string) ?? null,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}
