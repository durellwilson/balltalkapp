/**
 * App color constants
 * 
 * This file contains all the color constants used throughout the app.
 * Using a centralized color system makes it easier to maintain a consistent
 * look and feel, and simplifies theme changes.
 */

// Primary colors - Modern blue with a sleek feel
export const PRIMARY = '#0A84FF';
export const PRIMARY_DARK = '#0066CC';
export const PRIMARY_LIGHT = '#5AC8FA';

// Secondary colors - Fresh and vibrant
export const SECONDARY = '#30D158';
export const SECONDARY_DARK = '#28B14C';
export const SECONDARY_LIGHT = '#4CD964';

// Accent colors - Bold and modern
export const ACCENT_1 = '#FF9F0A'; // Orange
export const ACCENT_2 = '#FF453A'; // Red
export const ACCENT_3 = '#5E5CE6'; // Purple
export const ACCENT_4 = '#FF375F'; // Pink

// Neutral colors - Refined grayscale for a professional look
export const NEUTRAL_100 = '#FFFFFF';
export const NEUTRAL_200 = '#F9F9F9';
export const NEUTRAL_300 = '#F2F2F7';
export const NEUTRAL_400 = '#E5E5EA';
export const NEUTRAL_500 = '#C7C7CC';
export const NEUTRAL_600 = '#8E8E93';
export const NEUTRAL_700 = '#636366';
export const NEUTRAL_800 = '#3A3A3C';
export const NEUTRAL_900 = '#1C1C1E';

// Semantic colors - Clear and intuitive
export const SUCCESS = '#30D158';
export const WARNING = '#FF9F0A';
export const ERROR = '#FF453A';
export const INFO = '#0A84FF';

// Transparent colors - For glassy effects
export const TRANSPARENT = 'transparent';
export const SEMI_TRANSPARENT = 'rgba(0, 0, 0, 0.3)';
export const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.7)';
export const DARK_OVERLAY = 'rgba(0, 0, 0, 0.6)';
export const GLASS_EFFECT = 'rgba(255, 255, 255, 0.15)';
export const GLASS_EFFECT_DARK = 'rgba(0, 0, 0, 0.15)';
export const GLASS_BORDER = 'rgba(255, 255, 255, 0.2)';
export const GLASS_BORDER_DARK = 'rgba(0, 0, 0, 0.2)';

// Sport-specific colors - Vibrant and distinctive
export const BASKETBALL = '#FF9F0A';
export const FOOTBALL = '#30D158';
export const SOCCER = '#5E5CE6';
export const TENNIS = '#FF375F';
export const BASEBALL = '#0A84FF';

// Gradient colors - For modern UI elements
export const GRADIENT_PRIMARY_START = '#0A84FF';
export const GRADIENT_PRIMARY_END = '#5AC8FA';
export const GRADIENT_SECONDARY_START = '#30D158';
export const GRADIENT_SECONDARY_END = '#4CD964';
export const GRADIENT_ACCENT_START = '#FF9F0A';
export const GRADIENT_ACCENT_END = '#FFCC00';

// Define theme interface for better type safety
export interface ThemeColors {
  // Base colors
  primary: string;
  secondary: string;
  accent: string;
  
  // UI elements
  background: string;
  cardBackground: string;
  cardBackgroundLight: string;
  text: string;
  textSecondary: string;
  border: string;
  notification: string;
  
  // Interactive elements
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  buttonBackground: string;
  buttonText: string;
  inputBackground: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Glass effects
  glassEffect: string;
  glassBorder: string;
  
  // Gradients
  gradientPrimaryStart: string;
  gradientPrimaryEnd: string;
  gradientSecondaryStart: string;
  gradientSecondaryEnd: string;
}

// Theme colors (can be used for dark/light mode)
export const light: ThemeColors = {
  // Base colors
  primary: PRIMARY,
  secondary: SECONDARY,
  accent: ACCENT_1,
  
  // UI elements
  background: NEUTRAL_200,
  cardBackground: NEUTRAL_100,
  cardBackgroundLight: NEUTRAL_300,
  text: NEUTRAL_800,
  textSecondary: NEUTRAL_700,
  border: NEUTRAL_400,
  notification: ACCENT_2,
  
  // Interactive elements
  tint: PRIMARY,
  tabIconDefault: NEUTRAL_600,
  tabIconSelected: PRIMARY,
  buttonBackground: PRIMARY,
  buttonText: NEUTRAL_100,
  inputBackground: NEUTRAL_300,
  
  // Status colors
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,
  
  // Glass effects
  glassEffect: GLASS_EFFECT,
  glassBorder: GLASS_BORDER,
  
  // Gradients
  gradientPrimaryStart: GRADIENT_PRIMARY_START,
  gradientPrimaryEnd: GRADIENT_PRIMARY_END,
  gradientSecondaryStart: GRADIENT_SECONDARY_START,
  gradientSecondaryEnd: GRADIENT_SECONDARY_END,
};

export const dark: ThemeColors = {
  // Base colors
  primary: PRIMARY_LIGHT,
  secondary: SECONDARY_LIGHT,
  accent: ACCENT_1,
  
  // UI elements
  background: NEUTRAL_900,
  cardBackground: NEUTRAL_800,
  cardBackgroundLight: NEUTRAL_700,
  text: NEUTRAL_200,
  textSecondary: NEUTRAL_400,
  border: NEUTRAL_700,
  notification: ACCENT_2,
  
  // Interactive elements
  tint: PRIMARY_LIGHT,
  tabIconDefault: NEUTRAL_500,
  tabIconSelected: PRIMARY_LIGHT,
  buttonBackground: PRIMARY,
  buttonText: NEUTRAL_100,
  inputBackground: NEUTRAL_700,
  
  // Status colors
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,
  
  // Glass effects
  glassEffect: GLASS_EFFECT_DARK,
  glassBorder: GLASS_BORDER_DARK,
  
  // Gradients
  gradientPrimaryStart: GRADIENT_PRIMARY_START,
  gradientPrimaryEnd: GRADIENT_PRIMARY_END,
  gradientSecondaryStart: GRADIENT_SECONDARY_START,
  gradientSecondaryEnd: GRADIENT_SECONDARY_END,
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
  glassEffect: GLASS_EFFECT,
  glassEffectDark: GLASS_EFFECT_DARK,
  glassBorder: GLASS_BORDER,
  glassBorderDark: GLASS_BORDER_DARK,
  basketball: BASKETBALL,
  football: FOOTBALL,
  soccer: SOCCER,
  tennis: TENNIS,
  baseball: BASEBALL,
  gradientPrimaryStart: GRADIENT_PRIMARY_START,
  gradientPrimaryEnd: GRADIENT_PRIMARY_END,
  gradientSecondaryStart: GRADIENT_SECONDARY_START,
  gradientSecondaryEnd: GRADIENT_SECONDARY_END,
  light,
  dark,
};
