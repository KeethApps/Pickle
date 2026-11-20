import React from 'react';
import { useRouter } from 'expo-router';
import { Button } from '../../src/ui/Button';
import { Sheet } from '../../src/ui/Sheet';
import { CollectionTiles } from '../../src/features/CollectionTiles';

/** "Add a card": pick a collection first, then fill in the details. */
export default function NewPicker() {
  const router = useRouter();
  return (
    <Sheet title="Add a card" subtitle="Pick a collection, then fill in the details">
      <CollectionTiles onPick={(c) => router.replace(`/new/${c.id}`)} onNew={() => router.replace('/collections/new')} />
      <Button label="Paste a link instead" icon="link" variant="ghost" style={{ marginTop: 18 }} onPress={() => router.replace('/paste')} />
    </Sheet>
  );
}
