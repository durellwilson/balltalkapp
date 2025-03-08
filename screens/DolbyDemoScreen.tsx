import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import DolbyDemo from '../components/audio/DolbyDemo';

const DolbyDemoScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <DolbyDemo />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default DolbyDemoScreen; 