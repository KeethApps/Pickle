import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { cardLayout } from '@pickle/core';
import type { CollectionDef, Item } from '@pickle/core';
import { colors } from '../theme/tokens';
import { Cover } from '../ui/Cover';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';

interface Props {
  item: Item;
  collection: CollectionDef | undefined;
  onPress?: () => void;
  trailing?: React.ReactNode;
  meta?: string;
  highlight?: string;
}

/** Compact row for search, tidy up and lists. */
export function ItemRow({ item, collection, onPress, trailing, meta, highlight }: Props) {
  const v = collection ? cardLayout(collection, item) : null;
  const tint = collection?.color ?? colors.accent;
  const sub = meta ?? (v ? [collection?.name, ...v.subtitle].filter(Boolean).join(' · ') : 'Inbox');
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Cover tint={tint} icon={collection?.icon ?? 'link'} width={44} height={44} radius={12} iconSize={20} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: 'Poppins_500Medium' }}>{item.title ?? 'Untitled'}</Text>
        <Text v="meta" numberOfLines={1}>{sub}</Text>
        {highlight ? <Text v="meta" color={colors.accent} numberOfLines={1}>{highlight}</Text> : null}
      </View>
      {trailing ?? <Icon name="chev" size={16} color={colors.faint} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 10, marginBottom: 8 },
});
