import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Sheet } from '../../src/ui/Sheet';
import { CollectionTiles } from '../../src/features/CollectionTiles';
import { useItem } from '../../src/data/hooks';
import { suggestFor, useStore } from '../../src/data/store';
import { BUILTIN_COLLECTIONS } from '@pickle/core';

export default function SortSheet() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const item = useItem(itemId);
  const history = useStore((s) => s.history);
  if (!item) return null;
  const key = suggestFor(item, history);
  const suggested = BUILTIN_COLLECTIONS.find((c) => c.builtinKey === key)?.id ?? null;
  return (
    <Sheet title="Where does it go?" subtitle={item.title ?? undefined}>
      <CollectionTiles
        suggestedId={suggested}
        onPick={(c) => router.replace({ pathname: `/item/${item.id}/edit`, params: { collectionId: c.id } })}
        onNew={() => router.replace('/collections/new')}
      />
    </Sheet>
  );
}
