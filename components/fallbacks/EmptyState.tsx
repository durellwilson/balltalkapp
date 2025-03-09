import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface EmptyStateProps {
  title: string;
  message: string;
  icon: string;
  iconSize?: number;
  actionLabel?: string;
  onAction?: () => void;
  containerStyle?: ViewStyle;
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

/**
 * EmptyState Component
 * 
 * Displays a placeholder when there's no data to show.
 * Includes an icon, title, message, and optional action button.
 * 
 * @example
 * <EmptyState
 *   icon="musical-notes"
 *   title="No songs yet"
 *   message="Your uploaded songs will appear here"
 *   actionLabel="Upload a Song"
 *   onAction={() => navigation.navigate('Upload')}
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  iconSize = 80,
  actionLabel,
  onAction,
  containerStyle,
  secondaryAction,
}) => {
  const { isDark, theme } = useTheme();
  
  return (
    <View style={[styles.container, containerStyle]}>
      <Ionicons 
        name={icon as any} 
        size={iconSize} 
        color={isDark ? '#555555' : '#cccccc'} 
      />
      
      <Text style={[
        styles.title,
        { color: theme?.text || (isDark ? '#FFFFFF' : '#333333') }
      ]}>
        {title}
      </Text>
      
      <Text style={[
        styles.message,
        { color: theme?.textSecondary || (isDark ? '#AAAAAA' : '#666666') }
      ]}>
        {message}
      </Text>
      
      {actionLabel && onAction && (
        <TouchableOpacity 
          style={[
            styles.button,
            { backgroundColor: theme?.primary || '#8E44AD' }
          ]} 
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      
      {secondaryAction && (
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={secondaryAction.onPress}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.secondaryButtonText,
            { color: theme?.primary || '#8E44AD' }
          ]}>
            {secondaryAction.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EmptyState; 