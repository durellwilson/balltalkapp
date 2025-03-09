import { useColorScheme } from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors, { ThemeColors, light, dark } from '../constants/Colors';

/**
 * Theme preferences type
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Theme hook result type
 */
export interface ThemeResult {
  isDark: boolean;
  theme: ThemeColors;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

// Storage key constant
const THEME_PREFERENCE_KEY = 'themePreference';

/**
 * useTheme Hook
 * 
 * A custom hook that provides theme information and controls.
 * Supports light mode, dark mode, and system preference.
 * 
 * @returns {ThemeResult} Theme information and control functions
 */
export function useTheme(): ThemeResult {
  // Get system color scheme
  const systemColorScheme = useColorScheme();
  
  // Theme preference state
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  
  // Determine if dark mode is active
  const isDark = useMemo(() => 
    themePreference === 'dark' || 
    (themePreference === 'system' && systemColorScheme === 'dark'),
    [themePreference, systemColorScheme]
  );
  
  // Get the theme object
  const theme = useMemo(() => isDark ? dark : light, [isDark]);
  
  // Load theme preference from storage on mount
  useEffect(() => {
    async function loadThemePreference() {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedPreference && ['light', 'dark', 'system'].includes(savedPreference)) {
          setThemePreferenceState(savedPreference as ThemePreference);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    }
    
    loadThemePreference();
  }, []);
  
  // Save theme preference to storage
  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
      setThemePreferenceState(preference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, []);
  
  // Toggle between light and dark mode
  const toggleTheme = useCallback(async () => {
    const newPreference = isDark ? 'light' : 'dark';
    await setThemePreference(newPreference);
  }, [isDark, setThemePreference]);
  
  // Return the theme information and controls
  return {
    isDark,
    theme,
    themePreference,
    setThemePreference,
    toggleTheme,
  };
} 