import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/tokens';
import { Button } from '../ui/Button';
import { Chip, ChipRow } from '../ui/Chip';
import { Cover } from '../ui/Cover';
import { Text } from '../ui/Text';
import { Header } from '../ui/Layout';
import { useCollection, useCollections, useInbox } from '../data/hooks';
import { useStore, suggestFor } from '../data/store';
import { openUrl } from '../data/links';
import { ItemForm } from './ItemForm';
import { hostLabel, savedAgo, BUILTIN_COLLECTIONS } from '@pickle/core';

/** Laptop triage: list on the left, edit panel on the right, keyboard shortcuts. */
export function InboxWide() {
  const router = useRouter();
  const inbox = useInbox();
  const collections = useCollections();
  const history = useStore((s) => s.history);
  const sortItem = useStore((s) => s.sortItem);
  const deleteItem = useStore((s) => s.deleteItem);
  const markOpened = useStore((s) => s.markOpened);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const selected = inbox.find((i) => i.id === selectedId) ?? inbox[0] ?? null;
  const suggestion = selected ? BUILTIN_COLLECTIONS.find((c) => c.builtinKey === suggestFor(selected, history))?.id ?? null : null;
  const activeCollectionId = collectionId ?? suggestion;
  const collection = useCollection(activeCollectionId ?? undefined);

  useEffect(() => { setCollectionId(null); }, [selected?.id]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !selected) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA'].includes(t.tagName)) return;
      const idx = inbox.findIndex((i) => i.id === selected.id);
      if (e.key === 'ArrowLeft') { e.preventDefault(); deleteItem(selected.id); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); router.push(`/item/${selected.id}/remind`); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); router.push(`/sort/${selected.id}`); }
      else if (e.key === 'o') { markOpened(selected.id); openUrl(selected.sourceUrl); }
      else if (e.key === 'j') setSelectedId(inbox[Math.min(inbox.length - 1, idx + 1)]?.id ?? null);
      else if (e.key === 'k') setSelectedId(inbox[Math.max(0, idx - 1)]?.id ?? null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected?.id, inbox.length]);

  const left = useMemo(() => inbox, [inbox]);

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      <ScrollView style={styles.list} contentContainerStyle={{ padding: 24 }}>
        <Header title="Inbox" subtitle={`${left.length} to sort`} right={<Button label="Paste a link" icon="link" variant="ghost" onPress={() => router.push('/paste')} />} />
        {left.map((i) => (
          <Pressable key={i.id} accessibilityRole="button" onPress={() => setSelectedId(i.id)} style={[styles.row, selected?.id === i.id && styles.rowOn]}>
            <Cover tint={colors.accent} icon="link" width={48} height={48} radius={12} iconSize={20} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontFamily: 'Poppins_500Medium' }}>{i.title}</Text>
              <Text v="meta">{i.sourceUrl ? hostLabel(i.sourceUrl) : 'manual'} · {savedAgo(i.sharedAt)}</Text>
            </View>
          </Pressable>
        ))}
        {left.length === 0 ? <Text v="meta">Inbox zero. Share a link to Pickle or paste one.</Text> : null}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 40, maxWidth: 760 }} keyboardShouldPersistTaps="handled">
        {selected ? (
          <>
            <Text v="meta" style={{ marginBottom: 8 }}>{selected.sourceUrl} · saved {savedAgo(selected.sharedAt)}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
              <Button label="Open link" icon="ext" variant="ghost" onPress={() => { markOpened(selected.id); openUrl(selected.sourceUrl); }} />
              <Button label="Remind" icon="bell" variant="ghost" onPress={() => router.push(`/item/${selected.id}/remind`)} />
              <Button label="Delete" icon="trash" variant="ghost" onPress={() => deleteItem(selected.id)} />
            </View>
            <Text v="caps" style={{ marginTop: 18, marginBottom: 8 }}>Collection</Text>
            <ChipRow>
              {collections.map((c) => <Chip key={c.id} label={c.name} on={c.id === activeCollectionId} onPress={() => setCollectionId(c.id)} />)}
            </ChipRow>
            {collection ? (
              <View style={{ marginTop: 8 }} key={`${selected.id}-${collection.id}`}>
                <ItemForm
                  collection={collection}
                  initial={{ ...selected, data: selected.data }}
                  mode="sort"
                  submitLabel={`Sort to ${collection.name}`}
                  onSubmit={(input) => { sortItem(selected.id, collection.id, input); }}
                />
              </View>
            ) : <Text v="meta" style={{ marginTop: 16 }}>Pick a collection to fill in the details.</Text>}
            <Text v="meta" style={{ marginTop: 18 }}>Keys: ↑ sort · ← delete · → remind · o open link · j / k next and previous</Text>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { width: 460, borderRightWidth: 1, borderRightColor: '#2A2A2A' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.surface, marginBottom: 8 },
  rowOn: { borderWidth: 2, borderColor: colors.accent },
});
