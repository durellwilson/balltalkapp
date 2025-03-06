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
  Image,
} from 'react-native';
import SocialAuthButtons from './SocialAuthButtons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import AuthService from '../../services/AuthService';
import { db } from '../../src/lib/firebase';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import AthleteVerificationForm from '../verification/AthleteVerificationForm';

// Define valid invite codes (replace with a more secure mechanism in production)
const VALID_INVITE_CODES = ['BALLTALK2024', 'ATHLETEACCESS'];

// Cast db to proper type
const firebaseDb = db as unknown as Firestore;

const AthleteSignup = () => {
  const { signUp, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [sport, setSport] = useState('');
  const [team, setTeam] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [highlights, setHighlights] = useState(''); // Add highlights state

  // Always set to athlete for this component
  const role: 'athlete' = 'athlete';

  // Process athlete data
  const processAthleteData = () => {
    const athleteData: {
      sport?: string;
      team?: string;
    } = {};

    if (sport) athleteData.sport = sport;
    if (team) athleteData.team = team;

    return Object.keys(athleteData).length > 0 ? athleteData : null;
  };

  const handleSignup = async () => {
    // Validate inputs
    if (
      !email ||
      !password ||
      !confirmPassword ||
      !username ||
      !inviteCode
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!VALID_INVITE_CODES.includes(inviteCode)) {
      Alert.alert('Error', 'Invalid invite code');
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
      console.log(`Signing up as an athlete with username: ${username}`);

      // Process athlete data
      const athleteData = processAthleteData();

      // Store the athlete data in a local variable to use after signup
      const athleteDataToSave = athleteData;

      // Use the auth context to sign up
      await signUp(email, password, username, role);

      // Get the current user immediately after signup
      const currentUser = await AuthService.getCurrentUser();

      // If we have user and athlete data, save it
      if (currentUser?.uid && athleteDataToSave) {
        try {
          console.log('Saving athlete profile data for:', currentUser.uid);

          // Create a profile document for the athlete
          await setDoc(
            doc(firebaseDb, 'profiles', currentUser.uid),
            {
              userId: currentUser.uid,
              displayName: username,
              sport: sport || '',
              league: '', // Initialize league
              team: team || '',
              highlights: highlights ? highlights.split(',').map(h => h.trim()) : [], // Add highlights
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error('Error saving athlete profile data:', error);
          // We'll still consider signup successful even if this fails
        }
      }

      // Show verification form after successful signup
      setShowVerificationForm(true);
    } catch (error) {
      console.error('Athlete signup error:', error);
      Alert.alert(
        'Signup Error',
        error instanceof Error
          ? error.message
          : 'An error occurred during signup'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.replace('/login');
  };
  const handleVerificationComplete = () => {
    setShowVerificationForm(false);
    // The auth context will automatically redirect to the main app
  };

  const handleVerificationCancel = () => {
    setShowVerificationForm(false);
    // Redirect to a "verify later" screen or main app with limited access
    router.replace('/(tabs)'); // Example: Redirect to main tabs, adjust as needed
  };

  if (showVerificationForm) {
    return (
      <AthleteVerificationForm
        onComplete={handleVerificationComplete}
        onCancel={handleVerificationCancel}
      />
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Athlete Signup</Text>
          <Text style={styles.subtitle}>Create your exclusive athlete account</Text>
        </View>

        <View style={styles.athleteBenefits}>
          <View style={styles.benefitItem}>
            <MaterialIcons
              name="verified"
              size={24}
              color={Colors.primary}
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>Verified athlete profile</Text>
          </View>
          <View style={styles.benefitItem}>
            <AntDesign
              name="sound"
              size={24}
              color={Colors.primary}
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>Share your music with fans</Text>
          </View>
          <View style={styles.benefitItem}>
            <AntDesign
              name="user"
              size={24}
              color={Colors.primary}
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>Build your subscriber base</Text>
          </View>
          <View style={styles.benefitItem}>
            <AntDesign
              name="message1"
              size={24}
              color={Colors.primary}
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>Private athlete community</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Create Your Athlete Account</Text>

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

            <TextInput
              style={styles.input}
              placeholder="Invite Code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
              editable={!isLoading}
            />

            <Text style={styles.optionalLabel}>Athletic Information</Text>

            <TextInput
              style={styles.input}
              placeholder="Sport (e.g. Basketball, Football)"
              value={sport}
              onChangeText={setSport}
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Team (e.g. Lakers, Chiefs)"
              value={team}
              onChangeText={setTeam}
              editable={!isLoading}
            />
            <TextInput
              style={[styles.input, styles.textArea]} // Add textArea style
              placeholder="Professional Highlights (comma-separated)"
              value={highlights}
              onChangeText={setHighlights}
              editable={!isLoading}
              multiline
              numberOfLines={4}
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
              <Text style={styles.buttonText}>Create Athlete Account</Text>
            )}
          </TouchableOpacity>

          <SocialAuthButtons
            isSignUp={true}
            onAuthStart={() => setIsLoading(true)}
            onAuthEnd={() => setIsLoading(false)}
            username={username}
            role={role}
          />

          <Text style={styles.verificationNote}>
            <MaterialIcons name="info-outline" size={16} color="#666" />
            After signup, you'll need to verify your athlete status to unlock
            all features.
          </Text>
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
    backgroundColor: '#f8f9fa',
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
  athleteBenefits: {
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
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 12,
    color: '#666',
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
    backgroundColor: '#a0c4ff',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  verificationNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 40,
  },
  footerText: {
    color: '#666',
  },
  loginText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default AthleteSignup;
