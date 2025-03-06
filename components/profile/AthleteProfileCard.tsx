import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text } from '../themed';
// import { formatNumber } from '../../utils/formatting';

// Define theme interface for proper typing
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    card: string;
    border: string;
    notification: string;
  };
}

// Define metric type for athlete statistics
export type AthleteMetric = {  // Add 'export'
  label: string;
  value: number;
  icon: string;
  color?: string;
};

// Props interface for the component
export interface AthleteProfileCardProps { // Add 'export'
  id: string;
  name: string;
  username: string;
  sport: string;
  team?: string;
  onPress?: () => void;
  position?: string;
  avatar?: string | ImageSourcePropType;
  verified?: boolean;
  isAuthenticated?: boolean;
  isFollowing?: boolean;
  metrics?: AthleteMetric[];
  onProfilePress?: () => void;
  onMessagePress?: () => void;
  onMusicPress?: () => void;
  onFollowPress?: () => void;
  onAuthenticatePress?: () => void;
  theme?: Theme;
}

// Helper function to format large numbers
const formatMetricValue = (value: number): string => {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
};

// Get icon component for different sports
const getSportIcon = (sport: string) => {
  const sportLower = sport.toLowerCase();
  
  // Map sports to their corresponding FontAwesome5 icon names
  const sportIcons: { [key: string]: string } = {
    'basketball': 'basketball-ball',
    'football': 'football-ball',
    'soccer': 'futbol',
    'baseball': 'baseball-ball',
    'tennis': 'tennis-ball',
    'golf': 'golf-ball',
    'hockey': 'hockey-puck',
    'volleyball': 'volleyball-ball',
    'running': 'running',
    'swimming': 'swimmer',
    'cycling': 'biking',
    'boxing': 'boxing-glove',
    'mma': 'fist-raised',
  };

  // Get icon name or use a default
  const iconName = 
    sportIcons[sportLower] || 
    Object.entries(sportIcons).find(([key]) => sportLower.includes(key))?.[1] || 
    'medal';

  return (
    <FontAwesome5 
      name={iconName} 
      size={16} 
      color="#999" 
      solid 
    />
  );
};

const AthleteProfileCard: React.FC<AthleteProfileCardProps> = ({
  id,
  name,
  username,
  sport,
  team,
  position,
  avatar,
  verified = false,
  isAuthenticated = false,
  isFollowing = false,
  metrics = [],
  onProfilePress,
  onMessagePress,
  onMusicPress,
  onFollowPress,
  onAuthenticatePress,
  theme = {
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#f8f8f8',
      text: '#333333',
      card: '#FFFFFF',
      border: '#DDDDDD',
      notification: '#FF3B30',
    }
  }
}) => {
  // Default placeholder avatar if none provided
  const avatarSource = typeof avatar === 'string' && avatar
    ? { uri: avatar }
    : typeof avatar === 'object' && avatar !== null
      ? avatar
      : require('../../assets/images/adaptive-icon.png');

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      {/* Card Header - Avatar, Name, Verification */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={onProfilePress}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={avatarSource}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>

          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              {verified && (
                <MaterialIcons
                  name="verified"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.verifiedIcon}
                />
              )}
            </View>

            <Text style={styles.username}>{username}</Text>

            <View style={styles.sportRow}>
              {getSportIcon(sport)}
              <Text style={styles.sportText}>
                {sport}
                {position ? ` • ${position}` : ''}
                {team ? ` • ${team}` : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isAuthenticated ? (
          <View style={[styles.authenticatedBadge, { backgroundColor: theme.colors.primary }]}>
            <MaterialIcons name="verified-user" size={12} color="white" />
            <Text style={styles.authenticatedText}>Authenticated</Text>
          </View>
        ) : onAuthenticatePress ? (
          <TouchableOpacity
            style={[styles.authenticateButton, { borderColor: theme.colors.primary }]}
            onPress={onAuthenticatePress}
          >
            <Text style={[styles.authenticateText, { color: theme.colors.primary }]}>
              Authenticate
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Card Metrics - Statistics */}
      {metrics.length > 0 && (
        <View style={styles.metricsContainer}>
          {metrics.map((metric, index) => (
            <View
              key={`${metric.label}-${index}`}
              style={styles.metricItem}
            >
              <FontAwesome5
                name={metric.icon}
                size={14}
                color={metric.color || '#666'}
                solid
                style={styles.metricIcon}
              />
              <Text style={styles.metricValue}>
                {formatMetricValue(metric.value)}
              </Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Card Actions - Follow, Message, Music */}
      <View style={styles.actionContainer}>
        {onFollowPress && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.followButton,
              isFollowing
                ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.primary }
                : { backgroundColor: theme.colors.primary }
            ]}
            onPress={onFollowPress}
          >
            <Text style={[
              styles.actionButtonText,
              isFollowing ? { color: theme.colors.primary } : { color: 'white' }
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        {onMessagePress && (
          <TouchableOpacity
            style={[styles.actionButton, styles.iconButton]}
            onPress={onMessagePress}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
          </TouchableOpacity>
        )}

        {onMusicPress && (
          <TouchableOpacity
            style={[styles.actionButton, styles.iconButton]}
            onPress={onMusicPress}
          >
            <Ionicons name="musical-notes-outline" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  nameContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  authenticatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  authenticatedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  authenticateButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  authenticateText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  metricsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricIcon: {
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 20,
    paddingVertical: 8,
    marginRight: 12,
  },
  followButton: {
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AthleteProfileCard;
