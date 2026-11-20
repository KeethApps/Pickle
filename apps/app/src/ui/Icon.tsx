import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ICONS } from './icons';

interface Props {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color = '#F0F0EC', strokeWidth = 1.8 }: Props) {
  const els = ICONS[name] ?? [];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {els.map(([tag, a], i) => {
        if (tag === 'path') return <Path key={i} d={a.d} />;
        if (tag === 'circle') return <Circle key={i} cx={Number(a.cx)} cy={Number(a.cy)} r={Number(a.r)} />;
        return <Rect key={i} x={Number(a.x)} y={Number(a.y)} width={Number(a.width)} height={Number(a.height)} rx={a.rx ? Number(a.rx) : 0} />;
      })}
    </Svg>
  );
}
