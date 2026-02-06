/**
 * App color system (Light & Dark)
 * Derived from your existing theme.ts colors
 */

import { Platform } from 'react-native';

/* =======================
   Base palette (yours)
======================= */
const palette = {
  white: '#FFFFFF',
  black: '#000000',

  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  blue500: '#3B82F6',
  blue400: '#60A5FA',
  blue800: '#1E40AF',

  sky50: '#F0F9FF',

  green600: '#059669',
  amber500: '#F59E0B',
  red500: '#EF4444',

  slate900: '#0F172A',

  overlayDark: 'rgba(17, 24, 39, 0.55)',
  primaryFill12: 'rgba(59, 130, 246, 0.12)',
};

/* =======================
   Colors (Light / Dark)
======================= */
export const Colors = {
  light: {
    // Core
    text: palette.gray900,
    textSecondary: palette.gray500,
    textMuted: palette.gray400,
    background: palette.gray50,
    surface: palette.white,
    surfaceAlt: palette.gray100,

    // Brand
    tint: palette.blue500,
    primary: palette.blue500,
    primaryAlt: palette.blue400,
    link: palette.blue500,

    // Icons & tabs
    icon: palette.gray500,
    tabIconDefault: palette.gray400,
    tabIconSelected: palette.blue500,

    // UI
    border: palette.gray300,
    borderSoft: palette.gray100,
    overlay: palette.overlayDark,

    // Status
    success: palette.green600,
    warning: palette.amber500,
    danger: palette.red500,
  },

  dark: {
    // Core
    text: palette.gray100,
    textSecondary: palette.gray400,
    textMuted: palette.gray500,
    background: palette.gray900,
    surface: palette.gray800,
    surfaceAlt: palette.gray700,

    // Brand
    tint: palette.blue400,
    primary: palette.blue400,
    primaryAlt: palette.blue500,
    link: palette.blue400,

    // Icons & tabs
    icon: palette.gray400,
    tabIconDefault: palette.gray500,
    tabIconSelected: palette.blue400,

    // UI
    border: palette.gray700,
    borderSoft: palette.gray800,
    overlay: 'rgba(0,0,0,0.65)',

    // Status
    success: palette.green600,
    warning: palette.amber500,
    danger: palette.red500,
  },
} as const;

/* =======================
   Gradients (unchanged)
======================= */
export const Gradients = {
  taxiCard: [palette.blue500, palette.blue400],
  modalCard: [palette.white, palette.gray100],
} as const;

/* =======================
   Fonts (same structure)
======================= */
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
