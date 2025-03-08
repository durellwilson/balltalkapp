import { Platform } from 'react-native';

/**
 * Creates cross-platform shadow styles
 * Uses boxShadow for web and individual shadow properties for native
 */
export const createShadow = (
  offsetX = 0,
  offsetY = 2,
  radius = 4,
  opacity = 0.1,
  color = '#000'
) => {
  if (Platform.OS === 'web') {
    // Web shadow using boxShadow
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(0, 0, 0, ${opacity})`,
    };
  } else {
    // Native shadow
    return {
      shadowColor: color,
      shadowOffset: { width: offsetX, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
      elevation: radius, // Android elevation
    };
  }
}; 