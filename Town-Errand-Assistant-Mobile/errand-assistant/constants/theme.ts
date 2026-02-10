/**
 * theme.ts
 * ─────────────────────────────────────────────
 * Centralized design system for the application.
 *
 * Usage:
 *   import { theme } from '@/theme';           // light theme (default)
 *   import { themes } from '@/theme';           // { light, dark }
 *   import { Colors, Fonts, Gradients } from '@/theme';
 *
 * With a hook (example):
 *   const { colors, fonts, gradients } = useTheme();
 */

import { Platform } from 'react-native';

// ════════════════════════════════════════════════
// 1. PALETTE — raw color tokens (never used directly in components)
// ════════════════════════════════════════════════

const palette = {
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',

  // Warm neutrals (brand surface)
  sage50: '#E7EAE5',

  // Cool grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Blue
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue800: '#1E40AF',

  // Sky
  sky50: '#F0F9FF',

  // Semantic
  green600: '#059669',
  amber500: '#F59E0B',
  red500: '#EF4444',

  // Slate
  slate900: '#0F172A',

  // Overlays
  overlayLight: 'rgba(17, 24, 39, 0.55)',
  overlayDark: 'rgba(0, 0, 0, 0.65)',
} as const;

// ════════════════════════════════════════════════
// 2. SEMANTIC COLORS — light & dark schemes
// ════════════════════════════════════════════════

const lightColors = {
  // ── Core surfaces ──
  background: palette.sage50, // #E7EAE5
  surface: palette.white,
  surfaceAlt: palette.gray100,
  surfaceHighlight: palette.sky50,

  // ── Typography ──
  text: palette.gray900,
  textSecondary: palette.gray500,
  textMuted: palette.gray400,
  textOnPrimary: palette.white,
  textInverse: palette.white,

  // ── Brand / accent ──
  primary: palette.blue500,
  primaryAlt: palette.blue400,
  primaryDark: palette.blue600,
  link: palette.blue500,
  tint: palette.blue500,

  // ── Icons & navigation ──
  icon: palette.gray500,
  iconMuted: palette.gray400,
  tabIconDefault: palette.gray400,
  tabIconSelected: palette.blue500,

  // ── Borders & dividers ──
  border: palette.gray300,
  borderSoft: palette.gray200,
  borderHard: palette.gray400,

  // ── Overlays ──
  overlay: palette.overlayLight,

  // ── Status ──
  success: palette.green600,
  warning: palette.amber500,
  danger: palette.red500,

  // ── Misc ──
  disabled: palette.gray300,
  placeholder: palette.gray400,
  skeleton: palette.gray200,
  shadow: palette.black,
} as const;

const darkColors = {
  // ── Core surfaces ──
  background: palette.gray900,
  surface: palette.gray800,
  surfaceAlt: palette.gray700,
  surfaceHighlight: palette.gray700,

  // ── Typography ──
  text: palette.gray100,
  textSecondary: palette.gray400,
  textMuted: palette.gray500,
  textOnPrimary: palette.white,
  textInverse: palette.gray900,

  // ── Brand / accent ──
  primary: palette.blue400,
  primaryAlt: palette.blue500,
  primaryDark: palette.blue600,
  link: palette.blue400,
  tint: palette.blue400,

  // ── Icons & navigation ──
  icon: palette.gray400,
  iconMuted: palette.gray500,
  tabIconDefault: palette.gray500,
  tabIconSelected: palette.blue400,

  // ── Borders & dividers ──
  border: palette.gray700,
  borderSoft: palette.gray800,
  borderHard: palette.gray600,

  // ── Overlays ──
  overlay: palette.overlayDark,

  // ── Status ──
  success: palette.green600,
  warning: palette.amber500,
  danger: palette.red500,

  // ── Misc ──
  disabled: palette.gray700,
  placeholder: palette.gray500,
  skeleton: palette.gray700,
  shadow: palette.black,
} as const;

export const Colors = {
  light: lightColors,
  dark: darkColors,
} as const;

// ════════════════════════════════════════════════
// 3. GRADIENTS
// ════════════════════════════════════════════════

export const Gradients = {
  primary: [palette.blue500, palette.blue400] as const,
  taxiCard: [palette.blue500, palette.blue400] as const,
  modalCard: [palette.white, palette.gray100] as const,
  darkCard: [palette.gray800, palette.gray700] as const,
} as const;

// ════════════════════════════════════════════════
// 4. TYPOGRAPHY — font families per platform
// ════════════════════════════════════════════════

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'SF Pro Rounded',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'Roboto',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  default: {
    sans: 'System',
    serif: 'serif',
    rounded: 'System',
    mono: 'monospace',
  },
})!;

// ════════════════════════════════════════════════
// 5. SPACING & RADII — consistent sizing scale
// ════════════════════════════════════════════════

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const Radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ════════════════════════════════════════════════
// 6. SHADOWS — platform‑adaptive elevation
// ════════════════════════════════════════════════

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: { elevation: 3 },
    default: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: { elevation: 6 },
    default: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
  }),
} as const;

// ════════════════════════════════════════════════
// 7. TYPES — for consumers that need them
// ════════════════════════════════════════════════

export type ThemeColors = typeof lightColors | typeof darkColors;
export type ThemeGradients = typeof Gradients;
export type ThemeFonts = typeof Fonts;
export type ThemeSpacing = typeof Spacing;
export type ThemeRadii = typeof Radii;

export interface Theme {
  colors: ThemeColors;
  gradients: ThemeGradients;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  radii: ThemeRadii;
  shadows: typeof Shadows;
}

// ════════════════════════════════════════════════
// 8. ASSEMBLED THEMES — ready to use
// ════════════════════════════════════════════════

export const themes: Record<'light' | 'dark', Theme> = {
  light: {
    colors: Colors.light,
    gradients: Gradients,
    fonts: Fonts,
    spacing: Spacing,
    radii: Radii,
    shadows: Shadows,
  },
  dark: {
    colors: Colors.dark,
    gradients: Gradients,
    fonts: Fonts,
    spacing: Spacing,
    radii: Radii,
    shadows: Shadows,
  },
} as const;

/** Default export — light theme for convenience */
export const theme: Theme = themes.light;

export default theme;