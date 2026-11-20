import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

interface ChipProps {
  label: string;
  on?: boolean;
  onPress?: () => void;
  icon?: string;
  count?: number | string;
  dashed?: boolean;
  trailingIcon?: string;
}

export function Chip({ label, on, onPress, icon, count, dashed, trailingIcon }: ChipProps) {
  const fg = on ? colors.accentInk : colors.textBody;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={[styles.chip, on && styles.on, dashed && styles.dashed]}
    >
      {icon ? <Icon name={icon} size={14} color={fg} strokeWidth={2} /> : null}
      <Text v="meta" color={fg} style={{ fontWeight: on ? '600' : '400' }}>{label}</Text>
      {count !== undefined ? <Text v="meta" color={fg} style={{ opacity: 0.6, fontSize: 11 }}>{count}</Text> : null}
      {trailingIcon ? <Icon name={trailingIcon} size={12} color={fg} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

export function ChipRow({ children, wrap = true }: { children: React.ReactNode; wrap?: boolean }) {
  return <View style={{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap: 8 }}>{children}</View>;
}

export function Pill({ label, tone = 'default', icon }: { label: string; tone?: 'default' | 'accent' | 'danger' | 'dark'; icon?: string }) {
  const bg = tone === 'accent' ? colors.accentSoft : tone === 'danger' ? colors.dangerSoft : tone === 'dark' ? 'rgba(26,26,24,0.8)' : colors.surfaceTop;
  const fg = tone === 'accent' ? colors.accent : tone === 'danger' ? colors.dangerText : colors.textBody;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={11} color={fg} strokeWidth={2.4} /> : null}
      <Text style={{ fontSize: 11, lineHeight: 15, color: fg }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 36, borderRadius: radius.pill, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 6 },
  on: { backgroundColor: colors.accent, borderColor: colors.accent },
  dashed: { borderStyle: 'dashed', borderColor: '#44443E' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 3, alignSelf: 'flex-start' },
});
