import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { daysUntil, isDone, savedAgo, statusKindOf } from '@pickle/core';
import { colors } from '../../src/theme/tokens';
import { IconButton } from '../../src/ui/Button';
import { Cover } from '../../src/ui/Cover';
import { Input } from '../../src/ui/Inputs';
import { Header, Screen, useIsWide } from '../../src/ui/Layout';
import { Text } from '../../src/ui/Text';
import { Icon } from '../../src/ui/Icon';
import { useCollections, useSorted } from '../../src/data/hooks';
import { useState } from 'react';

export default function Library() {
  const router = useRouter();
  const wide = useIsWide();
  const collections = useCollections();
  const sorted = useSorted();
  const [seed, setSeed] = useState(0);

  // Rediscover: an open card saved a while ago and not opened in 30+ days.
  const pick = useMemo(() => {
    const pool = sorted.filter((i) => {
      const c = collections.find((x) => x.id === i.collectionId);
      if (!c) return false;
      const kind = statusKindOf(c, i);
      const idle = i.lastOpenedAt ? -daysUntil(i.lastOpenedAt) : 999;
      return (kind === 'open' || (kind === 'active' && idle > 30)) && idle >= 30;
    });
    return pool.length ? pool[seed % pool.length] : null;
  }, [sorted, collections, seed]);
  const pickCollection = collections.find((c) => c.id === pick?.collectionId);

  const hint = (id: string) => {
    const c = collections.find((x) => x.id === id)!;
    const items = sorted.filter((i) => i.collectionId === id);
    const open = items.filter((i) => statusKindOf(c, i) === 'open').length;
    if (id === 'opportunities') {
      const soon = items.filter((i) => !isDone(c, i) && typeof i.data.deadline === 'string' && daysUntil(String(i.data.deadline)) <= 14).length;
      return { text: `${soon} due soon`, warn: soon > 0 };
    }
    return { text: `${open} ${c.statuses[0].label.toLowerCase()}`, warn: false };
  };

  return (
    <Screen>
      <Header title="Library" subtitle={`${collections.length} collections · ${sorted.length} saved`} right={<IconButton icon="plus" label="Add card" onPress={() => router.push('/new')} />} />
      <Pressable accessibilityRole="search" onPress={() => router.push('/search')}>
        <View pointerEvents="none"><Input leftIcon="search" placeholder="Search everything" editable={false} /></View>
      </Pressable>

      {pick && pickCollection ? (
        <View style={styles.rediscover}>
          <View style={{ flex: 1 }}>
            <Text v="caps" color={colors.noteMuted} style={{ fontSize: 10 }}>Rediscover</Text>
            <Text bold numberOfLines={1} style={{ fontSize: 16, marginTop: 2 }} color={colors.noteInk}>{pick.title}</Text>
            <Text style={{ fontSize: 12 }} color={colors.noteMuted}>{pickCollection.name} · saved {savedAgo(pick.sharedAt)}</Text>
          </View>
          <Pressable accessibilityLabel="Shuffle" onPress={() => setSeed((s) => s + 1)} style={styles.shuffle}><Icon name="shuf" size={18} color={colors.noteInk} /></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push(`/item/${pick.id}`)} style={styles.openBtn}><Text bold color={colors.text} style={{ fontSize: 13 }}>Open</Text></Pressable>
        </View>
      ) : null}

      <View style={[styles.grid, wide && { gap: 14 }]}>
        {collections.map((c) => {
          const h = hint(c.id);
          return (
            <Pressable key={c.id} accessibilityRole="button" onPress={() => router.push(`/c/${c.id}`)} style={[styles.tile, wide && { width: '23%' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Cover tint={c.color} icon={c.icon} width={32} height={32} radius={10} iconSize={16} />
                <Text bold style={{ fontSize: 20 }}>{sorted.filter((i) => i.collectionId === c.id).length}</Text>
              </View>
              <View>
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13 }} numberOfLines={1}>{c.name}</Text>
                <Text v="meta" color={h.warn ? colors.warn : colors.muted} style={{ fontSize: 11 }}>{h.text}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rediscover: { backgroundColor: colors.note, borderRadius: 24, padding: 14, paddingLeft: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  shuffle: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(26,26,24,0.09)', alignItems: 'center', justifyContent: 'center' },
  openBtn: { height: 44, borderRadius: 14, backgroundColor: colors.noteInk, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  tile: { width: '48%', flexGrow: 1, minHeight: 82, backgroundColor: colors.surface, borderRadius: 18, padding: 12, justifyContent: 'space-between', gap: 10 },
});
