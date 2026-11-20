import type { CollectionDef, FieldDef, FieldValue, Item } from './types';
import { addDays, toIsoDate } from './dates';
import { formatDuration } from './format';
import { getStatus } from './status';

export type FilterOp = 'in' | 'lte' | 'gte' | 'is' | 'before';
export interface Filter {
  fieldId: string;
  op: FilterOp;
  value: string[] | number | boolean | string;
}
export type StatusScope = 'all' | 'notDone' | 'done';
export type SortKey = 'newest' | 'soonest' | 'title';

export interface Query {
  text: string;
  filters: Filter[];
  statusScope: StatusScope;
  sort: SortKey;
}

export const emptyQuery = (collection?: CollectionDef): Query => ({
  text: '',
  filters: [],
  statusScope: 'all',
  sort: collection ? defaultSort(collection) : 'newest',
});

export function dateFieldOf(collection: CollectionDef): FieldDef | undefined {
  return collection.fields.find((f) => f.type === 'date' && (f.slot === 'badge' || f.filter));
}

export function defaultSort(collection: CollectionDef): SortKey {
  return dateFieldOf(collection) ? 'soonest' : 'newest';
}

function asList(v: FieldValue | undefined): string[] {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  return [String(v)];
}

function matchesFilter(item: Item, f: Filter): boolean {
  const v = item.data[f.fieldId];
  switch (f.op) {
    case 'in': {
      const wanted = f.value as string[];
      if (wanted.length === 0) return true;
      const have = asList(v);
      return wanted.some((w) => have.includes(w));
    }
    case 'lte': return typeof v === 'number' && v <= (f.value as number);
    case 'gte': return typeof v === 'number' && v >= (f.value as number);
    case 'is': {
      if (typeof f.value === 'boolean') return Boolean(v) === f.value;
      return String(v ?? '') === String(f.value);
    }
    case 'before': return typeof v === 'string' && v !== '' && v <= String(f.value);
    default: return true;
  }
}

function haystack(item: Item): string {
  const parts: string[] = [item.title ?? '', item.note, item.caption ?? '', item.readableText ?? '', item.siteName ?? ''];
  for (const link of item.extraLinks) parts.push(link.label);
  for (const v of Object.values(item.data)) {
    if (typeof v === 'string') parts.push(v);
    else if (Array.isArray(v)) {
      for (const x of v) {
        if (typeof x === 'string') parts.push(x);
        else if (x && typeof x === 'object' && 'name' in x) parts.push(String((x as { name: string }).name));
      }
    }
  }
  return parts.join(' ').toLowerCase();
}

export function matchesText(item: Item, text: string): boolean {
  const terms = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const h = haystack(item);
  return terms.every((t) => h.includes(t));
}

export function sortItems(items: Item[], collection: CollectionDef, sort: SortKey): Item[] {
  const copy = [...items];
  if (sort === 'title') return copy.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
  if (sort === 'soonest') {
    const field = dateFieldOf(collection);
    if (field) {
      return copy.sort((a, b) => {
        const av = typeof a.data[field.id] === 'string' ? String(a.data[field.id]) : '';
        const bv = typeof b.data[field.id] === 'string' ? String(b.data[field.id]) : '';
        if (!av && !bv) return 0;
        if (!av) return 1;
        if (!bv) return -1;
        return av < bv ? -1 : av > bv ? 1 : 0;
      });
    }
  }
  return copy.sort((a, b) => (a.sharedAt < b.sharedAt ? 1 : a.sharedAt > b.sharedAt ? -1 : 0));
}

export function applyQuery(items: Item[], collection: CollectionDef, q: Query): Item[] {
  const out = items.filter((item) => {
    if (item.deletedAt || item.collectionId !== collection.id || item.stage !== 'sorted') return false;
    const kind = getStatus(collection, item.statusId)?.kind;
    if (q.statusScope === 'notDone' && kind === 'done') return false;
    if (q.statusScope === 'done' && kind !== 'done') return false;
    if (!matchesText(item, q.text)) return false;
    return q.filters.every((f) => matchesFilter(item, f));
  });
  return sortItems(out, collection, q.sort);
}

export interface Facet { value: string; count: number }

/** Counts of values actually in use, for the filter chips. */
export function facetCounts(items: Item[], collection: CollectionDef, field: FieldDef): Facet[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.deletedAt || item.collectionId !== collection.id || item.stage !== 'sorted') continue;
    for (const v of asList(item.data[field.id])) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export interface RangePreset { label: string; filter: Omit<Filter, 'fieldId'> }

/** Quick range chips for number, duration, money and date fields. */
export function rangePresets(field: FieldDef, now: Date = new Date()): RangePreset[] {
  if (field.type === 'duration' && field.unit === 'sec') {
    return [
      { label: '≤ 10 min', filter: { op: 'lte', value: 600 } },
      { label: '≤ 30 min', filter: { op: 'lte', value: 1800 } },
      { label: '30+ min', filter: { op: 'gte', value: 1800 } },
    ];
  }
  if (field.type === 'duration') {
    const steps = field.id === 'read_time' ? [5, 10] : field.id === 'duration' ? [15, 20, 30] : [15, 30, 45];
    return steps.map((n) => ({ label: `≤ ${n}`, filter: { op: 'lte' as const, value: n } }));
  }
  if (field.type === 'number' && field.unit === 'pages') {
    return [
      { label: '≤ 200', filter: { op: 'lte', value: 200 } },
      { label: '≤ 350', filter: { op: 'lte', value: 350 } },
      { label: '350+', filter: { op: 'gte', value: 350 } },
    ];
  }
  if (field.type === 'money') {
    return [
      { label: '≤ 25', filter: { op: 'lte', value: 25 } },
      { label: '≤ 50', filter: { op: 'lte', value: 50 } },
      { label: '≤ 100', filter: { op: 'lte', value: 100 } },
      { label: '100+', filter: { op: 'gte', value: 100 } },
    ];
  }
  if (field.type === 'date') {
    return [
      { label: 'This week', filter: { op: 'before', value: toIsoDate(addDays(now, 7)) } },
      { label: 'This month', filter: { op: 'before', value: toIsoDate(addDays(now, 30)) } },
    ];
  }
  return [];
}

export function hasRangeFilter(field: FieldDef): boolean {
  return rangePresets(field).length > 0;
}

/** Short text for an active filter chip. */
export function describeFilter(field: FieldDef, f: Filter): string {
  switch (f.op) {
    case 'in': return (f.value as string[]).join(', ');
    case 'lte': {
      const n = f.value as number;
      if (field.type === 'duration') return `≤ ${field.unit === 'sec' ? formatDuration(n, 'sec') : `${n} min`}`;
      return `≤ ${n}`;
    }
    case 'gte': return `${f.value}+`;
    case 'before': return 'Soon';
    case 'is': return typeof f.value === 'boolean' ? `${field.label}: ${f.value ? 'Yes' : 'No'}` : String(f.value);
    default: return field.label;
  }
}
