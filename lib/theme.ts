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
  /** Full-strength outline color for the sticker borders / hard shadows. */
  ink: string;
  /** Softer ink for inactive outlines and dividers. */
  inkSoft: string;
}

/**
 * Fixed dark ink used for icons sitting on the bright category tiles — the
 * tiles stay saturated in both themes, so their icon color never flips.
 */
export const TILE_INK = '#17303B';

// Palette drawn from the app icon: cyan → azure → amber → orange.
export const DARK: Palette = {
  bgTop: '#0B2530',
  bgMid: '#122029',
  bgBottom: '#33200D',
  card: '#1B2F38',
  cardSolid: '#1B2F38',
  cardBorder: '#F2E9D8',
  accent: '#F6821F',
  accentBright: '#FFB25A',
  text: '#F7EFDF',
  textMuted: '#A8BCC4',
  textFaint: '#7B929B',
  trackLine: 'rgba(242, 233, 216, 0.35)',
  tabBar: '#1B2F38',
  particle: '#FFB25A',
  ink: '#F2E9D8',
  inkSoft: 'rgba(242, 233, 216, 0.4)',
};

export const LIGHT: Palette = {
  bgTop: '#DFF5F9',
  bgMid: '#FBF3E4',
  bgBottom: '#FCE7CB',
  card: '#FFFDF7',
  cardSolid: '#FFFDF7',
  cardBorder: '#17303B',
  accent: '#F6821F',
  accentBright: '#D96A0B',
  text: '#17303B',
  textMuted: '#4E6470',
  textFaint: '#7C8E97',
  trackLine: 'rgba(23, 48, 59, 0.3)',
  tabBar: '#FFFDF7',
  particle: '#F6821F',
  ink: '#17303B',
  inkSoft: 'rgba(23, 48, 59, 0.35)',
};

// Solid sticker fills from the icon's cyan-to-orange family; icons are always
// TILE_INK on top of them.
export const CATEGORY_META: Record<string, { icon: string; color: string; tile: string }> = {
  Science: { icon: 'flask', color: TILE_INK, tile: '#64D9EE' },
  History: { icon: 'business', color: TILE_INK, tile: '#F9C15C' },
  Space: { icon: 'planet', color: TILE_INK, tile: '#7FB9F7' },
  Animals: { icon: 'paw', color: TILE_INK, tile: '#F9A05C' },
  Geography: { icon: 'earth', color: TILE_INK, tile: '#49C6AD' },
  'Human Body': { icon: 'heart', color: TILE_INK, tile: '#F98873' },
};

/** Alternating sticker tilt for playful, hand-placed tiles. */
export function tilt(index: number): { transform: { rotate: string }[] } {
  return { transform: [{ rotate: index % 2 === 0 ? '-1.5deg' : '1.5deg' }] };
}
