import React from 'react';
import { 
  View, 
  ActivityIndicator, 
  StyleSheet, 
  Text, 
  ViewStyle 
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type LoadingSize = 'small' | 'medium' | 'large';
type LoadingVariant = 'default' | 'overlay' | 'inline' | 'fullscreen';

interface LoadingIndicatorProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  message?: string;
  style?: ViewStyle;
  color?: string;
  showBackground?: boolean;
}

/**
 * LoadingIndicator Component
 * 
 * Displays a loading spinner with optional message.
 * Supports different sizes and variants for different contexts.
 * 
 * @example
 * <LoadingIndicator 
 *   size="large" 
 *   variant="overlay" 
 *   message="Loading your profile..." 
 * />
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'medium',
  variant = 'default',
  message,
  style,
  color,
  showBackground = true,
}) => {
  const { theme } = useTheme();
  
  // Map component size to ActivityIndicator size
  const getIndicatorSize = (): 'small' | 'large' => {
    switch (size) {
      case 'small':
        return 'small';
      case 'medium':
      case 'large':
        return 'large';
      default:
        return 'large';
    }
  };
  
  // Get actual size in pixels for custom styling
  const getSizePixels = (): number => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 36;
      case 'large':
        return 48;
      default:
        return 36;
    }
  };
  
  // Get indicator color
  const getColor = (): string => {
    if (color) return color;
    return theme?.primary || '#8E44AD';
  };
  
  // Render different variants
  const renderContent = () => {
    const indicatorSize = getIndicatorSize();
    const sizePixels = getSizePixels();
    const indicatorColor = getColor();
    
    return (
      <>
        <ActivityIndicator 
          size={indicatorSize} 
          color={indicatorColor}
          style={[
            styles.indicator,
            { height: sizePixels, width: sizePixels }
          ]} 
        />
        
        {message && (
          <Text style={[
            styles.message,
            { color: theme?.textSecondary || '#666666' },
            size === 'large' && styles.largeMessage,
            size === 'small' && styles.smallMessage,
          ]}>
            {message}
          </Text>
        )}
      </>
    );
  };
  
  // Render based on variant
  switch (variant) {
    case 'overlay':
      return (
        <View style={[styles.overlayContainer, style]}>
          <View style={[
            styles.overlayContent,
            showBackground && styles.overlayBackground
          ]}>
            {renderContent()}
          </View>
        </View>
      );
      
    case 'inline':
      return (
        <View style={[styles.inlineContainer, style]}>
          {renderContent()}
        </View>
      );
      
    case 'fullscreen':
      return (
        <View style={[styles.fullscreenContainer, style]}>
          {renderContent()}
        </View>
      );
      
    case 'default':
    default:
      return (
        <View style={[styles.container, style]}>
          {renderContent()}
        </View>
      );
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlayContent: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  overlayBackground: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    marginVertical: 8,
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  largeMessage: {
    fontSize: 16,
    fontWeight: '500',
  },
  smallMessage: {
    fontSize: 12,
  },
});

export default LoadingIndicator; 