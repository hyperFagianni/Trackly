export const colors = {
  backgroundTop: '#EAF4FF',
  backgroundBottom: '#F4F0FB',
  glassFill: 'rgba(255,255,255,0.55)',
  glassFillStrong: 'rgba(255,255,255,0.75)',
  glassBorder: 'rgba(255,255,255,0.7)',
  textPrimary: '#1C1C1E',
  textSecondary: '#6B6B70',
  textTertiary: '#9A9AA1',
  accent: '#0A84FF',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9F0A',
  neutral: '#8E8E93',
  separator: 'rgba(60,60,67,0.12)',
  white: '#FFFFFF',
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  largeTitle: { fontSize: 32, fontWeight: '700' as const },
  title: { fontSize: 22, fontWeight: '700' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  small: { fontSize: 11, fontWeight: '500' as const },
};

export const cardShadow = {
  shadowColor: '#2B4A75',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.16,
  shadowRadius: 22,
  elevation: 7,
};

export const softShadow = {
  shadowColor: '#3A4A63',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

// "Liquid glass" surface: a diagonal iridescent sheen (as if sunlight were
// refracting through glass) plus a glossy top highlight, layered on cards
// and buttons on top of their base fill/blur — see GlassCard and GlassButton.
export const glassSheenColors = [
  'rgba(255,208,235,0.5)',
  'rgba(255,241,189,0.38)',
  'rgba(201,255,224,0.32)',
  'rgba(196,225,255,0.42)',
  'rgba(224,201,255,0.4)',
] as const;

export const glassHighlightColors = ['rgba(255,255,255,0.65)', 'rgba(255,255,255,0)'] as const;

export const buttonShadow = {
  shadowColor: '#17325C',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 10,
};

export const buttonShadowPressed = {
  shadowColor: '#17325C',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.18,
  shadowRadius: 6,
  elevation: 4,
};
