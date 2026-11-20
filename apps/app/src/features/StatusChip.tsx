import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import type { CollectionDef, StatusDef } from '@pickle/core';
import { colors } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';

interface Props {
  collection: CollectionDef;
  statusId: string | null;
  onChange: (statusId: string) => void;
}

export function StatusDot({ status, size = 10 }: { status: StatusDef; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: status.color }} />;
}

/** The status pill; tapping it opens that collection's own status list. */
export function StatusChip({ collection, statusId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = collection.statuses.find((s) => s.id === statusId) ?? collection.statuses[0];
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Status: ${current.label}`} onPress={() => setOpen(true)} style={styles.chip}>
        <StatusDot status={current} size={8} />
        <Text style={{ fontSize: 11, lineHeight: 15 }} color={colors.textBody}>{current.label}</Text>
        <Icon name="chev" size={11} color={colors.muted} strokeWidth={2.4} />
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <Text v="caps" style={{ marginBottom: 8 }}>Status</Text>
            {collection.statuses.map((s) => (
              <Pressable key={s.id} style={styles.opt} onPress={() => { onChange(s.id); setOpen(false); }} accessibilityRole="button">
                <StatusDot status={s} />
                <Text style={{ flex: 1 }}>{s.label}</Text>
                {s.id === current.id ? <Icon name="check" size={16} color={colors.accent} strokeWidth={2.4} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceHi, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 4 },
  scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 },
  menu: { width: '100%', maxWidth: 340, backgroundColor: colors.chrome, borderRadius: 24, padding: 18 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 6 },
});
