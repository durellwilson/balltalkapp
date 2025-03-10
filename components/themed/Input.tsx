import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { defaultTheme, ThemeType, Colors } from '@/constants';
import Text from './Text';

// Input variants
export type InputVariant = 'default' | 'outlined' | 'filled';

// Input sizes
export type InputSize = 'small' | 'medium' | 'large';

// Input props
export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: InputVariant;
  size?: InputSize;
  theme?: ThemeType;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  helperStyle?: StyleProp<TextStyle>;
  secureTextToggle?: boolean;
}

/**
 * Input component
 * 
 * A customizable text input component with different variants and sizes.
 */
const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'medium',
  theme = defaultTheme,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperStyle,
  secureTextToggle = false,
  secureTextEntry,
  ...rest
}) => {
  // State for secure text toggle
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(!secureTextEntry);

  // Get container style based on variant and size
  const getContainerStyle = () => {
    const baseStyle: ViewStyle = {
      marginBottom: theme.spacing.m,
    };

    return [baseStyle, containerStyle];
  };

  // Get input container style based on variant, size, and error state
  const getInputContainerStyle = () => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: error ? theme.colors.error : theme.colors.border,
    };

    // Size styles
    const sizeStyles: Record<InputSize, ViewStyle> = {
      small: {
        height: 40,
      },
      medium: {
        height: 48,
      },
      large: {
        height: 56,
      },
    };

    // Variant styles
    const variantStyles: Record<InputVariant, ViewStyle> = {
      default: {
        backgroundColor: theme.colors.surface,
      },
      outlined: {
        backgroundColor: theme.colors.transparent,
      },
      filled: {
        backgroundColor: Colors.neutral300,
        borderWidth: 0,
      },
    };

    // Focus state will be handled with useState in a real implementation
    // For now, we'll just use the default styles

    return [baseStyle, sizeStyles[size], variantStyles[variant]];
  };

  // Get input style based on size
  const getInputStyle = () => {
    const baseStyle: TextStyle = {
      flex: 1,
      color: theme.colors.text,
      fontFamily: theme.fontFamily.primary,
      paddingHorizontal: theme.spacing.s,
    };

    // Size styles
    const sizeStyles: Record<InputSize, TextStyle> = {
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

    return [baseStyle, sizeStyles[size], inputStyle];
  };

  // Toggle secure text visibility
  const toggleSecureTextVisibility = () => {
    setIsSecureTextVisible(!isSecureTextVisible);
  };

  // Render secure text toggle icon
  const renderSecureTextToggle = () => {
    if (!secureTextToggle) return null;

    return (
      <TouchableOpacity
        onPress={toggleSecureTextVisibility}
        style={styles.iconContainer}
      >
        {/* You would typically use an eye/eye-off icon here */}
        <Text>{isSecureTextVisible ? 'Hide' : 'Show'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={getContainerStyle()}>
      {/* Label */}
      {label && (
        <Text
          variant="label"
          style={[styles.label, labelStyle]}
          color={error ? theme.colors.error : undefined}
        >
          {label}
        </Text>
      )}

      {/* Input container */}
      <View style={getInputContainerStyle()}>
        {/* Left icon */}
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

        {/* TextInput */}
        <TextInput
          style={getInputStyle()}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={secureTextToggle ? !isSecureTextVisible : secureTextEntry}
          {...rest}
        />

        {/* Right icon or secure text toggle */}
        {secureTextToggle
          ? renderSecureTextToggle()
          : rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </View>

      {/* Error message */}
      {error && (
        <Text
          variant="caption"
          style={[styles.helper, errorStyle]}
          color={theme.colors.error}
        >
          {error}
        </Text>
      )}

      {/* Helper text */}
      {!error && helper && (
        <Text
          variant="caption"
          style={[styles.helper, helperStyle]}
          color={theme.colors.textSecondary}
        >
          {helper}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: 4,
  },
  helper: {
    marginTop: 4,
  },
  iconContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Input;
