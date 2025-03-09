// services/SubscriptionService.ts
import { 
  doc,
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  increment,
  Timestamp,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../src/lib/firebase'; // Import from central firebase file
import { v4 as uuidv4 } from 'uuid';

// Subscription tier types
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'vip';

// Subscription interface
export interface Subscription {
  id: string;
  subscriberId: string; // Fan user ID
  athleteId: string; // Athlete user ID
  tier: SubscriptionTier;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  paymentMethod?: string;
  paymentId?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

// Subscription transaction interface
export interface SubscriptionTransaction {
  id: string;
  subscriptionId: string;
  subscriberId: string;
  athleteId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  paymentId: string;
  timestamp: string;
}

class SubscriptionService {
  // Subscribe a user to an athlete
  async subscribe(
    subscriberId: string,
    athleteId: string,
    tier: SubscriptionTier,
    paymentMethod: string,
    paymentId: string,
    price: number,
    autoRenew: boolean = true
  ): Promise<Subscription | null> {
    try {
      const subscriptionId = uuidv4();
      const now = new Date();
      const startDate = now.toISOString();
      
      // Calculate end date (1 month from now)
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
      
      // Create subscription object
      const subscription: Subscription = {
        id: subscriptionId,
        subscriberId,
        athleteId,
        tier,
        startDate,
        endDate: endDate.toISOString(),
        isActive: true,
        autoRenew,
        paymentMethod,
        paymentId,
        price,
        createdAt: startDate,
        updatedAt: startDate
      };
      
      // Save subscription to Firestore
      await setDoc(doc(db, 'subscriptions', subscriptionId), subscription);
      
      // Create transaction record
      const transaction: SubscriptionTransaction = {
        id: uuidv4(),
        subscriptionId,
        subscriberId,
        athleteId, 
        amount: price,
        currency: 'USD',
        status: 'completed',
        paymentMethod,
        paymentId,
        timestamp: startDate
      };
      
      await setDoc(doc(db, 'subscriptionTransactions', transaction.id), transaction);
      
      // Update athlete's subscriber count
        await updateDoc(doc(db, 'profiles', athleteId), {
          subscriberCount: increment(1)
      });
      
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      return null;
    }
  }
  
  // Cancel a subscription
  async cancelSubscription(subscriptionId: string, subscriberId: string): Promise<boolean> {
    try {
      // Get subscription to verify ownership
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      if (!subscriptionDoc.exists()) {
        return false;
      }
      
      const subscription = subscriptionDoc.data() as Subscription;
      
      // Verify ownership
      if (subscription.subscriberId !== subscriberId) {
        return false;
      }
      
       // Update subscription
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        autoRenew: false,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }
  
  // Get a user's active subscriptions
  async getUserSubscriptions(subscriberId: string): Promise<Subscription[]> {
    try {
      const subscriptionsRef = collection(db, 'subscriptions');
      const q = query(
        subscriptionsRef, 
        where('subscriberId', '==', subscriberId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as Subscription);
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return [];
    }
  }
  
  // Get an athlete's subscribers
  async getAthleteSubscribers(athleteId: string): Promise<Subscription[]> {
    try {
      if (!db) {
        console.error('Firestore DB not initialized');
        return [];
      }
      
      const subscriptionsRef = collection(db, 'subscriptions');
      const q = query(
        subscriptionsRef, 
        where('athleteId', '==', athleteId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as Subscription);
    } catch (error) {
      console.error('Error getting athlete subscribers:', error);
      return [];
    }
  }
  
  // Check if a user is subscribed to an athlete
  async isSubscribed(subscriberId: string, athleteId: string): Promise<{isSubscribed: boolean, tier?: SubscriptionTier}> {
    try {
      const subscriptionsRef = collection(db, 'subscriptions');
      const q = query(
        subscriptionsRef, 
        where('subscriberId', '==', subscriberId),
        where('athleteId', '==', athleteId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { isSubscribed: false };
      }
      
      const subscription = querySnapshot.docs[0].data() as Subscription;
      return { 
        isSubscribed: true,
        tier: subscription.tier
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { isSubscribed: false };
    }
  }
  
  // Get subscription transaction history
  async getTransactionHistory(userId: string, isAthlete: boolean = false): Promise<SubscriptionTransaction[]> {
    try {
      const transactionsRef = collection(db, 'subscriptionTransactions');
      const fieldName = isAthlete ? 'athleteId' : 'subscriberId';
      
      const q = query(
        transactionsRef, 
        where(fieldName, '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as SubscriptionTransaction);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }
  
  // Process subscription renewals (would be called by a scheduled function)
  async processRenewals(): Promise<number> {
    try {
      const now = new Date();
      const subscriptionsRef = collection(db, 'subscriptions');
      
      // Get subscriptions that are active, set to auto-renew, and have an end date before now
      const q = query(
        subscriptionsRef, 
        where('isActive', '==', true),
        where('autoRenew', '==', true),
        where('endDate', '<=', now.toISOString())
      );
      
      const querySnapshot = await getDocs(q);
      let renewalCount = 0;
      
      for (const doc of querySnapshot.docs) {
        const subscription = doc.data() as Subscription;
        
        // Calculate new end date (1 month from current end date)
        const currentEndDate = new Date(subscription.endDate);
        currentEndDate.setMonth(currentEndDate.getMonth() + 1);
        
        // Update subscription
        await updateDoc(doc.ref, {
          endDate: currentEndDate.toISOString(),
          updatedAt: now.toISOString()
        });
        
        // Create transaction record
        const transaction: SubscriptionTransaction = {
          id: uuidv4(),
          subscriptionId: subscription.id,
          subscriberId: subscription.subscriberId,
          athleteId: subscription.athleteId,
          amount: subscription.price,
          currency: 'USD',
          status: 'completed',
          paymentMethod: subscription.paymentMethod || 'unknown',
          paymentId: uuidv4(), // In a real system, this would come from payment processor
          timestamp: now.toISOString()
        };
        
        await setDoc(doc(db, 'subscriptionTransactions', transaction.id), transaction);
        renewalCount++;
      }
      
      return renewalCount;
    } catch (error) {
      console.error('Error processing renewals:', error);
      return 0;
    }
  }
}

export default new SubscriptionService();
