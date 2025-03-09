
export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  neutral100: string;
  neutral200: string;
  neutral300: string;
  neutral400: string;
  neutral500: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;
  neutral900: string;
};

// Light theme colors
export const light: ThemeColors = {
  primary: '#3366FF',       // Modern blue
  secondary: '#6C47FF',     // Purple
  background: '#FFFFFF',    // White
  card: '#F9F9F9',          // Light gray
  text: '#121214',          // Almost black
  border: '#EBEBEB',        // Light border
  notification: '#FF3B30',  // Red notification
  error: '#FF3B30',         // Red
  success: '#34C759',       // Green
  warning: '#FF9500',       // Orange
  info: '#3366FF',          // Blue
  neutral100: '#FFFFFF',    // White
  neutral200: '#F5F5F5',
  neutral300: '#E8E8E8',
  neutral400: '#DDDDDD',
  neutral500: '#BBBBBB',
  neutral600: '#999999',
  neutral700: '#666666',
  neutral800: '#444444',
  neutral900: '#121214',    // Almost black
};

// Dark theme colors
export const dark: ThemeColors = {
  primary: '#5E8AFF',       // Brighter blue for dark
  secondary: '#8E74FF',     // Brighter purple for dark
  background: '#121214',    // Dark background
  card: '#1E1E20',          // Dark card
  text: '#FFFFFF',          // White text
  border: '#2E2E30',        // Dark border
  notification: '#FF453A',  // Brighter red for dark
  error: '#FF453A',         // Brighter red for dark
  success: '#32D74B',       // Brighter green for dark
  warning: '#FF9F0A',       // Brighter orange for dark
  info: '#5E8AFF',          // Brighter blue for dark
  neutral100: '#121214',    // Almost black
  neutral200: '#1E1E20',
  neutral300: '#2E2E30',
  neutral400: '#3E3E40',
  neutral500: '#5E5E60',
  neutral600: '#7E7E80',
  neutral700: '#AEAEB0',
  neutral800: '#DEDEDF',
  neutral900: '#FFFFFF',    // White
};

export default {
  light,
  dark,
  // Legacy exports for backward compatibility
  primary: light.primary,
  accent: light.secondary,
  background: light.background,
  text: light.text,
  border: light.border,
  warning: light.warning,
  error: light.error,
  success: light.success,
  neutral100: light.neutral100,
  neutral700: light.neutral700,
  neutral900: light.neutral900,
};
