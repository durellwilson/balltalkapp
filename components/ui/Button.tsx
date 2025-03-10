import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleProp,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import GlassyContainer from './GlassyContainer';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'glass' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  gradientColors?: string[];
}

/**
 * Modern Button component with multiple variants and styles
 * 
 * @param title - The text to display on the button
 * @param onPress - Function to call when the button is pressed
 * @param variant - The button style variant
 * @param size - The button size
 * @param disabled - Whether the button is disabled
 * @param loading - Whether to show a loading indicator
 * @param style - Additional styles to apply to the button
 * @param textStyle - Additional styles to apply to the button text
 * @param leftIcon - Icon to display on the left side of the text
 * @param rightIcon - Icon to display on the right side of the text
 * @param fullWidth - Whether the button should take up the full width
 * @param gradientColors - Custom gradient colors for the button background
 */
const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
  gradientColors,
}) => {
  // Determine button styles based on variant and size
  const getButtonStyles = (): StyleProp<ViewStyle> => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...(fullWidth && styles.fullWidth),
      ...(size === 'small' && styles.smallButton),
      ...(size === 'large' && styles.largeButton),
      ...(disabled && styles.disabledButton),
    };

    switch (variant) {
      case 'primary':
        return [baseStyle, styles.primaryButton];
      case 'secondary':
        return [baseStyle, styles.secondaryButton];
      case 'outline':
        return [baseStyle, styles.outlineButton];
      case 'glass':
        return [baseStyle, styles.glassButton];
      case 'text':
        return [baseStyle, styles.textButton];
      default:
        return baseStyle;
    }
  };

  // Determine text styles based on variant and size
  const getTextStyles = (): StyleProp<TextStyle> => {
    const baseStyle: TextStyle = {
      ...styles.buttonText,
      ...(size === 'small' && styles.smallButtonText),
      ...(size === 'large' && styles.largeButtonText),
      ...(disabled && styles.disabledButtonText),
    };

    switch (variant) {
      case 'primary':
        return [baseStyle, styles.primaryButtonText];
      case 'secondary':
        return [baseStyle, styles.secondaryButtonText];
      case 'outline':
        return [baseStyle, styles.outlineButtonText];
      case 'glass':
        return [baseStyle, styles.glassButtonText];
      case 'text':
        return [baseStyle, styles.textButtonText];
      default:
        return baseStyle;
    }
  };

  // Determine gradient colors based on variant
  const getGradientColors = (): string[] => {
    if (gradientColors && gradientColors.length >= 2) {
      return gradientColors;
    }

    switch (variant) {
      case 'primary':
        return [Colors.gradientPrimaryStart, Colors.gradientPrimaryEnd];
      case 'secondary':
        return [Colors.gradientSecondaryStart, Colors.gradientSecondaryEnd];
      default:
        return [Colors.primary, Colors.primaryLight];
    }
  };

  // Render button content
  const renderButtonContent = () => (
    <View style={styles.contentContainer}>
      {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
      
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'text' ? Colors.primary : Colors.neutral100}
        />
      ) : (
        <Text style={[getTextStyles(), textStyle]}>{title}</Text>
      )}
      
      {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
    </View>
  );

  // Render the appropriate button based on variant
  if (variant === 'primary' || variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[getButtonStyles(), style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {renderButtonContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  } else if (variant === 'glass') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[getButtonStyles(), style]}
      >
        <GlassyContainer style={styles.glassyContent}>
          {renderButtonContent()}
        </GlassyContainer>
      </TouchableOpacity>
    );
  } else {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[getButtonStyles(), style]}
        activeOpacity={0.8}
      >
        {renderButtonContent()}
      </TouchableOpacity>
    );
  }
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 120,
  },
  fullWidth: {
    width: '100%',
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    borderRadius: 8,
  },
  largeButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 160,
    borderRadius: 16,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  glassButton: {
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  glassyContent: {
    width: '100%',
    height: '100%',
    padding: 0,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 0,
  },
  disabledButton: {
    opacity: 0.6,
  },
  gradient: {
    borderRadius: 12,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  smallButtonText: {
    fontSize: 14,
  },
  largeButtonText: {
    fontSize: 18,
  },
  primaryButtonText: {
    color: Colors.neutral100,
  },
  secondaryButtonText: {
    color: Colors.neutral100,
  },
  outlineButtonText: {
    color: Colors.primary,
  },
  glassButtonText: {
    color: Colors.neutral100,
  },
  textButtonText: {
    color: Colors.primary,
  },
  disabledButtonText: {
    opacity: 0.8,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginHorizontal: 8,
  },
});

export default Button; 