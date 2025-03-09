import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Platform,
  Switch
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import { useAppTheme } from '../../components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MessageService from '../../services/MessageService';

// Placeholder for real payment processing
const processPayment = async (
  amount: number, 
  currency: string = 'USD',
  method: string = 'card'
): Promise<{success: boolean, paymentId: string}> => {
  // In a real app, this would integrate with a payment processor like Stripe
  // For this demo, we'll simulate a payment
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
      });
    }, 2000);
  });
};

const SubscriptionScreen = () => {
  const params = useLocalSearchParams<{ 
    groupId: string;
    price: string;
    period: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const groupId = params.groupId;
  const price = parseFloat(params.price || '4.99');
  const period = params.period || 'monthly';
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [autoRenew, setAutoRenew] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Card details (in a real app, use a secure payment form)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  // Load group info
  useEffect(() => {
    const loadGroupInfo = async () => {
      if (!groupId) {
        router.back();
        return;
      }
      
      setLoading(true);
      
      try {
        // In a real app, fetch detailed group info
        // For now, we'll create placeholder data
        setGroupInfo({
          id: groupId,
          name: 'Premium Fan Group',
          description: 'Exclusive content and interactions',
          hostName: 'Athlete Name',
          memberCount: 32,
          price,
          period
        });
      } catch (error) {
        console.error('[SubscriptionScreen] Error loading group info:', error);
        Alert.alert('Error', 'Failed to load group information');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    
    loadGroupInfo();
  }, [groupId]);
  
  // Format credit card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Format card expiry date (MM/YY)
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };
  
  // Process subscription
  const handleSubscribe = async () => {
    if (!user || !groupId || !groupInfo) return;
    
    // Basic validation (in a real app, use a proper validation library)
    if (paymentMethod === 'card') {
      if (!cardNumber.trim() || cardNumber.length < 16) {
        Alert.alert('Invalid Card', 'Please enter a valid card number');
        return;
      }
      
      if (!cardExpiry.trim() || cardExpiry.length < 5) {
        Alert.alert('Invalid Expiry', 'Please enter a valid expiry date (MM/YY)');
        return;
      }
      
      if (!cardCvc.trim() || cardCvc.length < 3) {
        Alert.alert('Invalid CVC', 'Please enter a valid security code');
        return;
      }
    }
    
    setProcessing(true);
    
    try {
      // Process payment (simulate)
      const paymentResult = await processPayment(price, 'USD', paymentMethod);
      
      if (!paymentResult.success) {
        Alert.alert('Payment Failed', 'Your payment could not be processed. Please try again.');
        setProcessing(false);
        return;
      }
      
      // Join the group
      const messageService = new MessageService();
      const joined = await messageService.joinMonetizedFanGroup(
        user.uid,
        groupId,
        {
          paymentId: paymentResult.paymentId,
          amount: price,
          currency: 'USD',
          paymentMethod
        }
      );
      
      if (joined) {
        Alert.alert(
          'Subscription Successful', 
          `Welcome to ${groupInfo.name}! You now have access to this premium group.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to the conversation
                router.replace(`/chat/${groupId}`);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Payment was successful but we could not add you to the group. Please contact support.'
        );
      }
    } catch (error) {
      console.error('[SubscriptionScreen] Error processing subscription:', error);
      Alert.alert('Subscription Error', 'An error occurred. Please try again later.');
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading || !groupInfo) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading group information...</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: theme.cardBackground, 
          paddingTop: insets.top 
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.text }]}>Subscribe</Text>
        
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Group Info */}
        <View style={[styles.groupInfoContainer, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.groupIcon}>
            <Ionicons name="people" size={32} color={theme.tint} />
          </View>
          
          <Text style={[styles.groupName, { color: theme.text }]}>{groupInfo.name}</Text>
          <Text style={[styles.groupHost, { color: theme.textSecondary }]}>Hosted by {groupInfo.hostName}</Text>
          <Text style={[styles.groupDescription, { color: theme.textSecondary }]}>{groupInfo.description}</Text>
          
          <View style={styles.memberInfo}>
            <Ionicons name="person" size={16} color={theme.textSecondary} />
            <Text style={[styles.memberCount, { color: theme.textSecondary }]}>{groupInfo.memberCount} members</Text>
          </View>
        </View>
        
        {/* Subscription Details */}
        <View style={[styles.subscriptionContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Subscription Details</Text>
          
          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: theme.textSecondary }]}>Price</Text>
            <Text style={[styles.pricingValue, { color: theme.text }]}>
              ${price.toFixed(2)} / {period}
            </Text>
          </View>
          
          <View style={styles.recurringRow}>
            <View>
              <Text style={[styles.recurringLabel, { color: theme.text }]}>Auto-renew subscription</Text>
              <Text style={[styles.recurringDescription, { color: theme.textSecondary }]}>
                Renews automatically at the end of each {period} billing period
              </Text>
            </View>
            
            <Switch
              value={autoRenew}
              onValueChange={setAutoRenew}
              trackColor={{ false: '#767577', true: theme.tint + '70' }}
              thumbColor={autoRenew ? theme.tint : '#f4f3f4'}
            />
          </View>
        </View>
        
        {/* Payment Method */}
        <View style={[styles.paymentContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment Method</Text>
          
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'card' && [styles.selectedPayment, { borderColor: theme.tint }]
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons 
                name="card" 
                size={24} 
                color={paymentMethod === 'card' ? theme.tint : theme.textSecondary} 
              />
              <Text 
                style={[
                  styles.paymentMethodText,
                  { color: paymentMethod === 'card' ? theme.tint : theme.text }
                ]}
              >
                Credit Card
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'apple' && [styles.selectedPayment, { borderColor: theme.tint }]
              ]}
              onPress={() => setPaymentMethod('apple')}
            >
              <Ionicons 
                name="logo-apple" 
                size={24} 
                color={paymentMethod === 'apple' ? theme.tint : theme.textSecondary} 
              />
              <Text 
                style={[
                  styles.paymentMethodText,
                  { color: paymentMethod === 'apple' ? theme.tint : theme.text }
                ]}
              >
                Apple Pay
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Card Details */}
          {paymentMethod === 'card' && (
            <View style={styles.cardDetailsContainer}>
              <TextInput
                style={[styles.cardInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="Card Number"
                placeholderTextColor={theme.textSecondary}
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="number-pad"
                maxLength={19} // 16 digits + 3 spaces
              />
              
              <View style={styles.cardRow}>
                <TextInput
                  style={[styles.cardInputHalf, { color: theme.text, borderColor: theme.border }]}
                  placeholder="MM/YY"
                  placeholderTextColor={theme.textSecondary}
                  value={cardExpiry}
                  onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                  keyboardType="number-pad"
                  maxLength={5} // MM/YY
                />
                
                <TextInput
                  style={[styles.cardInputHalf, { color: theme.text, borderColor: theme.border }]}
                  placeholder="CVC"
                  placeholderTextColor={theme.textSecondary}
                  value={cardCvc}
                  onChangeText={setCardCvc}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          )}
          
          {/* Apply Pay */}
          {paymentMethod === 'apple' && Platform.OS === 'ios' && (
            <View style={styles.applePayContainer}>
              <Text style={[styles.applePayText, { color: theme.textSecondary }]}>
                You'll be prompted to complete payment with Apple Pay when you subscribe.
              </Text>
            </View>
          )}
        </View>
        
        {/* Subscribe Button */}
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            { backgroundColor: theme.tint, opacity: processing ? 0.7 : 1 }
          ]}
          onPress={handleSubscribe}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.subscribeButtonText}>
                Subscribe ${price.toFixed(2)} / {period}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.termsText, { color: theme.textSecondary }]}>
          By subscribing, you agree to our Terms of Service and Privacy Policy.
          {autoRenew ? ' Your subscription will automatically renew until canceled.' : ''}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  groupInfoContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  groupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupHost: {
    fontSize: 16,
    marginBottom: 12,
  },
  groupDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 14,
    marginLeft: 4,
  },
  subscriptionContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pricingLabel: {
    fontSize: 16,
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  recurringLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  recurringDescription: {
    fontSize: 13,
    maxWidth: '80%',
  },
  paymentContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 12,
  },
  selectedPayment: {
    borderWidth: 2,
  },
  paymentMethodText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  cardDetailsContainer: {
    marginBottom: 16,
  },
  cardInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInputHalf: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    width: '48%',
  },
  applePayContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  applePayText: {
    fontSize: 14,
    textAlign: 'center',
  },
  subscribeButton: {
    height: 54,
    margin: 16,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  }
});

export default SubscriptionScreen; 