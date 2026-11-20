import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header, Screen } from '../../../src/ui/Layout';
import { ItemForm } from '../../../src/features/ItemForm';
import { useCollection, useItem } from '../../../src/data/hooks';
import { useStore } from '../../../src/data/store';
import { extractDeadline, extractMinutes } from '@pickle/core';
import type { FieldValue } from '@pickle/core';

/** Edits a card, or finishes sorting an inbox card into the chosen collection. */
export default function EditItem() {
  const { id, collectionId } = useLocalSearchParams<{ id: string; collectionId?: string }>();
  const router = useRouter();
  const item = useItem(id);
  const collection = useCollection(collectionId ?? item?.collectionId ?? undefined);
  const saveItem = useStore((s) => s.saveItem);
  const sortItem = useStore((s) => s.sortItem);
  if (!item || !collection) return null;

  const sorting = item.stage === 'inbox';
  // Prefill from the caption: minutes into Time, a date after "deadline" into a date field.
  const prefill: Record<string, FieldValue> = {};
  if (sorting && item.caption) {
    const mins = extractMinutes(item.caption);
    const timeField = collection.fields.find((f) => f.type === 'duration' && f.unit === 'min' && f.filter);
    if (mins && timeField) prefill[timeField.id] = mins;
    const dl = extractDeadline(item.caption);
    const dateField = collection.fields.find((f) => f.type === 'date' && f.format === 'countdown');
    if (dl && dateField) prefill[dateField.id] = dl;
  }

  return (
    <Screen>
      <Header title={sorting ? collection.name : 'Edit'} subtitle={item.sourceUrl ?? 'Added by hand'} onBack={() => router.back()} />
      <ItemForm
        collection={collection}
        initial={item}
        initialData={prefill}
        mode={sorting ? 'sort' : 'edit'}
        submitLabel={sorting ? `Save to ${collection.name}` : 'Save changes'}
        onSubmit={(input) => {
          if (sorting) { sortItem(item.id, collection.id, input); router.dismissTo('/'); }
          else { saveItem(item.id, input); router.back(); }
        }}
      />
    </Screen>
  );
}
