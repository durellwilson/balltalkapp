/**
 * Shadow Styles Utility
 * 
 * This utility provides a consistent way to apply shadow styles across the app
 * using the recommended boxShadow property instead of deprecated shadow* properties.
 */

import { Platform } from 'react-native';

/**
 * Creates a shadow style object using the recommended boxShadow property for web
 * and fallback to elevation for Android and shadow* properties for iOS
 */
export const createShadow = (
  color = '#000',
  offsetX = 0,
  offsetY = 2,
  opacity = 0.1,
  radius = 4,
  elevation = 5
) => {
  if (Platform.OS === 'web') {
    // Use boxShadow for web
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(0, 0, 0, ${opacity})`
    };
  } else if (Platform.OS === 'android') {
    // Use elevation for Android
    return {
      elevation
    };
  } else {
    // Use shadow* properties for iOS
    return {
      shadowColor: color,
      shadowOffset: { width: offsetX, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    };
  }
};

// Predefined shadow styles
export const shadows = {
  small: createShadow('#000', 0, 1, 0.05, 2, 2),
  medium: createShadow('#000', 0, 2, 0.1, 4, 5),
  large: createShadow('#000', 0, 4, 0.15, 8, 10),
  card: createShadow('#000', 0, 2, 0.1, 4, 3),
  button: createShadow('#000', 0, 2, 0.2, 3, 4),
  modal: createShadow('#000', 0, 5, 0.25, 10, 15),
};

export default shadows; 