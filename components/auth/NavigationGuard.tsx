import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/auth';

// Define routes that are accessible without authentication
const PUBLIC_ROUTES = ['Login', 'Register', 'ForgotPassword', 'Home'];

// Define routes specific to athletes
const ATHLETE_ROUTES = [
  'Studio', 
  'Recording', 
  'Upload', 
  'AudioMastering', 
  'SaveProcessedAudio',
  'PendingUploads'
];

// Define routes specific to fans
const FAN_ROUTES = [
  'Discover',
  'Feed',
  'Trending'
];

// Define routes accessible to all authenticated users
const AUTHENTICATED_ROUTES = [
  'Profile',
  'Settings',
  'Notifications'
];

interface NavigationGuardProps {
  children: React.ReactNode;
}

const NavigationGuard: React.FC<NavigationGuardProps> = ({ children }) => {
  const { user, loading, isAuthenticated, checkAuthState } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const [isChecking, setIsChecking] = useState(true);
  const [lastRouteName, setLastRouteName] = useState<string | null>(null);

  // Check authentication state on mount and when route changes
  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);
      
      // Skip check for public routes
      if (PUBLIC_ROUTES.includes(route.name)) {
        setIsChecking(false);
        return;
      }
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        const isLoggedIn = await checkAuthState();
        
        if (!isLoggedIn) {
          console.log(`Redirecting to Login from ${route.name} - User not authenticated`);
          router.push('/login', { 
            returnTo: route.name !== 'Login' ? route.name : undefined 
          });
        }
      } else {
        // User is authenticated, check role-based access
        if (user?.role === 'athlete') {
          // Athletes can access athlete routes and common authenticated routes
          if (FAN_ROUTES.includes(route.name)) {
            console.log(`Redirecting athlete from fan route: ${route.name}`);
            router.push('/home');
          }
        } else if (user?.role === 'fan') {
          // Fans can access fan routes and common authenticated routes
          if (ATHLETE_ROUTES.includes(route.name)) {
            console.log(`Redirecting fan from athlete route: ${route.name}`);
            router.push('/home');
          }
        }
        
        // Save last valid route for this user
        setLastRouteName(route.name);
      }
      
      setIsChecking(false);
    };
    
    checkAuth();
  }, [route.name, isAuthenticated, user?.role]);

  // Show loading indicator while checking authentication
  if (loading || isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Render children once authentication is checked
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333333',
  },
});

export default NavigationGuard; 