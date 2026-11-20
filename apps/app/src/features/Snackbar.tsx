import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { Text } from '../ui/Text';
import { useStore } from '../data/store';
import { useIsWide } from '../ui/Layout';

/** Shows "Deleted … Undo" for five seconds. */
export function Snackbar() {
  const undo = useStore((s) => s.undoState);
  const dismiss = useStore((s) => s.dismissUndo);
  const insets = useSafeAreaInsets();
  const wide = useIsWide();

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(dismiss, 5000);
    return () => clearTimeout(t);
  }, [undo?.id]);

  if (!undo) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: (wide ? 24 : 96) + (wide ? 0 : insets.bottom) }]}>
      <View style={styles.bar}>
        <Text style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>{undo.message}</Text>
        <Pressable accessibilityRole="button" onPress={() => { undo.undo(); dismiss(); }} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}>
          <Text bold color={colors.accent} style={{ fontSize: 13 }}>Undo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  bar: { width: '100%', maxWidth: 420, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceTop, borderRadius: 14, minHeight: 48, paddingLeft: 16, paddingRight: 4 },
});
