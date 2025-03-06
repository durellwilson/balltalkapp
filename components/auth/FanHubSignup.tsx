import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import SocialAuthButtons from './SocialAuthButtons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import { AntDesign } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import AuthService from '../../services/AuthService';

const FanHubSignup = () => {
  const { signUp, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteTeams, setFavoriteTeams] = useState('');
  const [favoriteAthletes, setFavoriteAthletes] = useState('');

  // Always set to fan for this component
  const role: 'fan' = 'fan';

  // Process favorite teams and athletes into arrays
  const processFavoriteData = () => {
    const fanProfileData: {
      favoriteTeams?: string[],
      favoriteAthletes?: string[]
    } = {};
    
    if (favoriteTeams) {
      fanProfileData.favoriteTeams = favoriteTeams
        .split(',')
        .map(team => team.trim())
        .filter(team => team.length > 0);
    }
    
    if (favoriteAthletes) {
      fanProfileData.favoriteAthletes = favoriteAthletes
        .split(',')
        .map(athlete => athlete.trim())
        .filter(athlete => athlete.length > 0);
    }
    
    return Object.keys(fanProfileData).length > 0 ? fanProfileData : null;
  };

  const handleSignup = async () => {
    // Validate inputs
    if (!email || !password || !confirmPassword || !username) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Signing up as a fan with username: ${username}`);
      
      // Process any favorite teams/athletes
      const fanProfileData = processFavoriteData();
      
      // Store the favorites data in a local variable to use after signup
      const favoriteDataToSave = fanProfileData;
      
      // Use the auth context to sign up
      await signUp(email, password, username, role);
      
      // Get the current user immediately after signup
      const currentUser = await AuthService.getCurrentUser();
      
      // If we have user and favorite data, save it
      if (currentUser?.uid && favoriteDataToSave) {
        try {
          console.log("Saving fan profile data for:", currentUser.uid);
          await AuthService.updateFanProfile(currentUser.uid, favoriteDataToSave);
        } catch (error) {
          console.error("Error saving fan profile data:", error);
          // We'll still consider signup successful even if this fails
        }
      }

      Alert.alert(
        'Welcome to the Fan Hub!', 
        'Your account has been created successfully. Get ready to connect with your favorite athletes!',
        [{ 
          text: 'Let\'s Go!', 
          onPress: () => {
            console.log('Fan signup success');
            // The auth context will automatically redirect to the main app
            // where the user will see the Fan Hub tab in the navigation
          }
        }]
      );
    } catch (error) {
      console.error('Fan signup error:', error);
      Alert.alert('Signup Error', error instanceof Error ? error.message : 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.replace('/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Fan Hub</Text>
          <Text style={styles.subtitle}>Join the community of sports fans</Text>
        </View>

        <View style={styles.fanBenefits}>
          <View style={styles.benefitItem}>
            <AntDesign name="videocamera" size={24} color={Colors.primary} style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Exclusive athlete content</Text>
          </View>
          <View style={styles.benefitItem}>
            <AntDesign name="sound" size={24} color={Colors.primary} style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Podcasts from your favorite athletes</Text>
          </View>
          <View style={styles.benefitItem}>
            <AntDesign name="message1" size={24} color={Colors.primary} style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Community discussions</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Create Your Fan Account</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />

            <Text style={styles.optionalLabel}>Optional Information</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Favorite Teams (comma separated)"
              value={favoriteTeams}
              onChangeText={setFavoriteTeams}
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Favorite Athletes (comma separated)"
              value={favoriteAthletes}
              onChangeText={setFavoriteAthletes}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>Join Fan Hub</Text>
            )}
          </TouchableOpacity>
          
          <SocialAuthButtons 
            isSignUp={true}
            onAuthStart={() => setIsLoading(true)}
            onAuthEnd={() => setIsLoading(false)}
            username={username}
            role={role}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  fanBenefits: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  optionalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 12,
    color: '#666'
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#a0c4ff'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 40,
  },
  footerText: {
    color: '#666'
  },
  loginText: {
    color: Colors.primary,
    fontWeight: 'bold'
  }
});

export default FanHubSignup;
