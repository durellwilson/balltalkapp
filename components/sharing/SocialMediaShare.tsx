import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import * as Clipboard from 'expo-clipboard';

interface SocialMediaShareProps {
  title?: string;
  description?: string;
  audioUrl?: string;
  imageUrl?: string;
  artistName?: string;
  albumName?: string;
  onError?: (message: string) => void;
  onSuccess?: (platform: string) => void;
  isPublic?: boolean;
}

type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'whatsapp' | 'email' | 'link' | 'sms';

const SocialMediaShare: React.FC<SocialMediaShareProps> = ({
  title = 'Check out this audio',
  description = 'Listen to this amazing audio I found on BallTalk!',
  audioUrl,
  imageUrl,
  artistName,
  albumName,
  onError,
  onSuccess,
  isPublic = true,
}) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCustomModalVisible, setIsCustomModalVisible] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [customMessage, setCustomMessage] = useState<string>('');
  
  // Social media platforms
  const platforms: Array<{id: SocialPlatform; name: string; icon: string; color: string}> = [
    { id: 'twitter', name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
    { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#4267B2' },
    { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
    { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', color: '#000000' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
    { id: 'email', name: 'Email', icon: 'mail', color: '#DD4B39' },
    { id: 'sms', name: 'SMS', icon: 'chatbubble', color: '#5BC236' },
    { id: 'link', name: 'Copy Link', icon: 'link', color: '#607D8B' },
  ];
  
  // Check if the platform is installed
  const isPlatformInstalled = async (platform: SocialPlatform): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    
    try {
      const urls: Record<SocialPlatform, string> = {
        twitter: 'twitter://',
        facebook: 'fb://',
        instagram: 'instagram://',
        tiktok: 'tiktok://',
        whatsapp: 'whatsapp://',
        email: 'mailto:',
        sms: 'sms:',
        link: '',
      };
      
      if (platform === 'link') return true;
      
      const url = urls[platform];
      const canOpen = await Linking.canOpenURL(url);
      return canOpen;
    } catch (error) {
      console.error(`Error checking if ${platform} is installed:`, error);
      return false;
    }
  };
  
  // Get share URL for each platform
  const getShareUrl = (platform: SocialPlatform): string => {
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    const encodedUrl = encodeURIComponent(audioUrl || '');
    const encodedArtist = encodeURIComponent(artistName || '');
    
    const baseMessage = `${encodedTitle} - ${encodedArtist ? `by ${encodedArtist}` : ''} ${encodedDescription}`;
    
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${baseMessage}&url=${encodedUrl}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${baseMessage}`;
      case 'whatsapp':
        return `whatsapp://send?text=${baseMessage} ${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
      case 'sms':
        return `sms:&body=${baseMessage} ${encodedUrl}`;
      default:
        return audioUrl || '';
    }
  };
  
  // Share content
  const shareContent = async (platform: SocialPlatform) => {
    try {
      setIsLoading(true);
      
      // Check if the platform is installed
      const installed = await isPlatformInstalled(platform);
      
      if (!installed && platform !== 'link') {
        throw new Error(`${platform} app is not installed`);
      }
      
      // For link copying
      if (platform === 'link') {
        await Clipboard.setStringAsync(audioUrl || '');
        Alert.alert('Link Copied', 'The audio link has been copied to your clipboard.');
        onSuccess?.('link');
        setIsLoading(false);
        return;
      }
      
      // For platforms that need custom message
      if (platform === 'instagram' || platform === 'tiktok') {
        setSelectedPlatform(platform);
        setIsCustomModalVisible(true);
        setIsLoading(false);
        return;
      }
      
      // For standard sharing
      const shareUrl = getShareUrl(platform);
      
      if (Platform.OS === 'web') {
        window.open(shareUrl, '_blank');
        onSuccess?.(platform);
      } else {
        const canOpen = await Linking.canOpenURL(shareUrl);
        
        if (canOpen) {
          await Linking.openURL(shareUrl);
          onSuccess?.(platform);
        } else {
          // Fallback to the native share dialog
          await Share.share({
            title,
            message: `${description} ${audioUrl || ''}`,
            url: audioUrl,
          });
          onSuccess?.(platform);
        }
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      onError?.(`Failed to share to ${platform}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle Instagram or TikTok sharing (requires custom steps)
  const handleCustomPlatformShare = async () => {
    if (!selectedPlatform) return;
    
    try {
      setIsLoading(true);
      
      // First, copy to clipboard
      const message = customMessage || description;
      const fullMessage = `${message} ${audioUrl || ''}`;
      await Clipboard.setStringAsync(fullMessage);
      
      setIsCustomModalVisible(false);
      
      // Alert user to instructions
      Alert.alert(
        `Share to ${selectedPlatform === 'instagram' ? 'Instagram' : 'TikTok'}`,
        `The message has been copied to your clipboard. Please follow these steps:\n\n` +
        `1. Open the ${selectedPlatform === 'instagram' ? 'Instagram' : 'TikTok'} app\n` +
        `2. Start creating a new post\n` +
        `3. Paste the copied message in the caption\n`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: `Open ${selectedPlatform === 'instagram' ? 'Instagram' : 'TikTok'}`, 
            onPress: async () => {
              const url = selectedPlatform === 'instagram' ? 'instagram://' : 'tiktok://';
              const canOpen = await Linking.canOpenURL(url);
              
              if (canOpen) {
                await Linking.openURL(url);
                onSuccess?.(selectedPlatform);
              } else {
                onError?.(`${selectedPlatform} app is not installed`);
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error(`Error with custom platform share:`, error);
      onError?.(`Failed to share: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Native share dialog
  const openNativeShareDialog = async () => {
    try {
      setIsLoading(true);
      
      const result = await Share.share({
        title,
        message: `${description} ${audioUrl || ''}`,
        url: audioUrl,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          onSuccess?.(result.activityType);
        } else {
          onSuccess?.('native');
        }
      }
    } catch (error) {
      console.error('Error using native share:', error);
      onError?.(`Failed to share: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render custom message modal
  const renderCustomMessageModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCustomModalVisible}
        onRequestClose={() => setIsCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>
              Share to {selectedPlatform === 'instagram' ? 'Instagram' : 'TikTok'}
            </Text>
            
            <TextInput
              style={[styles.messageInput, isDark && styles.messageInputDark]}
              placeholder="Add a message..."
              placeholderTextColor={isDark ? '#999999' : '#666666'}
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              numberOfLines={4}
            />
            
            <Text style={[styles.noteText, isDark && styles.textDark]}>
              The link will be automatically added to your message.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsCustomModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.shareButton]}
                onPress={handleCustomPlatformShare}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.shareButtonText}>Share</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // If the content is not public, show a message
  if (!isPublic) {
    return (
      <View style={styles.container}>
        <View style={styles.privateContainer}>
          <Ionicons name="lock-closed" size={24} color="#FF9500" />
          <Text style={styles.privateText}>
            This content cannot be shared because it is private.
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDark && styles.textDark]}>Share Audio</Text>
      
      <View style={styles.platformsContainer}>
        {platforms.map((platform) => (
          <TouchableOpacity
            key={platform.id}
            style={styles.platformButton}
            onPress={() => shareContent(platform.id)}
            disabled={isLoading}
          >
            <View style={[styles.iconContainer, { backgroundColor: platform.color }]}>
              <Ionicons name={platform.icon as any} size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.platformName, isDark && styles.textDark]}>
              {platform.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.nativeShareButton}
        onPress={openNativeShareDialog}
        disabled={isLoading}
      >
        <Ionicons name="share-outline" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
        <Text style={[styles.nativeShareText, isDark && styles.textDark]}>
          Share via...
        </Text>
      </TouchableOpacity>
      
      {renderCustomMessageModal()}
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000',
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformButton: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
  },
  nativeShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    marginTop: 8,
  },
  nativeShareText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#333333',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalContentDark: {
    backgroundColor: '#1C1C1E',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000',
  },
  messageInput: {
    height: 100,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: '#000000',
    backgroundColor: '#F5F5F5',
  },
  messageInputDark: {
    borderColor: '#333333',
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
  },
  noteText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  shareButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  privateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: 16,
    borderRadius: 8,
  },
  privateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  textDark: {
    color: '#FFFFFF',
  },
});

export default SocialMediaShare; 