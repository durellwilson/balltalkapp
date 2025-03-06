/**
 * Components index
 * 
 * This file exports all components from the components directory,
 * making it easier to import multiple components in other files.
 */

// Import themed components
import ThemedComponents, {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Text,
  AvatarProps,
  BadgeProps,
  ButtonProps,
  CardProps,
  InputProps,
  TextProps,
  AvatarSize,
  AvatarVariant,
  BadgeVariant,
  BadgeSize,
  BadgePosition,
  ButtonVariant,
  ButtonSize,
  CardVariant,
  InputVariant,
  InputSize,
  TextVariant,
} from './themed';

// Import layout components
import LayoutComponents, {
  ProfileLayout,
  ProfileLayoutProps,
} from './layout';

// Import profile components
import ProfileComponents, {
  ProfileHeader,
  AthleteProfileCard,
  ProfileHeaderProps,
  AthleteProfileCardProps,
  ProfileStat,
  AthleteMetric,
} from './profile';

// Import dashboard components
import DashboardComponents, {
  AthleteDashboard,
} from './dashboard';

// Export themed components
export {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Text,
};

// Export layout components
export {
  ProfileLayout,
};

// Export profile components
export {
  ProfileHeader,
  AthleteProfileCard,
};

// Export dashboard components
export {
  AthleteDashboard,
};

// Export types
export type {
  AvatarProps,
  BadgeProps,
  ButtonProps,
  CardProps,
  InputProps,
  TextProps,
  AvatarSize,
  AvatarVariant,
  BadgeVariant,
  BadgeSize,
  BadgePosition,
  ButtonVariant,
  ButtonSize,
  CardVariant,
  InputVariant,
  InputSize,
  TextVariant,
  ProfileLayoutProps,
  ProfileHeaderProps,
  AthleteProfileCardProps,
  ProfileStat,
  AthleteMetric,
};

// Export a default object with all components
export default {
  ...ThemedComponents,
  ...LayoutComponents,
  ...ProfileComponents,
  ...DashboardComponents,
};
