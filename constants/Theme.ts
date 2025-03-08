/**
 * Theme configuration
 * 
 * This file combines colors, typography, and layout constants into theme objects
 * that can be used throughout the app for consistent styling.
 */

import Colors from './Colors';
import Typography from './Typography';
import Layout from './Layout';

// Theme type enum
export enum ThemeType {
  DARK = 'dark',
  LIGHT = 'light'
}

// Base theme with common properties
const baseTheme = {
  spacing: Layout.spacing,
  borderRadius: Layout.borderRadius,
  fontFamily: Typography.fontFamily,
  textStyle: Typography.textStyle,
  shadow: Layout.shadow,
};

// Light theme
export const lightTheme = {
  ...baseTheme,
  mode: ThemeType.LIGHT,
  colors: {
    // Background colors
    background: Colors.neutral200,
    surface: Colors.neutral100,
    card: Colors.neutral100,
    modal: Colors.neutral100,
    
    // Text colors
    text: Colors.neutral800,
    textSecondary: Colors.neutral700,
    textTertiary: Colors.neutral600,
    textInverted: Colors.neutral100,
    
    // UI element colors
    primary: Colors.primary,
    primaryDark: Colors.primaryDark,
    primaryLight: Colors.primaryLight,
    secondary: Colors.secondary,
    accent: Colors.accent1,
    
    // Border colors
    border: Colors.neutral400,
    divider: Colors.neutral300,
    
    // Status colors
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
    info: Colors.info,
    
    // Transparent colors
    transparent: Colors.transparent,
    overlay: Colors.semiTransparent,
    
    // Sport-specific colors
    basketball: Colors.basketball,
    football: Colors.football,
    soccer: Colors.soccer,
    tennis: Colors.tennis,
    baseball: Colors.baseball,
    notification: Colors.error, // Add notification color
  },
};

// Dark theme
export const darkTheme = {
  ...baseTheme,
  mode: ThemeType.DARK,
  colors: {
    // Background colors
    background: Colors.neutral900,
    surface: Colors.neutral800,
    card: Colors.neutral800,
    modal: Colors.neutral800,
    
    // Text colors
    text: Colors.neutral100,
    textSecondary: Colors.neutral300,
    textTertiary: Colors.neutral400,
    textInverted: Colors.neutral800,
    
    // UI element colors
    primary: Colors.primary,
    primaryDark: Colors.primaryDark,
    primaryLight: Colors.primaryLight,
    secondary: Colors.secondary,
    accent: Colors.accent1,
    
    // Border colors
    border: Colors.neutral700,
    divider: Colors.neutral700,
    
    // Status colors
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
    info: Colors.info,
    
    // Transparent colors
    transparent: Colors.transparent,
    overlay: Colors.darkOverlay,
    
    // Sport-specific colors
    basketball: Colors.basketball,
    football: Colors.football,
    soccer: Colors.soccer,
    tennis: Colors.tennis,
    baseball: Colors.baseball,
    notification: Colors.error, // Add notification color
  },
};

// Default theme (light)
export const defaultTheme = lightTheme;

// Theme interface for TypeScript
export interface Theme {
  mode: ThemeType;
  colors: {
    background: string;
    surface: string;
    card: string;
    modal: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverted: string;
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    border: string;
    divider: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    transparent: string;
    overlay: string;
    basketball: string;
    football: string;
    soccer: string;
    tennis: string;
    baseball: string;
    notification: string; // Add notification to interface
  };
  spacing: typeof Layout.spacing;
  borderRadius: typeof Layout.borderRadius;
  fontFamily: typeof Typography.fontFamily;
  textStyle: typeof Typography.textStyle;
  shadow: typeof Layout.shadow;
}

// Get theme by type
export const getTheme = (themeType: ThemeType): Theme => {
  return themeType === ThemeType.DARK ? darkTheme : lightTheme;
};

// Export a default object for easy importing
export default {
  light: lightTheme,
  dark: darkTheme,
  default: defaultTheme,
  ThemeType,
  getTheme,
};

// Audio processing specific colors
export const AudioProcessingColors = {
  waveform: {
    background: '#1E1E1E',
    primary: '#8E44AD',
    secondary: '#3498DB',
    grid: '#444444',
    text: '#FFFFFF',
  },
  spectrum: {
    background: '#1E1E1E',
    low: '#2ECC71',
    mid: '#F39C12',
    high: '#E74C3C',
    grid: '#444444',
    text: '#FFFFFF',
  },
  controls: {
    knob: '#8E44AD',
    slider: '#3498DB',
    button: '#2A2A2A',
    buttonActive: '#8E44AD',
    text: '#FFFFFF',
    background: '#2A2A2A',
  }
};
