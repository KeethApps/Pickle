import React from 'react';
import { Image, View, ViewStyle } from 'react-native';
import { tintBg } from '../theme/tokens';
import { Icon } from './Icon';

interface Props {
  tint: string;
  icon: string;
  uri?: string | null;
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  iconSize?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function Cover({ tint, icon, uri, width = '100%', height, radius = 0, iconSize = 34, children, style }: Props) {
  return (
    <View style={[{ width, height, borderRadius: radius, backgroundColor: tintBg(tint), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
      {uri ? <Image source={{ uri }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" /> : <Icon name={icon} size={iconSize} color={tint} strokeWidth={1.4} />}
      {children}
    </View>
  );
}
