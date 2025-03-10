import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  StyleProp,
} from 'react-native';
import { defaultTheme, ThemeType } from '@/constants';

// Button variants
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

// Button sizes
export type ButtonSize = 'small' | 'medium' | 'large';

// Button props
export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  theme?: ThemeType;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Button component
 * 
 * A customizable button component with different variants and sizes.
 */
const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  leftIcon,
  rightIcon,
  theme = defaultTheme,
  fullWidth = false,
  style,
  textStyle,
  disabled,
  ...rest
}) => {
  // Get styles based on variant, size, and disabled state
  const getContainerStyle = () => {
    const baseStyle: ViewStyle = {
      ...styles.container,
      borderRadius: theme.borderRadius.m,
      ...(fullWidth && styles.fullWidth),
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: {
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.m,
      },
      medium: {
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.l,
      },
      large: {
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.xl,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primary,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
      },
      outline: {
        backgroundColor: theme.colors.transparent,
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      ghost: {
        backgroundColor: theme.colors.transparent,
      },
      danger: {
        backgroundColor: theme.colors.error,
      },
    };

    // Disabled styles
    const disabledStyle: ViewStyle = {
      opacity: 0.6,
    };

    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
      disabled && disabledStyle,
      style,
    ];
  };

  // Get text style based on variant and size
  const getTextStyle = () => {
    const baseStyle: TextStyle = {
      ...styles.text,
      fontFamily: theme.textStyle.button.fontFamily,
      fontSize: theme.textStyle.button.fontSize,
      lineHeight: theme.textStyle.button.lineHeight,
      fontWeight: theme.textStyle.button.fontWeight as TextStyle['fontWeight'],
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, TextStyle> = {
      small: {
        fontSize: theme.textStyle.body3.fontSize,
      },
      medium: {
        fontSize: theme.textStyle.body2.fontSize,
      },
      large: {
        fontSize: theme.textStyle.body1.fontSize,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: theme.colors.textInverted,
      },
      secondary: {
        color: theme.colors.textInverted,
      },
      outline: {
        color: theme.colors.primary,
      },
      ghost: {
        color: theme.colors.primary,
      },
      danger: {
        color: theme.colors.textInverted,
      },
    };

    return [baseStyle, sizeStyles[size], variantStyles[variant], textStyle];
  };

  // Get spinner color based on variant
  const getSpinnerColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return theme.colors.primary;
    }
    return theme.colors.textInverted;
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={getSpinnerColor()} size="small" />
      ) : (
        <>
          {leftIcon && <React.Fragment>{leftIcon}</React.Fragment>}
          <Text style={getTextStyle()}>{title}</Text>
          {rightIcon && <React.Fragment>{rightIcon}</React.Fragment>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },
});

export default Button;
