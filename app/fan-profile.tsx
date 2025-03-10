import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import FanProfileView from '@/components/profile/FanProfileView';
import FanDashboard from '../components/dashboard/FanDashboard';
import FanCommunityView from '../components/community/FanCommunityView';
import FanContentDiscovery from '../components/content/FanContentDiscovery';
import Colors from '@/constants/Colors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/auth';

export default function FanProfileScreen() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'community' | 'content'>('dashboard');
  const { user, signOut } = useAuth();

  // Check if user is a fan
  useEffect(() => {
    if (user && user.role !== 'fan') {
      Alert.alert(
        'Not a Fan Account',
        'This section is only for fan accounts. You will be redirected to the main profile.',
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/(tabs)/profile') 
          }
        ]
      );
    }
  }, [user]);

  const navigateToDashboard = () => setActiveTab('dashboard');
  const navigateToProfile = () => setActiveTab('profile');
  const navigateToCommunity = () => setActiveTab('community');
  const navigateToContent = () => setActiveTab('content');

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContent}>
          <Text style={styles.title}>Fan Hub</Text>
          <Text style={styles.message}>Please sign in to access the Fan Hub</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen 
        options={{
          title: 'Fan Hub',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={navigateToDashboard}
        >
          <Ionicons 
            name="home" 
            size={20} 
            color={activeTab === 'dashboard' ? Colors.primary : '#666'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'dashboard' && styles.activeTabText
          ]}>
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'content' && styles.activeTab]}
          onPress={navigateToContent}
        >
          <Ionicons 
            name="play-circle" 
            size={20} 
            color={activeTab === 'content' ? Colors.primary : '#666'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'content' && styles.activeTabText
          ]}>
            Content
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'community' && styles.activeTab]}
          onPress={navigateToCommunity}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === 'community' ? Colors.primary : '#666'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'community' && styles.activeTabText
          ]}>
            Community
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={navigateToProfile}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={activeTab === 'profile' ? Colors.primary : '#666'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'profile' && styles.activeTabText
          ]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'dashboard' ? (
          <FanDashboard onNavigateToProfile={navigateToProfile} />
        ) : activeTab === 'community' ? (
          <FanCommunityView />
        ) : activeTab === 'content' ? (
          <FanContentDiscovery />
        ) : (
          <FanProfileView />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabSelector: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  signOutButton: {
    padding: 8,
  },
});
