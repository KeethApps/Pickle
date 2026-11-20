import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, font } from '../theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled, style }: ButtonProps) {
  const bg = variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.surfaceHi;
  const fg = variant === 'ghost' ? colors.text : colors.accentInk;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }, style]}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={{ fontFamily: variant === 'ghost' ? font.medium : font.semibold, color: fg }}>{label}</Text>
    </Pressable>
  );
}

interface IconButtonProps {
  icon: string;
  label: string;
  onPress?: () => void;
  size?: number;
  bg?: string;
  color?: string;
  style?: ViewStyle;
}

export function IconButton({ icon, label, onPress, size = 44, bg = colors.surface, color = colors.text, style }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: radius.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 }, style]}
    >
      <Icon name={icon} size={20} color={color} />
    </Pressable>
  );
}

export function Spacer({ h = 12, w }: { h?: number; w?: number }) {
  return <View style={{ height: h, width: w }} />;
}

const styles = StyleSheet.create({
  btn: { minHeight: 50, borderRadius: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
