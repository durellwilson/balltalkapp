/**
 * Typography constants
 * 
 * This file contains typography-related constants used throughout the app.
 * Centralizing these values helps maintain consistent text styling.
 */

import { Platform } from 'react-native';
import { FONT_SIZE, LINE_HEIGHT, FONT_WEIGHT } from './Layout';

// Font families
export const FONT_FAMILY = {
  primary: Platform.OS === 'ios' ? 'System' : 'Roboto',
  secondary: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  monospace: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  // Custom fonts can be added here
  // custom: 'CustomFont-Regular',
};

// Text styles for different purposes
export const TEXT_STYLE = {
  // Headings
  h1: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.xxxl,
    lineHeight: LINE_HEIGHT.xxxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  h2: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.xxl,
    lineHeight: LINE_HEIGHT.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  h3: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.xl,
    lineHeight: LINE_HEIGHT.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  h4: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.l,
    lineHeight: LINE_HEIGHT.l,
    fontWeight: FONT_WEIGHT.bold,
  },
  h5: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.m,
    lineHeight: LINE_HEIGHT.m,
    fontWeight: FONT_WEIGHT.bold,
  },
  h6: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.s,
    lineHeight: LINE_HEIGHT.s,
    fontWeight: FONT_WEIGHT.bold,
  },

  // Body text
  body1: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.m,
    lineHeight: LINE_HEIGHT.m,
    fontWeight: FONT_WEIGHT.regular,
  },
  body2: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.s,
    lineHeight: LINE_HEIGHT.s,
    fontWeight: FONT_WEIGHT.regular,
  },
  body3: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.xs,
    lineHeight: LINE_HEIGHT.xs,
    fontWeight: FONT_WEIGHT.regular,
  },

  // Special text styles
  caption: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.xs,
    lineHeight: LINE_HEIGHT.xs,
    fontWeight: FONT_WEIGHT.regular,
  },
  button: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.m,
    lineHeight: LINE_HEIGHT.m,
    fontWeight: FONT_WEIGHT.semibold,
  },
  label: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.s,
    lineHeight: LINE_HEIGHT.s,
    fontWeight: FONT_WEIGHT.medium,
  },
  title: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.xl,
    lineHeight: LINE_HEIGHT.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.l,
    lineHeight: LINE_HEIGHT.l,
    fontWeight: FONT_WEIGHT.medium,
  },
  link: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.m,
    lineHeight: LINE_HEIGHT.m,
    fontWeight: FONT_WEIGHT.medium,
    textDecorationLine: 'underline',
  },
};

// Text transformations
export const TEXT_TRANSFORM = {
  none: 'none',
  capitalize: 'capitalize',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
};

// Text alignments
export const TEXT_ALIGN = {
  auto: 'auto',
  left: 'left',
  right: 'right',
  center: 'center',
  justify: 'justify',
};

// Text decorations
export const TEXT_DECORATION = {
  none: 'none',
  underline: 'underline',
  lineThrough: 'line-through',
  underlineLineThrough: 'underline line-through',
};

// Export a default object for easy importing
export default {
  fontFamily: FONT_FAMILY,
  textStyle: TEXT_STYLE,
  textTransform: TEXT_TRANSFORM,
  textAlign: TEXT_ALIGN,
  textDecoration: TEXT_DECORATION,
};
