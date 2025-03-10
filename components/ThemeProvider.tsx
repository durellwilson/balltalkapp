import React from 'react';
import { useTheme } from '../hooks/useTheme';

// Theme provider component that uses the useTheme hook
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // The useTheme hook already handles theme preferences and system changes
  return (
    <>{children}</>
  );
};

// Re-export the useTheme hook as useAppTheme for backward compatibility
export const useAppTheme = useTheme;
