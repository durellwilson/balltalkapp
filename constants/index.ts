/**
 * Constants index
 * 
 * This file exports all constants from the constants directory,
 * making it easier to import multiple constants in other files.
 */

import Colors from './Colors';
import Layout from './Layout';
import Typography from './Typography';
import Theme, { lightTheme, darkTheme, defaultTheme, Theme as ThemeType } from './Theme';

// Export individual constants
export { Colors, Layout, Typography, Theme };

// Export theme constants
export { lightTheme, darkTheme, defaultTheme };

// Export types
export type { ThemeType };

// Export a default object with all constants
export default {
  Colors,
  Layout,
  Typography,
  Theme,
};
