import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { defaultTheme, ThemeType } from '../../constants';

// Card variants
export type CardVariant = 'default' | 'elevated' | 'outlined';

// Card props
export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  theme?: ThemeType;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: TouchableOpacityProps['onPress'];
  disabled?: boolean;
  testID?: string;
}

/**
 * Card component
 * 
 * A container component with different variants for displaying content.
 */
const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  theme = defaultTheme,
  style,
  contentStyle,
  onPress,
  disabled = false,
  testID,
}) => {
  // Get card style based on variant
  const getCardStyle = () => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.m,
      overflow: 'hidden',
    };

    // Variant styles
    const variantStyles: Record<CardVariant, ViewStyle> = {
      default: {
        ...theme.shadow.small,
      },
      elevated: {
        ...theme.shadow.medium,
      },
      outlined: {
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
    };

    return [baseStyle, variantStyles[variant], style];
  };

  // Get content style
  const getContentStyle = () => {
    const baseStyle: ViewStyle = {
      padding: theme.spacing.m,
    };

    return [baseStyle, contentStyle];
  };

  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        testID={testID}
      >
        <View style={getContentStyle()}>{children}</View>
      </TouchableOpacity>
    );
  }

  // Otherwise, render as a View
  return (
    <View style={getCardStyle()} testID={testID}>
      <View style={getContentStyle()}>{children}</View>
    </View>
  );
};

export default Card;
