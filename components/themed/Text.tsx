import React from 'react';
import {
  Text as RNText,
  StyleSheet,
  TextStyle,
  StyleProp,
  TextProps as RNTextProps,
} from 'react-native';
import { defaultTheme, ThemeType } from '@/constants';

// Text variants
export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body1'
  | 'body2'
  | 'body3'
  | 'caption'
  | 'button'
  | 'label'
  | 'title'
  | 'subtitle'
  | 'link';

// Text props
export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  theme?: ThemeType;
  style?: StyleProp<TextStyle>;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  transform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  children: React.ReactNode;
}

/**
 * Text component
 * 
 * A customizable text component with different variants.
 */
const Text: React.FC<TextProps> = ({
  variant = 'body1',
  theme = defaultTheme,
  style,
  color,
  align,
  transform,
  children,
  ...rest
}) => {
  // Get text style based on variant
  const getTextStyle = () => {
    // Base style from theme
    const variantStyle = theme.textStyle[variant];
    
    // Create base style with proper type casting
    const baseStyle: TextStyle = {
      color: theme.colors.text,
      fontFamily: variantStyle.fontFamily,
      fontSize: variantStyle.fontSize,
      lineHeight: variantStyle.lineHeight,
      fontWeight: variantStyle.fontWeight as TextStyle['fontWeight'],
    };

    // Additional styles
    const additionalStyles: TextStyle = {
      ...(color && { color }),
      ...(align && { textAlign: align }),
      ...(transform && { textTransform: transform }),
    };

    return [baseStyle, additionalStyles, style];
  };

  return (
    <RNText style={getTextStyle()} {...rest}>
      {children}
    </RNText>
  );
};

export default Text;
