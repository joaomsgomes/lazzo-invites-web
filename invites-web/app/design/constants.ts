// Design tokens from Lazzo Flutter app
// Source: lib/shared/themes/colors.dart + lib/shared/constants/
//
// IMPORTANT: these tokens are mirrored in app/globals.css under the Tailwind v4 @theme block
// (as --color-bg1, --color-planning, --radius-md, etc.) to power utilities like `bg-bg1`,
// `text-planning`, `rounded-md`. When editing a token here, update globals.css too.

export const BrandColors = {
  // Background colors
  bg1: '#121212',
  bg2: '#1F1F1F',
  bg3: '#2B2B2B',

  // Text colors
  text1: '#F2F2F2',
  text2: '#A6A6A6',
  border: '#404040',

  // Event mode colors
  planning: '#169C3E',
  living: '#8A38F5',
  recap: '#FF751A',

  // Status colors
  cantVote: '#FF3B30',
  warning: '#ECA900',
  white: '#FFFFFF',
} as const;

export const Spacing = {
  // Gaps
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',

  // Radii
  radiusSm: '6px',
  radiusSmAlt: '12px',
  radiusMd: '16px',
  radiusPill: '24px',
  radiusNav: '36px',

  // Padding
  screenH: '16px',
  screenTop: '24px',
  screenBottom: '24px',
} as const;

export const Typography = {
  fontFamily: "'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  
  // Text styles (matching Flutter AppText exactly)
  titleLargeEmph: {
    fontWeight: 600 as const,
    fontSize: '22px',
    lineHeight: 1.27,
  },
  
  titleMediumEmph: {
    fontWeight: 600 as const,
    fontSize: '16px',
    lineHeight: 1.5,
  },

  enterCodeTitle: {
    fontWeight: 500 as const,
    fontSize: '32px',
    lineHeight: 1.25,
  },
  
  subtitleMuted: {
    fontWeight: 500 as const,
    fontSize: '22px',
    lineHeight: 1.27,
  },
  
  subtitleStrong: {
    fontWeight: 500 as const,
    fontSize: '22px',
    lineHeight: 1.27,
  },
  
  headlineMedium: {
    fontWeight: 500 as const,
    fontSize: '28px',
    lineHeight: 36 / 28,
  },
  
  bodyLarge: {
    fontWeight: 400 as const,
    fontSize: '16px',
    lineHeight: 24 / 16,
    letterSpacing: '0.5px',
  },
  
  bodyMedium: {
    fontWeight: 400 as const,
    fontSize: '14px',
    lineHeight: 20 / 14,
    letterSpacing: '0.25px',
  },
  
  bodyMediumEmph: {
    fontWeight: 500 as const,
    fontSize: '14px',
    lineHeight: 20 / 14,
    letterSpacing: '0.25px',
  },
  
  labelLarge: {
    fontWeight: 500 as const,
    fontSize: '14px',
    lineHeight: 20 / 14,
    letterSpacing: '0.5px',
  },
  
  labelLargeEmph: {
    fontWeight: 600 as const,
    fontSize: '14px',
    lineHeight: 20 / 14,
    letterSpacing: '0.5px',
  },
} as const;
