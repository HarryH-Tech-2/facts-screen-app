export interface Palette {
  bgTop: string;
  bgMid: string;
  bgBottom: string;
  card: string;
  cardSolid: string;
  cardBorder: string;
  accent: string;
  accentBright: string;
  text: string;
  textMuted: string;
  textFaint: string;
  trackLine: string;
  tabBar: string;
  particle: string;
}

export const DARK: Palette = {
  bgTop: '#0A0D1F',
  bgMid: '#10142B',
  bgBottom: '#241640',
  card: 'rgba(30, 34, 66, 0.72)',
  cardSolid: '#1A1F3D',
  cardBorder: 'rgba(124, 92, 255, 0.16)',
  accent: '#8B5CF6',
  accentBright: '#A78BFA',
  text: '#F4F4FB',
  textMuted: '#9AA0C3',
  textFaint: '#6B7199',
  trackLine: '#3A3F63',
  tabBar: 'rgba(26, 31, 61, 0.96)',
  particle: '#C4B5FD',
};

export const LIGHT: Palette = {
  bgTop: '#F7F5FF',
  bgMid: '#EFEAFC',
  bgBottom: '#E3D9F8',
  card: 'rgba(255, 255, 255, 0.78)',
  cardSolid: '#FFFFFF',
  cardBorder: 'rgba(124, 92, 255, 0.22)',
  accent: '#7C3AED',
  accentBright: '#6D28D9',
  text: '#1D1B33',
  textMuted: '#565A7A',
  textFaint: '#8A8FAD',
  trackLine: '#CFCFE6',
  tabBar: 'rgba(255, 255, 255, 0.96)',
  particle: '#8B5CF6',
};

export const CATEGORY_META: Record<string, { icon: string; color: string; tile: string }> = {
  Science: { icon: 'flask', color: '#4DA3FF', tile: 'rgba(77, 163, 255, 0.16)' },
  History: { icon: 'business', color: '#F5A524', tile: 'rgba(245, 165, 36, 0.16)' },
  Space: { icon: 'planet', color: '#A78BFA', tile: 'rgba(167, 139, 250, 0.16)' },
  Animals: { icon: 'paw', color: '#4ADE80', tile: 'rgba(74, 222, 128, 0.16)' },
  Geography: { icon: 'earth', color: '#2DD4BF', tile: 'rgba(45, 212, 191, 0.16)' },
  'Human Body': { icon: 'heart', color: '#FB7185', tile: 'rgba(251, 113, 133, 0.16)' },
};
