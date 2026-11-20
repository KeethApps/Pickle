import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { cardLayout } from '@pickle/core';
import type { CollectionDef, Item } from '@pickle/core';
import { colors, radius } from '../theme/tokens';
import { Cover } from '../ui/Cover';
import { Icon } from '../ui/Icon';
import { Pill } from '../ui/Chip';
import { Text } from '../ui/Text';

interface Props {
  item: Item;
  collection: CollectionDef;
  onPress?: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  coverHeight?: number;
}

/** Grid card, rendered entirely from the collection schema. */
export function ItemCard({ item, collection, onPress, selectMode, selected, onToggleSelect, coverHeight = 112 }: Props) {
  const v = cardLayout(collection, item);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={v.title}
      onPress={selectMode ? onToggleSelect : onPress}
      onLongPress={onToggleSelect}
      style={[styles.card, v.muted && { opacity: 0.6 }, selected && styles.selected]}
    >
      <Cover tint={v.tint} icon={v.icon} uri={v.coverUri} height={coverHeight}>
        {selectMode ? (
          <View style={[styles.check, selected && { backgroundColor: colors.accent, borderWidth: 0 }]}>{selected ? <Icon name="check" size={13} color={colors.accentInk} strokeWidth={3} /> : null}</View>
        ) : null}
        {v.badge ? (
          <View style={[styles.badge, v.badge.warn && { backgroundColor: colors.dangerSoft }]}>
            <Text style={{ fontSize: 11, lineHeight: 15 }} color={v.badge.warn ? colors.dangerText : colors.accent} bold>{v.badge.text}</Text>
          </View>
        ) : null}
        {v.offline ? (
          <View style={[styles.badge, { right: undefined, left: 8, bottom: 8, top: undefined }]}>
            <Text style={{ fontSize: 11, lineHeight: 15 }} color={colors.accent}>Offline</Text>
          </View>
        ) : null}
      </Cover>
      <View style={styles.body}>
        <Text numberOfLines={2} bold style={{ fontSize: 13, lineHeight: 17 }}>{v.title}</Text>
        {v.subtitle.length ? <Text v="meta" numberOfLines={1} style={{ marginTop: 2 }}>{v.subtitle.join(' · ')}</Text> : null}
        {v.large ? <Text bold style={{ fontSize: 18, marginTop: 4 }}>{v.large}</Text> : null}
        {v.line ? <Text v="meta" numberOfLines={1} color={colors.accent} style={{ marginTop: 4 }}>{v.line}</Text> : null}
        <View style={styles.pills}>
          {v.status && v.status.kind === 'active' ? <Pill label={v.status.label} tone="accent" /> : null}
          {v.pills.map((p) => <Pill key={p} label={p} />)}
          {v.linkDead ? <Pill label="Dead link" tone="danger" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', flex: 1 },
  selected: { borderWidth: 2, borderColor: colors.accent },
  body: { padding: 12, paddingTop: 10 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: { position: 'absolute', right: 8, top: 8, backgroundColor: 'rgba(26,26,24,0.8)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 2 },
  check: { position: 'absolute', left: 10, top: 10, width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.muted, backgroundColor: 'rgba(26,26,24,0.7)', alignItems: 'center', justifyContent: 'center' },
});
