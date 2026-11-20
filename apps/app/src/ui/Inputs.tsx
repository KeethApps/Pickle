import React from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, font, radius } from '../theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export function Input(props: TextInputProps & { leftIcon?: string }) {
  const { leftIcon, style, ...rest } = props;
  return (
    <View style={[styles.wrap, rest.multiline && { alignItems: 'flex-start', paddingTop: 12 }]}>
      {leftIcon ? <Icon name={leftIcon} size={18} color={colors.faint} /> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        {...rest}
        style={[styles.input, rest.multiline && { minHeight: 84, textAlignVertical: 'top' }, style]}
      />
    </View>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={() => onChange(!on)}
      style={[styles.toggle, { backgroundColor: on ? colors.accent : '#3A3A35' }]}
    >
      <View style={[styles.knob, on ? { right: 3, backgroundColor: colors.accentInk } : { left: 3, backgroundColor: colors.muted }]} />
    </Pressable>
  );
}

export function Stepper({ value, onChange, min = 0, max = 999 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityLabel="Decrease" onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepBtn}>
        <Icon name="minus" size={16} />
      </Pressable>
      <Text bold style={{ minWidth: 28, textAlign: 'center', fontSize: 16 }}>{value}</Text>
      <Pressable accessibilityLabel="Increase" onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepBtn}>
        <Icon name="plus" size={16} />
      </Pressable>
    </View>
  );
}

export function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} accessibilityLabel={`${n} stars`} onPress={() => onChange?.(n === value ? 0 : n)}>
          <Icon name="star" size={22} color={n <= value ? colors.accent : '#5A5C54'} strokeWidth={1.6} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14, minHeight: 48 },
  input: { flex: 1, color: colors.text, fontFamily: font.regular, fontSize: 14, paddingVertical: 10 },
  toggle: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  knob: { position: 'absolute', top: 3, width: 20, height: 20, borderRadius: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: 99, padding: 4, alignSelf: 'flex-start' },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceTop, alignItems: 'center', justifyContent: 'center' },
});
