import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';

export function KV({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.kv, wide && { width: '100%' }]}>
      <Text v="caps" style={{ fontSize: 10 }}>{label}</Text>
      <Text style={{ fontFamily: 'Poppins_500Medium', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

export function KVGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function CheckRow({ text, done, onPress }: { text: string; done: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={onPress} style={styles.check}>
      <View style={[styles.box, done && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
        {done ? <Icon name="check" size={12} color={colors.accentInk} strokeWidth={3} /> : null}
      </View>
      <Text style={done ? { color: colors.faint, textDecorationLine: 'line-through' } : undefined}>{text}</Text>
    </Pressable>
  );
}

export function LinkRow({ title, sub, onPress, onRemove }: { title: string; sub: string; onPress: () => void; onRemove?: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.link}>
      <Icon name="link" size={16} color={colors.muted} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: 'Poppins_500Medium', fontSize: 13 }}>{title}</Text>
        <Text v="meta" numberOfLines={1} style={{ fontSize: 11 }}>{sub}</Text>
      </View>
      {onRemove ? <Pressable accessibilityLabel={`Remove ${title}`} onPress={onRemove} hitSlop={10}><Icon name="x" size={16} color={colors.faint} /></Pressable> : <Icon name="ext" size={16} color={colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kv: { width: '48.5%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  box: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#6E7066', alignItems: 'center', justifyContent: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 6 },
});
