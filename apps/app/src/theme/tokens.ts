export const colors = {
  bg: '#1A1A18',
  surface: '#242420',
  surfaceHi: '#2A2A26',
  surfaceTop: '#2E2E2A',
  line: '#33332E',
  chrome: '#1F1F1C',
  text: '#F0F0EC',
  textBody: '#D6D8CC',
  muted: '#AAADA0',
  faint: '#8C8E84',
  accent: '#D4E157',
  accentInk: '#1A1A18',
  accentSoft: 'rgba(212,225,87,0.14)',
  note: '#E8ECC8',
  noteInk: '#1A1A18',
  noteMuted: '#5A5C48',
  danger: '#CF6679',
  dangerSoft: 'rgba(207,102,121,0.2)',
  dangerText: '#E8899A',
  warn: '#E5B567',
  scrim: 'rgba(0,0,0,0.62)',
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, xxl: 28, pill: 99 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

/** Layout switches to the two- and three-pane laptop layout at this width. */
export const WIDE = 900;

export const SWATCHES = ['#E39B6B', '#E07A7A', '#7FB6D9', '#6FD0C8', '#9AD17A', '#E6C86E', '#B79AE0', '#E58BB4', '#8DA4E8', '#D4E157'];
export const STATUS_COLORS = ['#AAADA0', '#D4E157', '#8FD3C4', '#E39B6B', '#7FB6D9', '#B79AE0', '#6E7066'];

/** Mix a hex color toward the card surface, used for tinted covers. */
export function tintBg(hex: string, amount = 0.28): string {
  const base = [0x24, 0x24, 0x20];
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixed = rgb.map((c, i) => Math.round(base[i] + (c - base[i]) * amount));
  return `rgb(${mixed[0]},${mixed[1]},${mixed[2]})`;
}
