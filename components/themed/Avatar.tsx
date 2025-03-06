import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ImageSourcePropType,
  TouchableOpacity,
  ImageStyle,
} from 'react-native';
import { defaultTheme, ThemeType } from '../../constants';
import Text from './Text';

// Avatar sizes
export type AvatarSize = 'xs' | 'small' | 'medium' | 'large' | 'xl';

// Avatar variants
export type AvatarVariant = 'circle' | 'rounded' | 'square';

// Avatar props
export interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  theme?: ThemeType;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  onPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  testID?: string;
}

/**
 * Avatar component
 * 
 * A component for displaying user avatars with fallback to initials.
 */
const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  variant = 'circle',
  theme = defaultTheme,
  style,
  imageStyle,
  onPress,
  backgroundColor,
  textColor,
  testID,
}) => {
  // Get avatar size
  const getSize = (): number => {
    const sizes: Record<AvatarSize, number> = {
      xs: 24,
      small: 32,
      medium: 48,
      large: 64,
      xl: 96,
    };
    return sizes[size];
  };

  // Get border radius based on variant and size
  const getBorderRadius = (): number => {
    const avatarSize = getSize();
    
    if (variant === 'circle') {
      return avatarSize / 2;
    } else if (variant === 'rounded') {
      return theme.borderRadius.m;
    }
    return 0; // square
  };

  // Get font size based on avatar size
  const getFontSize = (): number => {
    const avatarSize = getSize();
    return avatarSize * 0.4;
  };

  // Get initials from name
  const getInitials = (): string => {
    if (!name) return '?';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  // Get container style
  const getContainerStyle = (): ViewStyle => {
    const avatarSize = getSize();
    const borderRadius = getBorderRadius();
    
    return {
      width: avatarSize,
      height: avatarSize,
      borderRadius,
      backgroundColor: backgroundColor || theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    };
  };

  // Render avatar content
  const renderContent = () => {
    if (source) {
      return (
        <Image
          source={source}
          style={[
            {
              width: '100%',
              height: '100%',
            },
            imageStyle,
          ]}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <Text
        style={{
          fontSize: getFontSize(),
          fontWeight: '600',
          color: textColor || theme.colors.textInverted,
        }}
      >
        {getInitials()}
      </Text>
    );
  };

  // Render avatar with or without touch functionality
  if (onPress) {
    return (
      <TouchableOpacity
        style={[getContainerStyle(), style]}
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getContainerStyle(), style]} testID={testID}>
      {renderContent()}
    </View>
  );
};

export default Avatar;
