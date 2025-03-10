import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  Text,
  TextStyle,
} from 'react-native';
import Colors from '@/constants/Colors';
import GlassyContainer from './GlassyContainer';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  onPress?: () => void;
  title?: string;
  titleStyle?: StyleProp<TextStyle>;
  subtitle?: string;
  subtitleStyle?: StyleProp<TextStyle>;
  footer?: React.ReactNode;
  footerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  borderRadius?: number;
}

/**
 * Modern Card component with multiple variants
 * 
 * @param children - The content to display inside the card
 * @param style - Additional styles to apply to the card
 * @param variant - The card style variant
 * @param onPress - Function to call when the card is pressed
 * @param title - Optional title to display at the top of the card
 * @param titleStyle - Additional styles to apply to the title
 * @param subtitle - Optional subtitle to display below the title
 * @param subtitleStyle - Additional styles to apply to the subtitle
 * @param footer - Optional footer content to display at the bottom of the card
 * @param footerStyle - Additional styles to apply to the footer
 * @param disabled - Whether the card is disabled (only applies if onPress is provided)
 * @param borderRadius - The border radius of the card
 */
const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
  title,
  titleStyle,
  subtitle,
  subtitleStyle,
  footer,
  footerStyle,
  disabled = false,
  borderRadius = 16,
}) => {
  // Determine card styles based on variant
  const getCardStyles = (): StyleProp<ViewStyle> => {
    const baseStyle: ViewStyle = {
      ...styles.card,
      borderRadius,
    };

    switch (variant) {
      case 'elevated':
        return [baseStyle, styles.elevatedCard];
      case 'outlined':
        return [baseStyle, styles.outlinedCard];
      case 'glass':
        return [baseStyle, styles.glassCard];
      default:
        return [baseStyle, styles.defaultCard];
    }
  };

  // Render card header if title or subtitle is provided
  const renderHeader = () => {
    if (!title && !subtitle) return null;

    return (
      <View style={styles.headerContainer}>
        {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
        {subtitle && <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>}
      </View>
    );
  };

  // Render card content
  const renderContent = () => (
    <>
      {renderHeader()}
      <View style={styles.contentContainer}>{children}</View>
      {footer && <View style={[styles.footerContainer, footerStyle]}>{footer}</View>}
    </>
  );

  // Render the appropriate card based on variant
  if (variant === 'glass') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress || disabled}
        activeOpacity={onPress ? 0.8 : 1}
        style={[getCardStyles(), style]}
      >
        <GlassyContainer style={styles.glassyContent} borderRadius={borderRadius}>
          {renderContent()}
        </GlassyContainer>
      </TouchableOpacity>
    );
  } else {
    const CardComponent = onPress ? TouchableOpacity : View;
    const cardProps = onPress
      ? {
          onPress,
          disabled,
          activeOpacity: 0.8,
        }
      : {};

    return (
      <CardComponent style={[getCardStyles(), style]} {...cardProps}>
        {renderContent()}
      </CardComponent>
    );
  }
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  defaultCard: {
    backgroundColor: Colors.neutral100,
    padding: 16,
  },
  elevatedCard: {
    backgroundColor: Colors.neutral100,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlinedCard: {
    backgroundColor: Colors.neutral100,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral400,
  },
  glassCard: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  glassyContent: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral800,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutral700,
  },
  contentContainer: {
    flex: 1,
  },
  footerContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral300,
    paddingTop: 16,
  },
});

export default Card; 