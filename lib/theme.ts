/**
 * Design tokens — single source of truth for all colors, font families,
 * font sizes, border radii, and spacing used across the app.
 *
 * Aesthetic: "Dark Oak" — warm walnut-brown depth, electric amber accent.
 * The bg is visibly warm (not black), so cards read with clear elevation.
 */

export const darkColors = {
  // Backgrounds — warm oak tones with clear z-axis separation
  bg: '#161210',            // Dark walnut — warm visible darkness, not black
  surface: '#221b14',       // Cards sit clearly above the bg
  surface2: '#110e0b',      // Recessed / inset elements (inputs inside cards)
  surfaceElevated: '#2d2419', // Modals, elevated overlays

  // Borders — warm, clearly visible
  border: '#3a2e22',

  // Text hierarchy — 5 warm cream tones
  text: '#f2ebe0',
  textSecondary: '#c4b49a',
  textMuted: '#7a6a55',
  textSubtle: '#4a3c2e',
  textDisabled: '#342a1f',

  // Accent — electric violet
  accent: '#c084fc',
  accentDark: '#a855f7',
  accentDisabled: '#1e1133',
  accentBorder: '#3d1a6e',

  // Semantic state colors
  error: '#ff4d4d',
  errorText: '#ff7070',
  warning: '#fbbf24',

  // Tinted surfaces for insight rows
  accentSurface: '#140b25',
  warningSurface: '#221900',
  errorSurface: '#220d0d',

  // Chat-specific
  userBubbleBg: '#1e1030',
  userBubbleText: '#e8d5ff',
  assistantBubbleText: '#c4b49a',
} as const;

/**
 * Light palette — "Warm Cream + Orange". Used when the app is in light mode.
 */
export const lightColors = {
  // Backgrounds — warm cream tones with clear z-axis separation
  bg: '#faf6f0',            // Warm cream
  surface: '#ffffff',       // Cards
  surface2: '#f5ede4',      // Recessed inputs
  surfaceElevated: '#ffffff', // Modals

  // Borders — warm sand
  border: '#e8ddd2',

  // Text hierarchy — warm brown tones
  text: '#1a0f08',          // Near-black warm
  textSecondary: '#7a5c45',
  textMuted: '#b0907a',
  textSubtle: '#d4bfb0',
  textDisabled: '#e8ddd2',

  // Accent — laranja vibrante
  accent: '#ea580c',
  accentDark: '#c2440a',    // Pressed state
  accentDisabled: '#fde8dc',
  accentBorder: '#fcd4be',

  // Semantic state colors
  error: '#dc2626',
  errorText: '#b91c1c',
  warning: '#d97706',

  // Tinted surfaces for insight rows
  accentSurface: '#fff4ee', // Chat user bubble bg
  warningSurface: '#fffbeb',
  errorSurface: '#fef2f2',

  // Chat-specific
  userBubbleBg: '#fff4ee',
  userBubbleText: '#7c2d12',
  assistantBubbleText: '#7a5c45',
} as const;

export type AppColors = typeof darkColors;

/** @deprecated Use `darkColors` directly or consume via ThemeContext. */
export const colors = darkColors;

/**
 * Font families — Syne for display/headings, DM Sans for body/UI.
 */
export const fonts = {
  display: 'Syne_700Bold',
  displayMedium: 'Syne_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

/**
 * Recommended font scale.
 */
export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
} as const;
