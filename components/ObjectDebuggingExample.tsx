import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { inspectObject, safePrint, safeRender } from '../../utils/objectDebugger';

// Example component demonstrating how to prevent and debug [object Object] errors
const ObjectDebuggingExample: React.FC = () => {
  // Example state with an object
  const [user, setUser] = useState({
    id: '123',
    name: 'John Doe',
    profile: {
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Music producer and songwriter'
    }
  });

  // Example state that might be undefined initially
  const [settings, setSettings] = useState<any>(undefined);

  // Example of a Promise that could cause [object Object] errors if rendered directly
  const [dataPromise, setDataPromise] = useState<Promise<any> | null>(null);

  // Simulate fetching data
  useEffect(() => {
    // Simulate loading settings after a delay
    setTimeout(() => {
      setSettings({
        theme: 'dark',
        notifications: true,
        volume: 0.8
      });
    }, 2000);

    // Create a promise that could cause issues if rendered directly
    setDataPromise(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({ message: 'Data loaded' });
        }, 3000);
      })
    );
  }, []);

  // Function to demonstrate incorrect object rendering
  const showIncorrectExample = () => {
    // This will log [object Object] errors to the console
    console.log('Incorrect user display:', user);
    console.log('Incorrect settings display:', settings);
    console.log('Incorrect promise display:', dataPromise);

    // Inspect the objects properly
    inspectObject(user, 'User object');
    inspectObject(settings, 'Settings object');
    inspectObject(dataPromise, 'Data promise');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Object Debugging Examples</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incorrect Rendering (would show [object Object])</Text>
        {/* These would cause [object Object] errors */}
        {/* <Text>User: {user}</Text> */}
        {/* <Text>Settings: {settings}</Text> */}
        {/* <Text>Data Promise: {dataPromise}</Text> */}
        
        {/* Instead, we show placeholders */}
        <Text style={styles.errorText}>❌ User: [object Object]</Text>
        <Text style={styles.errorText}>❌ Settings: [object Object]</Text>
        <Text style={styles.errorText}>❌ Data Promise: [object Object]</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Correct Property Access</Text>
        <Text>✅ User name: {user.name}</Text>
        <Text>✅ User bio: {user.profile.bio}</Text>
        {/* Using optional chaining for potentially undefined values */}
        <Text>✅ Settings theme: {settings?.theme || 'Loading...'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Using safePrint Utility</Text>
        <Text>User: {safePrint(user, 'Loading user...')}</Text>
        <Text>Settings: {safePrint(settings, 'No settings available')}</Text>
        <Text>Data Promise: {safePrint(dataPromise, 'Loading data...')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Using safeRender Utility</Text>
        <Text>User name: {safeRender(user?.name, 'Unknown user')}</Text>
        <Text>Settings theme: {safeRender(settings?.theme, 'Default theme')}</Text>
      </View>

      <Button 
        title="Inspect Objects in Console" 
        onPress={showIncorrectExample} 
      />

      <Text style={styles.note}>
        Check the console logs to see the detailed object inspection
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  errorText: {
    color: '#d32f2f',
  },
  note: {
    marginTop: 16,
    fontStyle: 'italic',
    color: '#666',
  }
});

export default ObjectDebuggingExample;
