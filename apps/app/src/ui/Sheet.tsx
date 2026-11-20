import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { IconButton } from './Button';
import { Text } from './Text';
import { WIDE } from '../theme/tokens';

interface Props {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Fraction of the screen height the sheet may use. */
  maxHeight?: number;
  onClose?: () => void;
}

/**
 * Bottom sheet for modal routes (presentation: "transparentModal").
 * Tapping the scrim or the close button goes back.
 */
export function Sheet({ title, subtitle, children, footer, maxHeight = 0.9, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const close = onClose ?? (() => router.back());
  const wide = width >= WIDE;
  return (
    <View style={[styles.root, wide && { justifyContent: 'center', alignItems: 'center' }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
      <View style={[styles.sheet, { maxHeight: height * maxHeight, paddingBottom: Math.max(insets.bottom, 20) }, wide && { width: 520, borderRadius: 28 }]}>
        {!wide ? <View style={styles.grabber} /> : null}
        {title ? (
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text v="heading">{title}</Text>
              {subtitle ? <Text v="meta" numberOfLines={1} style={{ marginTop: 2 }}>{subtitle}</Text> : null}
            </View>
            <IconButton icon="x" label="Close" onPress={close} bg={colors.surfaceHi} />
          </View>
        ) : null}
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
        {footer ? <View style={{ marginTop: 14 }}>{footer}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: { backgroundColor: colors.chrome, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderColor: '#2A2A2A' },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#3A3A35', alignSelf: 'center', marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
});
