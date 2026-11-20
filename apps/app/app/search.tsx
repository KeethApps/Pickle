import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { matchesText } from '@pickle/core';
import { colors } from '../src/theme/tokens';
import { IconButton } from '../src/ui/Button';
import { Chip } from '../src/ui/Chip';
import { Input } from '../src/ui/Inputs';
import { Screen } from '../src/ui/Layout';
import { Text } from '../src/ui/Text';
import { ItemRow } from '../src/features/ItemRow';
import { useCollections, useSorted } from '../src/data/hooks';

/** Global search, grouped by collection. It also searches saved article text. */
export default function SearchScreen() {
  const router = useRouter();
  const collections = useCollections();
  const sorted = useSorted();
  const [text, setText] = useState('');
  const [scope, setScope] = useState<string>('all');

  const results = useMemo(() => {
    if (!text.trim()) return [];
    return sorted.filter((i) => matchesText(i, text));
  }, [sorted, text]);

  const groups = collections
    .map((c) => ({ c, items: results.filter((i) => i.collectionId === c.id) }))
    .filter((g) => g.items.length && (scope === 'all' || scope === g.c.id));

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <IconButton icon="back" label="Back" onPress={() => router.back()} />
        <View style={{ flex: 1 }}><Input leftIcon="search" autoFocus value={text} onChangeText={setText} placeholder="Search everything" /></View>
      </View>
      {results.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="All" count={results.length} on={scope === 'all'} onPress={() => setScope('all')} />
          {collections.map((c) => { const n = results.filter((i) => i.collectionId === c.id).length; return n ? <Chip key={c.id} label={c.name} count={n} on={scope === c.id} onPress={() => setScope(c.id)} /> : null; })}
        </View>
      ) : null}
      {groups.map(({ c, items }) => (
        <View key={c.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.color }} />
            <Text v="caps">{c.name}</Text><Text v="meta">{items.length}</Text>
          </View>
          {items.map((i) => (
            <ItemRow key={i.id} item={i} collection={c} onPress={() => router.push(`/item/${i.id}`)}
              highlight={i.readableText && !(i.title ?? '').toLowerCase().includes(text.toLowerCase()) && i.readableText.toLowerCase().includes(text.toLowerCase()) ? 'Matched in saved text' : undefined} />
          ))}
        </View>
      ))}
      {text.trim() && results.length === 0 ? <Text color={colors.muted} style={{ textAlign: 'center', marginTop: 30 }}>No matches.</Text> : null}
      {!text.trim() ? <Text v="meta" style={{ textAlign: 'center', marginTop: 24 }}>Searches titles, notes, captions and saved article text</Text> : null}
    </Screen>
  );
}
