import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';

interface GlassyContainerProps {
  children: React.ReactNode;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
}

/**
 * GlassyContainer - A component that provides a modern, glassy UI effect
 * 
 * This component uses BlurView on iOS and a semi-transparent background on Android
 * to create a consistent glassy effect across platforms.
 * 
 * @param children - The content to display inside the container
 * @param intensity - The intensity of the blur effect (1-100)
 * @param style - Additional styles to apply to the container
 * @param tint - The tint color of the blur effect
 * @param borderRadius - The border radius of the container
 */
export const GlassyContainer: React.FC<GlassyContainerProps> = ({
  children,
  intensity = 50,
  style,
  tint = 'default',
  borderRadius = 16,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Determine the appropriate tint if 'default' is specified
  const blurTint = tint === 'default' ? (isDark ? 'dark' : 'light') : tint;
  
  // Get the appropriate glass effect and border colors based on the color scheme
  const glassEffect = isDark ? Colors.glassEffectDark : Colors.glassEffect;
  const glassBorder = isDark ? Colors.glassBorderDark : Colors.glassBorder;
  
  // Common styles for both platforms
  const commonStyles: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glassBorder,
  };
  
  // Platform-specific implementation
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={blurTint}
        style={[commonStyles, styles.container, style]}
      >
        {children}
      </BlurView>
    );
  } else {
    // Android fallback
    return (
      <View
        style={[
          commonStyles,
          styles.container,
          { backgroundColor: glassEffect },
          style,
        ]}
      >
        {children}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

export default GlassyContainer; 