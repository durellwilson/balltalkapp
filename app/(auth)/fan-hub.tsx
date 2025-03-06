import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import FanHubSignup from '../../components/auth/FanHubSignup';

export default function FanHubScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FanHubSignup />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
