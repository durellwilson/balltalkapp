import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './contexts/auth';
import { ThemeProvider } from './components/ThemeProvider';
import { useFonts } from 'expo-font';
import { LogBox } from 'react-native';
import ErrorBoundary from './components/ErrorBoundary';
import NavigationGuard from './components/auth/NavigationGuard';
import OfflineProvider from './contexts/OfflineContext';
import OfflineNotice from './components/fallbacks/OfflineNotice';
// Import Firebase configuration
import { firebaseApp } from './config/firebase.config';

// Screens
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import StudioScreen from './screens/StudioScreen';
import RecordingScreen from './screens/RecordingScreen';
import UploadScreen from './screens/UploadScreen';
import PendingUploadsScreen from './screens/PendingUploadsScreen';
import AudioMasteringScreen from './screens/AudioMasteringScreen';
import SaveProcessedAudioScreen from './screens/SaveProcessedAudioScreen';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: Failed prop type: Invalid prop `textStyle` of type `array` supplied to `Cell`',
  'Non-serializable values were found in the navigation state',
]);

// Create the stack navigator
const Stack = createStackNavigator();

// Navigation configuration with role-based access
const athleteScreens = [
  { name: 'Studio', component: StudioScreen, options: { headerShown: false } },
  { name: 'Recording', component: RecordingScreen, options: { title: "Recording" } },
  { name: 'Upload', component: UploadScreen, options: { title: "Upload" } },
  { name: 'AudioMastering', component: AudioMasteringScreen, options: { title: "Audio Mastering" } },
  { name: 'SaveProcessedAudio', component: SaveProcessedAudioScreen, options: { title: "Save Audio" } },
  { name: 'PendingUploads', component: PendingUploadsScreen, options: { title: "Pending Uploads" } },
];

// Common screens accessible to all users
const commonScreens = [
  { name: 'Home', component: HomeScreen, options: { headerShown: false } },
  { name: 'Login', component: LoginScreen, options: { title: "Login" } },
  { name: 'Register', component: RegisterScreen, options: { title: "Register" } },
  { name: 'Profile', component: ProfileScreen, options: { title: "Profile" } },
  { name: 'Settings', component: SettingsScreen, options: { title: "Settings" } },
];

export default function App() {
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    'Inter-Black': require('./assets/fonts/Inter-Black.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
  });

  useEffect(() => {
    // Check if Firebase is initialized
    if (firebaseApp) {
      console.log('Firebase initialized in App.tsx');
      setLoading(false);
    } else {
      console.error('Firebase initialization failed in App.tsx');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <OfflineProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <StatusBar style="auto" />
              <NavigationContainer>
                <OfflineNotice />
                <Stack.Navigator initialRouteName="Home">
                  {/* Wrap each screen with NavigationGuard */}
                  {commonScreens.map(screen => (
                    <Stack.Screen 
                      key={screen.name}
                      name={screen.name} 
                      options={screen.options}
                    >
                      {props => (
                        <NavigationGuard>
                          <ErrorBoundary>
                            <screen.component {...props} />
                          </ErrorBoundary>
                        </NavigationGuard>
                      )}
                    </Stack.Screen>
                  ))}
                  
                  {/* Athlete-specific screens */}
                  {athleteScreens.map(screen => (
                    <Stack.Screen 
                      key={screen.name}
                      name={screen.name} 
                      options={screen.options}
                    >
                      {props => (
                        <NavigationGuard>
                          <ErrorBoundary>
                            <screen.component {...props} />
                          </ErrorBoundary>
                        </NavigationGuard>
                      )}
                    </Stack.Screen>
                  ))}
                </Stack.Navigator>
              </NavigationContainer>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </OfflineProvider>
    </ErrorBoundary>
  );
} 