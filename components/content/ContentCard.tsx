import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { Text } from '../themed';

export type ContentType = 'podcast' | 'music' | 'video' | 'reel';

interface ContentCardProps {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  duration?: string;
  thumbnail: string | ImageSourcePropType;
  author?: {
    name: string;
    avatar?: string;
  };
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
  onPress?: () => void;
  compact?: boolean;
  horizontal?: boolean;
}

const ContentCard: React.FC<ContentCardProps> = ({
  type,
  title,
  description,
  duration,
  thumbnail,
  author,
  stats,
  onPress,
  compact = false,
  horizontal = false,
}) => {
  // Get icon based on content type
  const getContentIcon = () => {
    switch (type) {
      case 'podcast':
        return 'mic';
      case 'music':
        return 'musical-notes';
      case 'video':
        return 'videocam';
      case 'reel':
        return 'film';
      default:
        return 'document';
    }
  };

  // Format stats numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Render horizontal card layout
  if (horizontal) {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Image
          source={typeof thumbnail === 'string' ? { uri: thumbnail } : thumbnail}
          style={styles.horizontalThumbnail}
        />
        <View style={styles.horizontalContent}>
          <View style={styles.typeContainer}>
            <Ionicons name={getContentIcon()} size={14} color={Colors.primary} />
            <Text style={styles.typeText}>{type}</Text>
            {duration && <Text style={styles.durationText}>{duration}</Text>}
          </View>
          <Text style={styles.horizontalTitle} numberOfLines={2}>{title}</Text>
          {author && (
            <View style={styles.authorContainer}>
              {author.avatar && (
                <Image
                  source={{ uri: author.avatar }}
                  style={styles.authorAvatar}
                />
              )}
              <Text style={styles.authorName}>{author.name}</Text>
            </View>
          )}
          {stats && (
            <View style={styles.statsContainer}>
              {stats.views !== undefined && (
                <View style={styles.statItem}>
                  <Ionicons name="eye-outline" size={12} color={Colors.light.textSecondary} />
                  <Text style={styles.statText}>{formatNumber(stats.views)}</Text>
                </View>
              )}
              {stats.likes !== undefined && (
                <View style={styles.statItem}>
                  <Ionicons name="heart-outline" size={12} color={Colors.light.textSecondary} />
                  <Text style={styles.statText}>{formatNumber(stats.likes)}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Render vertical card layout (default)
  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={typeof thumbnail === 'string' ? { uri: thumbnail } : thumbnail}
          style={styles.thumbnail}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />
        <View style={styles.overlayContainer}>
          <View style={styles.typeContainer}>
            <Ionicons name={getContentIcon()} size={14} color="white" />
            <Text style={[styles.typeText, styles.typeTextOverlay]}>{type}</Text>
          </View>
          {duration && (
            <View style={styles.durationContainer}>
              <Text style={styles.durationTextOverlay}>{duration}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        
        {!compact && description && (
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
        )}

        <View style={styles.bottomContainer}>
          {author && (
            <View style={styles.authorContainer}>
              {author.avatar && (
                <Image
                  source={{ uri: author.avatar }}
                  style={styles.authorAvatar}
                />
              )}
              <Text style={styles.authorName}>{author.name}</Text>
            </View>
          )}

          {stats && (
            <View style={styles.statsContainer}>
              {stats.views !== undefined && (
                <View style={styles.statItem}>
                  <Ionicons name="eye-outline" size={12} color={Colors.light.textSecondary} />
                  <Text style={styles.statText}>{formatNumber(stats.views)}</Text>
                </View>
              )}
              {stats.likes !== undefined && (
                <View style={styles.statItem}>
                  <Ionicons name="heart-outline" size={12} color={Colors.light.textSecondary} />
                  <Text style={styles.statText}>{formatNumber(stats.likes)}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactCard: {
    height: 280,
  },
  thumbnailContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  thumbnail: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  typeTextOverlay: {
    color: 'white',
  },
  durationContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  durationTextOverlay: {
    fontSize: 12,
    color: 'white',
  },
  contentContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorName: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 100,
  },
  horizontalThumbnail: {
    width: 100,
    height: '100%',
    resizeMode: 'cover',
  },
  horizontalContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  horizontalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default ContentCard; 