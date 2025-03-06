/**
 * App color constants
 * 
 * This file contains all the color constants used throughout the app.
 * Using a centralized color system makes it easier to maintain a consistent
 * look and feel, and simplifies theme changes.
 */

// Primary colors
export const PRIMARY = '#007AFF';
export const PRIMARY_DARK = '#0062CC';
export const PRIMARY_LIGHT = '#4DA3FF';

// Secondary colors
export const SECONDARY = '#34C759';
export const SECONDARY_DARK = '#2A9F47';
export const SECONDARY_LIGHT = '#5FD57E';

// Accent colors
export const ACCENT_1 = '#FF9500'; // Orange
export const ACCENT_2 = '#FF3B30'; // Red
export const ACCENT_3 = '#5856D6'; // Purple
export const ACCENT_4 = '#FF2D55'; // Pink

// Neutral colors
export const NEUTRAL_100 = '#FFFFFF';
export const NEUTRAL_200 = '#F8F8F8';
export const NEUTRAL_300 = '#F0F0F0';
export const NEUTRAL_400 = '#E0E0E0';
export const NEUTRAL_500 = '#BDBDBD';
export const NEUTRAL_600 = '#9E9E9E';
export const NEUTRAL_700 = '#666666';
export const NEUTRAL_800 = '#333333';
export const NEUTRAL_900 = '#1A1A1A';

// Semantic colors
export const SUCCESS = '#34C759';
export const WARNING = '#FF9500';
export const ERROR = '#FF3B30';
export const INFO = '#007AFF';

// Transparent colors
export const TRANSPARENT = 'transparent';
export const SEMI_TRANSPARENT = 'rgba(0, 0, 0, 0.5)';
export const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.8)';
export const DARK_OVERLAY = 'rgba(0, 0, 0, 0.8)';

// Sport-specific colors
export const BASKETBALL = '#FF9500';
export const FOOTBALL = '#34C759';
export const SOCCER = '#5856D6';
export const TENNIS = '#FF2D55';
export const BASEBALL = '#007AFF';

// Theme colors (can be used for dark/light mode)
export const THEME = {
  light: {
    background: NEUTRAL_200,
    card: NEUTRAL_100,
    text: NEUTRAL_800,
    border: NEUTRAL_400,
    notification: ACCENT_2,
  },
  dark: {
    background: NEUTRAL_900,
    card: NEUTRAL_800,
    text: NEUTRAL_200,
    border: NEUTRAL_700,
    notification: ACCENT_2,
  },
};

// Export a default object for easy importing
export default {
  primary: PRIMARY,
  primaryDark: PRIMARY_DARK,
  primaryLight: PRIMARY_LIGHT,
  secondary: SECONDARY,
  secondaryDark: SECONDARY_DARK,
  secondaryLight: SECONDARY_LIGHT,
  accent1: ACCENT_1,
  accent2: ACCENT_2,
  accent3: ACCENT_3,
  accent4: ACCENT_4,
  neutral100: NEUTRAL_100,
  neutral200: NEUTRAL_200,
  neutral300: NEUTRAL_300,
  neutral400: NEUTRAL_400,
  neutral500: NEUTRAL_500,
  neutral600: NEUTRAL_600,
  neutral700: NEUTRAL_700,
  neutral800: NEUTRAL_800,
  neutral900: NEUTRAL_900,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,
  transparent: TRANSPARENT,
  semiTransparent: SEMI_TRANSPARENT,
  lightOverlay: LIGHT_OVERLAY,
  darkOverlay: DARK_OVERLAY,
  basketball: BASKETBALL,
  football: FOOTBALL,
  soccer: SOCCER,
  tennis: TENNIS,
  baseball: BASEBALL,
  theme: THEME,
};
