import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Platform
} from 'react-native';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text, Button, Badge } from '../themed';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
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
  athlete: {
    id: string;
    name: string;
    username: string;
    sport: string;
    team?: string;
    position?: string;
    verified: boolean;
    followers: number;
    profileImage?: string;
    coverImage?: string;
    bio?: string;
  };
  onFollow?: () => void;
  compact?: boolean;
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
  },
  athlete,
  onFollow,
  compact = false,
}) => {
  const router = useRouter();

  const handleProfilePress = () => {
    router.push(`/athlete-profile/${id}`);
  };

  // Default placeholder avatar if none provided
  const avatarSource = typeof avatar === 'string' && avatar
    ? { uri: avatar }
    : typeof avatar === 'object' && avatar !== null
      ? avatar
      : require('../../assets/images/adaptive-icon.png');

  // Format follower count
  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      onPress={handleProfilePress}
      activeOpacity={0.9}
    >
      {/* Cover Image with Gradient Overlay */}
      <View style={styles.coverContainer}>
        <Image
          source={athlete.coverImage ? { uri: athlete.coverImage } : require('../../assets/images/default-cover.png')}
          style={styles.coverImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />
      </View>

      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        <Image
          source={athlete.profileImage ? { uri: athlete.profileImage } : require('../../assets/images/default-profile.png')}
          style={styles.profileImage}
        />
        {athlete.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
          </View>
        )}
      </View>

      {/* Athlete Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{athlete.name}</Text>
          <Text style={styles.username}>@{athlete.username}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <Badge label={athlete.sport} color={Colors.accent1} />
          {athlete.team && <Badge label={athlete.team} color={Colors.accent3} />}
          {athlete.position && <Badge label={athlete.position} color={Colors.accent2} />}
        </View>

        {!compact && athlete.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {athlete.bio}
          </Text>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.followersContainer}>
            <Text style={styles.followersCount}>{formatFollowers(athlete.followers)}</Text>
            <Text style={styles.followersLabel}>Followers</Text>
          </View>

          {onFollow && (
            <Button
              onPress={onFollow}
              title={isFollowing ? 'Following' : 'Follow'}
              type={isFollowing ? 'outline' : 'primary'}
              size="small"
              style={styles.followButton}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    height: 220,
  },
  coverContainer: {
    height: 100,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
  },
  profileImageContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.light.cardBackground,
    overflow: 'hidden',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 2,
  },
  infoContainer: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  nameContainer: {
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  bio: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  followersContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  followersCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  followersLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  followButton: {
    minWidth: 100,
  },
});

export default AthleteProfileCard;
