import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import Colors from '../../constants/Colors';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';

// Mock data for community posts
interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  topic: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked?: boolean;
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: {
      id: '101',
      name: 'BasketballFan23',
    },
    content: 'Anyone else think the Lakers have a shot at the championship this year? Their lineup is looking stronger than ever!',
    topic: 'Los Angeles Lakers',
    timestamp: '2h ago',
    likes: 24,
    comments: 8,
  },
  {
    id: '2',
    author: {
      id: '102',
      name: 'SportsEnthusiast',
    },
    content: 'Just watched LeBron\'s latest interview. His dedication to the game and his community work is truly inspiring. What a legend!',
    topic: 'LeBron James',
    timestamp: '5h ago',
    likes: 42,
    comments: 15,
  },
  {
    id: '3',
    author: {
      id: '103',
      name: 'TennisLover',
    },
    content: 'Serena Williams just announced a new podcast series where she will be interviewing other athletes about their mental health journeys. Cannot wait to listen!',
    topic: 'Serena Williams',
    timestamp: '8h ago',
    likes: 37,
    comments: 12,
  },
  {
    id: '4',
    author: {
      id: '104',
      name: 'FootballFanatic',
    },
    content: 'That Manchester United game yesterday was incredible! What a comeback in the second half.',
    topic: 'Manchester United',
    timestamp: '1d ago',
    likes: 56,
    comments: 23,
  },
  {
    id: '5',
    author: {
      id: '105',
      name: 'SportsFan2000',
    },
    content: 'Does anyone know when Tom Brady is releasing his next podcast episode? The last one with his former teammates was so insightful!',
    topic: 'Tom Brady',
    timestamp: '1d ago',
    likes: 19,
    comments: 7,
  }
];

const TOPICS = [
  'All',
  'NBA',
  'NFL',
  'MLB',
  'Tennis',
  'Soccer',
  'Olympics'
];

const FanCommunityView: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => {
    // In a real app, fetch posts from an API
    // For now, we'll just use our mock data
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // In a real app, refresh posts from the server
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLikePost = (postId: string) => {
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === postId) {
          const wasLiked = post.liked || false;
          return {
            ...post,
            liked: !wasLiked,
            likes: wasLiked ? post.likes - 1 : post.likes + 1
          };
        }
        return post;
      })
    );
  };

  const handlePostComment = () => {
    if (!newPostContent.trim()) return;
    
    setIsPostingComment(true);
    
    // In a real app, this would send the comment to a server
    setTimeout(() => {
      // Add a new post to the top of the list
      const newPost: Post = {
        id: `new-${Date.now()}`,
        author: {
          id: user?.uid || 'unknown',
          name: user?.displayName || user?.username || 'Anonymous Fan',
        },
        content: newPostContent,
        topic: 'General',
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        liked: false
      };
      
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setIsPostingComment(false);
    }, 500);
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorContainer}>
          <View style={styles.avatarContainer}>
            {item.author.avatar ? (
              <Image source={{ uri: item.author.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {item.author.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.authorName}>{item.author.name}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.topicTag}>
          <Text style={styles.topicText}>{item.topic}</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.postContent}>{item.content}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLikePost(item.id)}
        >
          <AntDesign 
            name={item.liked ? "heart" : "hearto"} 
            size={18} 
            color={item.liked ? '#e74c3c' : '#666'} 
          />
          <Text style={[
            styles.actionText,
            item.liked && { color: '#e74c3c' }
          ]}>
            {item.likes}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="comment" size={18} color="#666" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="share" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topicsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicsScroll}
        >
          {TOPICS.map((topic) => (
            <TouchableOpacity 
              key={topic}
              style={[
                styles.topicButton,
                selectedTopic === topic && styles.selectedTopicButton
              ]}
              onPress={() => setSelectedTopic(topic)}
            >
              <Text 
                style={[
                  styles.topicButtonText,
                  selectedTopic === topic && styles.selectedTopicText
                ]}
              >
                {topic}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.createPostContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.postInput}
            placeholder="Share your thoughts with the community..."
            multiline
            value={newPostContent}
            onChangeText={setNewPostContent}
          />
        </View>
        <TouchableOpacity 
          style={[
            styles.postButton,
            (!newPostContent.trim() || isPostingComment) && styles.disabledButton
          ]}
          onPress={handlePostComment}
          disabled={!newPostContent.trim() || isPostingComment}
        >
          {isPostingComment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.postsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to start a conversation!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topicsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topicsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topicButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
  },
  selectedTopicButton: {
    backgroundColor: Colors.primary,
  },
  topicButtonText: {
    fontSize: 14,
    color: '#555',
  },
  selectedTopicText: {
    color: 'white',
    fontWeight: '500',
  },
  createPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postInput: {
    minHeight: 40,
    maxHeight: 100,
  },
  postButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  disabledButton: {
    backgroundColor: '#a0c4ff',
    opacity: 0.7,
  },
  postButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  postsList: {
    padding: 16,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  topicTag: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default FanCommunityView;
