import { create } from 'zustand';
import { emptyQuery } from '@pickle/core';
import type { CollectionDef, Filter, Query, SortKey, StatusScope } from '@pickle/core';

interface QState {
  queries: Record<string, Query>;
  get: (c: CollectionDef) => Query;
  setText: (c: CollectionDef, text: string) => void;
  setScope: (c: CollectionDef, scope: StatusScope) => void;
  setSort: (c: CollectionDef, sort: SortKey) => void;
  toggleIn: (c: CollectionDef, fieldId: string, value: string) => void;
  setRange: (c: CollectionDef, fieldId: string, f: Omit<Filter, 'fieldId'> | null) => void;
  setBool: (c: CollectionDef, fieldId: string, value: boolean | null) => void;
  removeFilter: (c: CollectionDef, index: number) => void;
  clear: (c: CollectionDef) => void;
}

export const useQueryStore = create<QState>()((set, get) => {
  const update = (c: CollectionDef, fn: (q: Query) => Query) =>
    set((s) => ({ queries: { ...s.queries, [c.id]: fn(s.queries[c.id] ?? emptyQuery(c)) } }));
  return {
    queries: {},
    get: (c) => get().queries[c.id] ?? emptyQuery(c),
    setText: (c, text) => update(c, (q) => ({ ...q, text })),
    setScope: (c, statusScope) => update(c, (q) => ({ ...q, statusScope })),
    setSort: (c, sort) => update(c, (q) => ({ ...q, sort })),
    toggleIn: (c, fieldId, value) =>
      update(c, (q) => {
        const existing = q.filters.find((f) => f.fieldId === fieldId && f.op === 'in');
        const current = (existing?.value as string[] | undefined) ?? [];
        const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
        const rest = q.filters.filter((f) => !(f.fieldId === fieldId && f.op === 'in'));
        return { ...q, filters: next.length ? [...rest, { fieldId, op: 'in', value: next }] : rest };
      }),
    setRange: (c, fieldId, f) =>
      update(c, (q) => {
        const rest = q.filters.filter((x) => x.fieldId !== fieldId || x.op === 'in');
        const same = q.filters.find((x) => x.fieldId === fieldId && x.op !== 'in' && f && x.op === f.op && x.value === f.value);
        return { ...q, filters: f && !same ? [...rest, { fieldId, ...f }] : rest };
      }),
    setBool: (c, fieldId, value) =>
      update(c, (q) => {
        const rest = q.filters.filter((x) => x.fieldId !== fieldId);
        return { ...q, filters: value === null ? rest : [...rest, { fieldId, op: 'is', value }] };
      }),
    removeFilter: (c, index) => update(c, (q) => ({ ...q, filters: q.filters.filter((_, i) => i !== index) })),
    clear: (c) => update(c, (q) => ({ ...q, filters: [], text: '', statusScope: 'all' })),
  };
});
