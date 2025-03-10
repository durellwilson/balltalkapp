import React from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import AthleteSignup from '../../components/auth/AthleteSignup'
import { useRouter } from 'expo-router'

export default function AthleteSignupScreen() {
  const router = useRouter();

  const handleSignupSuccess = () => {
    router.push('/')
  }

  return (
    <View style={styles.container}>
      <AthleteSignup />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
