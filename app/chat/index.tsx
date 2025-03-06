import { FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import { Ionicons } from '@expo/vector-icons';

// Mock data for chats
const MOCK_CHATS = [
  {
    id: '1',
    name: 'NBA Musicians',
    lastMessage: 'LeBron: Just dropped a new track!',
    timestamp: '2h ago',
    isGroup: true
  },
  {
    id: '2',
    name: 'Michael Jordan',
    lastMessage: 'Hey there! Thanks for connecting.',
    timestamp: '1h ago',
    isGroup: false
  },
  {
    id: '3',
    name: 'Serena Williams',
    lastMessage: 'Check out my new song!',
    timestamp: '3h ago',
    isGroup: false
  }
];

export default function ChatIndex() {
  const { user } = useAuth();

  const renderItem = ({ item }: { item: typeof MOCK_CHATS[number] }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.avatar}>
        <Ionicons 
          name={item.isGroup ? "people" : "person"} 
          size={24} 
          color="#007AFF" 
        />
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
      </View>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight} />
      </View>
      
      <FlatList
        data={MOCK_CHATS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    padding: 16
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  chatInfo: {
    flex: 1
  },
  chatName: {
    fontSize: 16,
    fontWeight: '500'
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  timestamp: {
    fontSize: 12,
    color: '#999'
  }
});
