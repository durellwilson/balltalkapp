
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark, ThemeColors } from '../constants/Colors';

// Theme context type
interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

// Create a context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: light,
  isDark: false,
  toggleTheme: () => {}
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get system color scheme
  const colorScheme = useColorScheme();
  
  // State for theme
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  
  // Update theme when system color scheme changes
  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);
  
  // Toggle theme function
  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };
  
  // Context value
  const contextValue = {
    theme: isDark ? dark : light,
    isDark,
    toggleTheme
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme in components
export const useAppTheme = () => {
  return useContext(ThemeContext);
};
