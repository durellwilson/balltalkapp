/**
 * Layout constants
 * 
 * This file contains layout-related constants used throughout the app.
 * Centralizing these values helps maintain consistent spacing and sizing.
 */

import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

// Screen dimensions
export const WINDOW_WIDTH = width;
export const WINDOW_HEIGHT = height;
export const SCREEN_WIDTH = Dimensions.get('screen').width;
export const SCREEN_HEIGHT = Dimensions.get('screen').height;

// Determine if the device is a tablet based on screen size
export const IS_TABLET = WINDOW_WIDTH > 768;

// Determine if the device has a notch (approximate method)
export const HAS_NOTCH = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV && (WINDOW_HEIGHT >= 812 || WINDOW_WIDTH >= 812);

// Status bar height
export const STATUS_BAR_HEIGHT = Platform.OS === 'ios' 
  ? HAS_NOTCH ? 44 : 20 
  : StatusBar.currentHeight || 0;

// Navigation bar height
export const HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

// Tab bar height
export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? (HAS_NOTCH ? 84 : 49) : 56;

// Safe area insets (approximate)
export const SAFE_AREA_INSETS = {
  top: Platform.OS === 'ios' ? (HAS_NOTCH ? 44 : 20) : StatusBar.currentHeight || 0,
  bottom: Platform.OS === 'ios' ? (HAS_NOTCH ? 34 : 0) : 0,
  left: 0,
  right: 0,
};

// Spacing values for consistent margins and paddings
export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Border radius values
export const BORDER_RADIUS = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  round: 9999, // For circular elements
};

// Font sizes
export const FONT_SIZE = {
  xs: 12,
  s: 14,
  m: 16,
  l: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Line heights
export const LINE_HEIGHT = {
  xs: 16,
  s: 20,
  m: 24,
  l: 28,
  xl: 32,
  xxl: 36,
  xxxl: 40,
};

// Font weights
export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Shadow styles for iOS and Android
export const SHADOW = {
  small: {
    boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2, // For Android
  },
  medium: {
    boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.1)',
    elevation: 4, // For Android
  },
  large: {
    boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.1)',
    elevation: 8, // For Android
  },
};

// Z-index values for layering
export const Z_INDEX = {
  base: 0,
  card: 10,
  header: 20,
  modal: 30,
  overlay: 40,
  tooltip: 50,
};

// Export a default object for easy importing
export default {
  window: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  },
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  isSmallDevice: WINDOW_WIDTH < 375,
  isTablet: IS_TABLET,
  hasNotch: HAS_NOTCH,
  statusBarHeight: STATUS_BAR_HEIGHT,
  headerHeight: HEADER_HEIGHT,
  tabBarHeight: TAB_BAR_HEIGHT,
  safeAreaInsets: SAFE_AREA_INSETS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  fontSize: FONT_SIZE,
  lineHeight: LINE_HEIGHT,
  fontWeight: FONT_WEIGHT,
  shadow: SHADOW,
  zIndex: Z_INDEX,
};
