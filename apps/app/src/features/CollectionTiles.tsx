import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CollectionDef } from '@pickle/core';
import { colors } from '../theme/tokens';
import { Cover } from '../ui/Cover';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { useCollections } from '../data/hooks';

interface Props {
  onPick: (c: CollectionDef) => void;
  onNew?: () => void;
  suggestedId?: string | null;
}

/** Two-column grid of collections, used by the sort picker and the "Add a card" picker. */
export function CollectionTiles({ onPick, onNew, suggestedId }: Props) {
  const collections = useCollections();
  return (
    <View style={styles.grid}>
      {collections.map((c) => {
        const sug = c.id === suggestedId || (c.builtinKey && c.builtinKey === suggestedId);
        return (
          <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={c.name} onPress={() => onPick(c)} style={[styles.tile, sug && styles.sug]}>
            <Cover tint={c.color} icon={c.icon} width={34} height={34} radius={11} iconSize={17} />
            <Text style={{ flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 13 }} numberOfLines={1}>{c.name}</Text>
            {sug ? <View style={styles.tag}><Text bold color={colors.accentInk} style={{ fontSize: 10, lineHeight: 14 }}>Suggested</Text></View> : null}
          </Pressable>
        );
      })}
      {onNew ? (
        <Pressable accessibilityRole="button" accessibilityLabel="New collection" onPress={onNew} style={[styles.tile, { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#44443E' }]}>
          <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={17} color={colors.muted} /></View>
          <Text color={colors.muted} style={{ flex: 1, fontSize: 13 }}>New</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, rowGap: 14, paddingTop: 8 },
  tile: { width: '48%', flexGrow: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 18, padding: 11 },
  sug: { borderWidth: 2, borderColor: colors.accent },
  tag: { position: 'absolute', top: -10, right: 10, backgroundColor: colors.accent, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 1 },
});
