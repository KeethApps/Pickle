import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { colors, font } from '../theme/tokens';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'meta' | 'caps';

const variants = StyleSheet.create({
  title: { fontFamily: font.semibold, fontSize: 28, lineHeight: 32, letterSpacing: -0.4, color: colors.text },
  heading: { fontFamily: font.semibold, fontSize: 18, lineHeight: 23, color: colors.text },
  body: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.text },
  label: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: colors.text },
  meta: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: colors.muted },
  caps: { fontFamily: font.medium, fontSize: 11, lineHeight: 15, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.muted },
});

interface Props extends TextProps {
  v?: Variant;
  color?: string;
  bold?: boolean;
}

export function Text({ v = 'body', color, bold, style, ...rest }: Props) {
  return <RNText {...rest} style={[variants[v], color ? { color } : null, bold ? { fontFamily: font.semibold } : null, style]} />;
}
