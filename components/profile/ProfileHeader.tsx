import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { defaultTheme, ThemeType, Colors } from '@/constants';
import { Avatar, Text, Button } from '../themed';

// Profile stats interface
export interface ProfileStat {
  label: string;
  value: number | string;
  onPress?: () => void;
}

// ProfileHeader props
export interface ProfileHeaderProps {
  name: string;
  username?: string;
  bio?: string;
  avatar?: ImageSourcePropType;
  coverImage?: ImageSourcePropType;
  sport?: string;
  team?: string;
  stats?: ProfileStat[];
  isFollowing?: boolean;
  isCurrentUser?: boolean;
  onFollowPress?: () => void;
  onMessagePress?: () => void;
  onEditProfilePress?: () => void;
  onAvatarPress?: () => void;
  onCoverPress?: () => void;
  theme?: ThemeType;
  style?: StyleProp<ViewStyle>;
  verified?: boolean;
}

/**
 * ProfileHeader component
 * 
 * A component for displaying the header section of an athlete profile.
 */
const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  username,
  bio,
  avatar,
  coverImage,
  sport,
  team,
  stats = [],
  isFollowing = false,
  isCurrentUser = false,
  onFollowPress,
  onMessagePress,
  onEditProfilePress,
  onAvatarPress,
  onCoverPress,
  theme = defaultTheme,
  style,
  verified = false,
}) => {
  // Format number for display (e.g., 1.2K)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        {coverImage ? (
          <TouchableOpacity
            style={styles.coverImageContainer}
            onPress={onCoverPress}
            disabled={!onCoverPress}
          >
            <View style={[styles.coverImage, { backgroundColor: theme.colors.surface }]} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: theme.colors.surface }]} />
        )}
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfoContainer}>
        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={onAvatarPress}
          disabled={!onAvatarPress}
        >
          <Avatar
            source={avatar}
            name={name}
            size="xl"
            style={styles.avatar}
          />
          {verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.primary }]}>
              <MaterialIcons name="verified" size={16} color="white" />
            </View>
          )}
        </TouchableOpacity>

        {/* Name and Username */}
        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text variant="h3" style={styles.name}>
              {name}
            </Text>
            {verified && (
              <MaterialIcons
                name="verified"
                size={20}
                color={theme.colors.primary}
                style={styles.verifiedIcon}
              />
            )}
          </View>
          {username && (
            <Text
              variant="body2"
              color={theme.colors.textSecondary}
              style={styles.username}
            >
              {username}
            </Text>
          )}
          {(sport || team) && (
            <Text
              variant="body2"
              color={theme.colors.textSecondary}
              style={styles.sportTeam}
            >
              {sport}
              {sport && team && ' • '}
              {team}
            </Text>
          )}
        </View>

        {/* Bio */}
        {bio && (
          <Text
            variant="body2"
            style={styles.bio}
            color={theme.colors.text}
          >
            {bio}
          </Text>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.statItem}
                onPress={stat.onPress}
                disabled={!stat.onPress}
              >
                <Text
                  variant="h4"
                  style={styles.statValue}
                  color={theme.colors.text}
                >
                  {typeof stat.value === 'number' ? formatNumber(stat.value as number) : stat.value}
                </Text>
                <Text
                  variant="body3"
                  style={styles.statLabel}
                  color={theme.colors.textSecondary}
                >
                  {stat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {isCurrentUser ? (
            <Button
              title="Edit Profile"
              variant="outline"
              size="medium"
              leftIcon={<Ionicons name="pencil" size={16} color={theme.colors.primary} />}
              onPress={onEditProfilePress}
              style={styles.editProfileButton}
              fullWidth
            />
          ) : (
            <View style={styles.actionButtons}>
              <Button
                title={isFollowing ? 'Following' : 'Follow'}
                variant={isFollowing ? 'outline' : 'primary'}
                size="medium"
                onPress={onFollowPress}
                style={styles.followButton}
              />
              <Button
                title="Message"
                variant="outline"
                size="medium"
                leftIcon={<Ionicons name="chatbubble-outline" size={16} color={theme.colors.primary} />}
                onPress={onMessagePress}
                style={styles.messageButton}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  coverContainer: {
    height: 150,
    width: '100%',
    overflow: 'hidden',
  },
  coverImageContainer: {
    width: '100%',
    height: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
  },
  profileInfoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  avatarContainer: {
    marginTop: -50,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  avatar: {
    borderWidth: 4,
    borderColor: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  nameContainer: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    marginRight: 4,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  username: {
    marginBottom: 4,
  },
  sportTeam: {
    marginBottom: 8,
  },
  bio: {
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    marginRight: 24,
    alignItems: 'center',
  },
  statValue: {
    marginBottom: 4,
  },
  statLabel: {},
  actionButtonsContainer: {
    width: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  followButton: {
    flex: 1,
    marginRight: 8,
  },
  messageButton: {
    flex: 1,
    marginLeft: 8,
  },
  editProfileButton: {
    width: '100%',
  },
});

export default ProfileHeader;
