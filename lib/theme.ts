export const COLORS = {
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
};

export const CATEGORY_META: Record<string, { icon: string; color: string; tile: string }> = {
  Science: { icon: 'flask', color: '#4DA3FF', tile: 'rgba(77, 163, 255, 0.16)' },
  History: { icon: 'business', color: '#F5A524', tile: 'rgba(245, 165, 36, 0.16)' },
  Space: { icon: 'planet', color: '#A78BFA', tile: 'rgba(167, 139, 250, 0.16)' },
  Animals: { icon: 'paw', color: '#4ADE80', tile: 'rgba(74, 222, 128, 0.16)' },
  Geography: { icon: 'earth', color: '#2DD4BF', tile: 'rgba(45, 212, 191, 0.16)' },
  'Human Body': { icon: 'heart', color: '#FB7185', tile: 'rgba(251, 113, 133, 0.16)' },
};
