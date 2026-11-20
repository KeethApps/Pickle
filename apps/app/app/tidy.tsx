import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { daysUntil, isDone, savedAgo } from '@pickle/core';
import { colors } from '../src/theme/tokens';
import { Button } from '../src/ui/Button';
import { Chip } from '../src/ui/Chip';
import { Icon } from '../src/ui/Icon';
import { Header, Screen } from '../src/ui/Layout';
import { Text } from '../src/ui/Text';
import { ItemRow } from '../src/features/ItemRow';
import { useCollections, useSorted } from '../src/data/hooks';
import { useStore } from '../src/data/store';

/** Old, unopened cards, and links that stopped working. Select and delete in bulk. */
export default function Tidy() {
  const router = useRouter();
  const collections = useCollections();
  const sorted = useSorted();
  const deleteMany = useStore((s) => s.deleteMany);
  const [tab, setTab] = useState<'old' | 'dead'>('old');
  const [picked, setPicked] = useState<string[]>([]);

  const old = useMemo(() => sorted.filter((i) => {
    const c = collections.find((x) => x.id === i.collectionId);
    if (!c || isDone(c, i)) return false;
    const saved = -daysUntil(i.sharedAt);
    const opened = i.lastOpenedAt ? -daysUntil(i.lastOpenedAt) : Infinity;
    return saved >= 90 && opened >= 90;
  }), [sorted, collections]);
  const dead = useMemo(() => sorted.filter((i) => i.linkState === 'dead'), [sorted]);
  const list = tab === 'old' ? old : dead;

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen bottomInset={100}>
        <Header title="Tidy up" subtitle={`${list.length} items`} onBack={() => router.back()} right={<Pressable onPress={() => setPicked(list.map((i) => i.id))}><Text color={colors.accent} style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, padding: 12 }}>Select all</Text></Pressable>} />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          <Chip label="90+ days, never opened" count={old.length} on={tab === 'old'} onPress={() => { setTab('old'); setPicked([]); }} />
          <Chip label="Dead links" count={dead.length} on={tab === 'dead'} onPress={() => { setTab('dead'); setPicked([]); }} />
        </View>
        {list.map((i) => {
          const c = collections.find((x) => x.id === i.collectionId);
          const on = picked.includes(i.id);
          return (
            <ItemRow key={i.id} item={i} collection={c} meta={`${c?.name ?? ''} · saved ${savedAgo(i.sharedAt)}${i.linkState === 'dead' ? ' · dead link' : ''}`} onPress={() => toggle(i.id)}
              trailing={<View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? colors.accent : '#6E7066', backgroundColor: on ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on ? <Icon name="check" size={12} color={colors.accentInk} strokeWidth={3} /> : null}</View>} />
          );
        })}
        {list.length === 0 ? <Text color={colors.muted} style={{ textAlign: 'center', marginTop: 30 }}>Nothing to tidy.</Text> : null}
      </Screen>
      {picked.length ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.chrome, borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}><Text bold>{picked.length} selected</Text><Text v="meta">Deleted items stay in Trash for 30 days</Text></View>
          <Button label="Keep" variant="ghost" onPress={() => setPicked([])} />
          <Button label="Delete" variant="danger" onPress={() => { deleteMany(picked); setPicked([]); }} />
        </View>
      ) : null}
    </View>
  );
}
