import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { recordError, ErrorCategory } from '../../utils/errorReporting';
import LoadingIndicator from '../fallbacks/LoadingIndicator';
import EmptyState from '../fallbacks/EmptyState';

interface WithRetryProps<T> {
  load: () => Promise<T>;
  renderContent: (data: T) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: Error, retry: () => void) => React.ReactNode;
  errorMessage?: string;
  loadingMessage?: string;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyIcon?: string;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
  dependencies?: any[];
  context?: string;
}

/**
 * withRetry Higher-Order Component
 * 
 * Wraps a component with loading, error handling, and retry functionality.
 * Provides standardized loading and error states.
 * 
 * @example
 * const UserProfileWithRetry = withRetry(UserProfile);
 * 
 * // Then use it like:
 * <UserProfileWithRetry
 *   load={() => fetchUserProfile(userId)}
 *   renderContent={(data) => <UserProfile data={data} />}
 *   errorMessage="Couldn't load profile"
 * />
 */
export function withRetry<P, T = any>(
  Component: React.ComponentType<P>
): React.FC<P & WithRetryProps<T>> {
  return (props: P & WithRetryProps<T>) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isEmpty, setIsEmpty] = useState(false);
    
    const { 
      load, 
      renderContent, 
      renderLoading, 
      renderError,
      errorMessage = 'Failed to load data. Please try again.',
      loadingMessage = 'Loading...',
      emptyMessage = 'No data available.',
      emptyTitle = 'Nothing to show',
      emptyIcon = 'alert-circle-outline',
      onError,
      onSuccess,
      dependencies = [],
      context = 'data-loading',
      ...restProps 
    } = props;
    
    const loadData = useCallback(async () => {
      setLoading(true);
      setError(null);
      setIsEmpty(false);
      
      try {
        const result = await load();
        
        // Check if result is empty (null, undefined, empty array, or empty object)
        const isEmptyResult = 
          result === null || 
          result === undefined || 
          (Array.isArray(result) && result.length === 0) ||
          (typeof result === 'object' && Object.keys(result).length === 0);
        
        setData(result);
        setIsEmpty(isEmptyResult);
        
        if (onSuccess) {
          onSuccess(result);
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        
        // Record the error
        recordError(error, context, ErrorCategory.UNKNOWN);
        
        if (onError) {
          onError(error);
        }
      } finally {
        setLoading(false);
      }
    }, [load, context, onError, onSuccess, ...dependencies]);
    
    useEffect(() => {
      loadData();
    }, [loadData, retryCount]);
    
    const handleRetry = useCallback(() => {
      setRetryCount(prev => prev + 1);
    }, []);
    
    // Show loading state
    if (loading) {
      if (renderLoading) {
        return renderLoading();
      }
      
      return (
        <View style={styles.container}>
          <LoadingIndicator 
            variant="fullscreen" 
            message={loadingMessage} 
            size="large" 
          />
        </View>
      );
    }
    
    // Show error state
    if (error) {
      if (renderError) {
        return renderError(error, handleRetry);
      }
      
      return (
        <View style={styles.container}>
          <EmptyState
            icon="alert-circle"
            title="Something went wrong"
            message={errorMessage}
            actionLabel="Try Again"
            onAction={handleRetry}
          />
        </View>
      );
    }
    
    // Show empty state
    if (isEmpty) {
      return (
        <View style={styles.container}>
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            message={emptyMessage}
          />
        </View>
      );
    }
    
    // Show content
    return renderContent(data as T);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default withRetry; 