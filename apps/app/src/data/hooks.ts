import { useMemo } from 'react';
import { useStore } from './store';
import type { CollectionDef, Item } from '@pickle/core';

export function useCollections(): CollectionDef[] {
  const c = useStore((s) => s.collections);
  return useMemo(() => [...c].sort((a, b) => a.sort - b.sort), [c]);
}

export function useCollection(id: string | undefined): CollectionDef | undefined {
  const c = useStore((s) => s.collections);
  return useMemo(() => c.find((x) => x.id === id || (x.builtinKey && x.builtinKey === id)), [c, id]);
}

export function useItem(id: string | undefined): Item | undefined {
  const items = useStore((s) => s.items);
  return useMemo(() => items.find((x) => x.id === id), [items, id]);
}

export function useInbox(): Item[] {
  const items = useStore((s) => s.items);
  return useMemo(() => items.filter((i) => i.stage === 'inbox' && !i.deletedAt).sort((a, b) => (a.sharedAt < b.sharedAt ? 1 : -1)), [items]);
}

export function useSorted(): Item[] {
  const items = useStore((s) => s.items);
  return useMemo(() => items.filter((i) => i.stage === 'sorted' && !i.deletedAt), [items]);
}

export { useAuth } from './auth';

