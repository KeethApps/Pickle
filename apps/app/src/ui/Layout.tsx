import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, WIDE } from '../theme/tokens';
import { IconButton } from './Button';
import { Text } from './Text';

export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE;
}

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  bottomInset?: number;
  style?: ViewStyle;
  padded?: boolean;
}

/** Page container. Applies the safe area top inset and the standard side padding. */
export function Screen({ children, scroll = true, bottomInset = 0, style, padded = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  const pad = { paddingTop: wide ? 28 : Math.max(insets.top, 20) + 8, paddingHorizontal: padded ? (wide ? 32 : 20) : 0 };
  if (!scroll) return <View style={[styles.screen, pad, style]}>{children}</View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[pad, { paddingBottom: 40 + bottomInset }, style]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Header({ title, subtitle, onBack, right }: { title?: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      {onBack ? <IconButton icon="back" label="Back" onPress={onBack} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {title ? <Text v={onBack ? 'heading' : 'title'} numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text v="meta">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <Text v="caps" style={[{ marginTop: 20, marginBottom: 8 }, style]}>{children}</Text>;
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.rowCard, style]}>{children}</View>;
}

export function Segmented<T extends string>({ options, value, onChange }: { options: Array<{ value: T; label: string }>; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.seg}>
      {options.map((o) => (
        <Text
          key={o.value}
          accessibilityRole="button"
          onPress={() => onChange(o.value)}
          style={[styles.segItem, o.value === value && styles.segOn]}
          color={o.value === value ? colors.text : colors.muted}
          bold={o.value === value}
        >
          {o.label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  seg: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 99, padding: 4, alignSelf: 'flex-start' },
  segItem: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 99, fontSize: 12, overflow: 'hidden' },
  segOn: { backgroundColor: '#3A3A35' },
});
