import React from 'react';
import { View, StyleSheet, Text, Pressable, useColorScheme, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from '../../contexts/auth';

type NavigationItemType = {
  name: string;
  path: string;
  icon: (props: { size: number; color: string }) => React.ReactNode;
};

const NavigationBar = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isFan = user?.role === 'fan';

  // Define navigation items - reduced to 4 max
  let navigationItems: NavigationItemType[] = [
    {
      name: 'Home',
      path: '/(tabs)',
      icon: ({ size, color }) => <Ionicons name="home-sharp" size={size} color={color} />,
    },
    {
      name: 'Studio',
      path: '/(tabs)/studio',
      icon: ({ size, color }) => <Ionicons name="mic" size={size} color={color} />,
    },
    // Show Fan Hub for fans, regular profile for athletes or default
    {
      name: isFan ? 'Fan Hub' : 'Profile',
      path: isFan ? '/(tabs)/fan-profile' : '/(tabs)/profile',
      icon: ({ size, color }) => <Ionicons name={isFan ? "people" : "person"} size={size} color={color} />,
    },
    {
      name: 'Chat',
      path: '/(tabs)/chat',
      icon: ({ size, color }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} />,
    },
  ];

  // Only show the Studio tab for athletes
  if (user?.role !== 'athlete' && user?.role !== 'fan') {
    navigationItems = navigationItems.filter(item => item.path !== '/(tabs)/studio');
  }

  // Handle tab press
  const handlePress = (path: string) => {
    router.push(path);
  };

  // Get active colors based on theme
  const activeColor = isDarkMode ? '#8E44AD' : '#8E44AD'; // Purple accent color
  const inactiveColor = isDarkMode ? '#888888' : '#8E8E93';
  const backgroundColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const borderColor = isDarkMode ? '#333333' : '#E5E5E5';

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor, 
        borderTopColor: borderColor,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
          android: {
            elevation: 8,
          },
          web: {
            boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.05)'
          }
        })
      }
    ]}>
      {navigationItems.map((item) => {
        const isActive = 
          pathname === item.path || 
          (item.path === '/(tabs)' && pathname === '/(tabs)/index');
        
        return (
          <Pressable
            key={item.name}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && styles.tabItemPressed
            ]}
            onPress={() => handlePress(item.path)}
          >
            <View style={[
              styles.iconContainer,
              isActive && styles.activeIconContainer
            ]}>
              {item.icon({
                size: 24,
                color: isActive ? activeColor : inactiveColor,
              })}
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? activeColor : inactiveColor },
                isActive && styles.activeTabLabel
              ]}
            >
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 80,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(142, 68, 173, 0.1)', // Light purple background for active icon
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabLabel: {
    fontWeight: '700',
  },
});

export default NavigationBar;
