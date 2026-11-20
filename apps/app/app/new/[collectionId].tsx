import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header, Screen } from '../../src/ui/Layout';
import { ItemForm } from '../../src/features/ItemForm';
import { useCollection } from '../../src/data/hooks';
import { useStore } from '../../src/data/store';

/** Create a card by hand. Only the name is required, and it goes straight into the collection. */
export default function NewCard() {
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  const router = useRouter();
  const collection = useCollection(collectionId);
  const createItem = useStore((s) => s.createItem);
  if (!collection) return null;
  return (
    <Screen>
      <Header title={`New ${collection.name.replace(/s$/, '').toLowerCase()}`} subtitle="Added by hand" onBack={() => router.back()} />
      <ItemForm
        collection={collection}
        mode="new"
        submitLabel={`Save to ${collection.name}`}
        onSubmit={(input) => {
          const res = createItem(collection.id, input);
          if (res.error) return res.error;
          if (res.duplicate) return 'That link is already saved. Open it from your Library or search.';
          if (res.item) router.replace(`/item/${res.item.id}`);
        }}
      />
    </Screen>
  );
}
