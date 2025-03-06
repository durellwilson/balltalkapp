import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { defaultTheme, ThemeType } from '../../constants';
import Text from './Text';

// Badge variants
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

// Badge sizes
export type BadgeSize = 'small' | 'medium' | 'large';

// Badge positions
export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

// Badge props
export interface BadgeProps {
  content?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  position?: BadgePosition;
  theme?: ThemeType;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  visible?: boolean;
  standalone?: boolean;
  testID?: string;
}

/**
 * Badge component
 * 
 * A component for displaying badges, either standalone or attached to other components.
 */
const Badge: React.FC<BadgeProps> = ({
  content,
  variant = 'default',
  size = 'medium',
  position = 'top-right',
  theme = defaultTheme,
  style,
  textStyle,
  children,
  visible = true,
  standalone = false,
  testID,
}) => {
  // If not visible, only render children
  if (!visible) {
    return <>{children}</>;
  }

  // Get badge size
  const getBadgeSize = (): number => {
    const sizes: Record<BadgeSize, number> = {
      small: 16,
      medium: 20,
      large: 24,
    };
    return sizes[size];
  };

  // Get badge color based on variant
  const getBadgeColor = (): string => {
    const colors: Record<BadgeVariant, string> = {
      default: theme.colors.primary,
      primary: theme.colors.primary,
      success: theme.colors.success,
      warning: theme.colors.warning,
      error: theme.colors.error,
      info: theme.colors.info,
    };
    return colors[variant];
  };

  // Get text color based on variant
  const getTextColor = (): string => {
    // For all variants, use white text
    return theme.colors.textInverted;
  };

  // Get badge position styles
  const getPositionStyle = (): ViewStyle => {
    const positions: Record<BadgePosition, ViewStyle> = {
      'top-right': {
        top: -8,
        right: -8,
      },
      'top-left': {
        top: -8,
        left: -8,
      },
      'bottom-right': {
        bottom: -8,
        right: -8,
      },
      'bottom-left': {
        bottom: -8,
        left: -8,
      },
    };
    return positions[position];
  };

  // Get badge style
  const getBadgeStyle = (): ViewStyle => {
    const badgeSize = getBadgeSize();
    const badgeColor = getBadgeColor();
    
    const baseStyle: ViewStyle = {
      backgroundColor: badgeColor,
      borderRadius: badgeSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: badgeSize,
      height: badgeSize,
      paddingHorizontal: typeof content === 'number' || typeof content === 'string' ? 4 : 0,
    };
    
    // If not standalone, add position styles
    if (!standalone) {
      return {
        ...baseStyle,
        ...getPositionStyle(),
        position: 'absolute',
      };
    }
    
    return baseStyle;
  };

  // Get text style
  const getTextStyle = (): TextStyle => {
    const textColor = getTextColor();
    const fontSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;
    
    return {
      color: textColor,
      fontSize,
      fontWeight: '600',
      textAlign: 'center',
    };
  };

  // Render badge content
  const renderContent = () => {
    if (content === undefined || content === null) {
      return null;
    }
    
    if (typeof content === 'number' || typeof content === 'string') {
      return (
        <Text style={[getTextStyle(), textStyle]}>
          {content}
        </Text>
      );
    }
    
    return content;
  };

  // If standalone, just render the badge
  if (standalone) {
    return (
      <View style={[getBadgeStyle(), style]} testID={testID}>
        {renderContent()}
      </View>
    );
  }

  // Otherwise, render badge with children
  return (
    <View style={styles.container} testID={testID}>
      {children}
      <View style={[getBadgeStyle(), style]}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});

export default Badge;
