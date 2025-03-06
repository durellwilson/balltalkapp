/**
 * Themed components index
 * 
 * This file exports all themed components, making it easier to import
 * multiple components in other files.
 */

import Avatar, { AvatarProps, AvatarSize, AvatarVariant } from './Avatar';
import Badge, { BadgeProps, BadgeVariant, BadgeSize, BadgePosition } from './Badge';
import Button, { ButtonProps, ButtonVariant, ButtonSize } from './Button';
import ActionButton, { ActionButtonProps } from './ActionButton';
import Card, { CardProps, CardVariant } from './Card';
import Input, { InputProps, InputVariant, InputSize } from './Input';
import Text, { TextProps, TextVariant } from './Text';

// Export components
export { Avatar, Badge, Button, ActionButton, Card, Input, Text };

// Export types
export type {
  AvatarProps,
  AvatarSize,
  AvatarVariant,
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  BadgePosition,
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  ActionButtonProps,
  CardProps,
  CardVariant,
  InputProps,
  InputVariant,
  InputSize,
  TextProps,
  TextVariant,
};

// Export a default object with all components
export default {
  Avatar,
  Badge,
  Button,
  ActionButton,
  Card,
  Input,
  Text,
};
