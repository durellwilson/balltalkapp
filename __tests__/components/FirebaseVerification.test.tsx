import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import FirebaseVerification from '../../components/FirebaseVerification';
import { firebaseDb } from '../../config/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  query: jest.fn()
}));

// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  firebaseDb: {
    // Mock firebaseDb implementation
  }
}));

describe('FirebaseVerification', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders initial loading state correctly', () => {
    const { getByText } = render(<FirebaseVerification />);
    
    expect(getByText('Firebase Verification')).toBeTruthy();
    expect(getByText('Status: Checking...')).toBeTruthy();
    expect(getByText('Checking Firebase connection...')).toBeTruthy();
  });

  it('shows success state when Firestore connection succeeds', async () => {
    // Mock successful Firestore query
    query.mockReturnValue('mock-query');
    getDocs.mockResolvedValue({
      docs: [{ id: 'user1', data: () => ({ name: 'Test User' }) }]
    });

    const { getByText } = render(<FirebaseVerification />);
    
    await waitFor(() => {
      expect(getByText('Status: Connected ✅')).toBeTruthy();
      expect(getByText('Firestore connected successfully. Found 1 users.')).toBeTruthy();
    });

    expect(collection).toHaveBeenCalledWith(firebaseDb, 'users');
    expect(limit).toHaveBeenCalledWith(1);
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledWith('mock-query');
  });

  it('shows error state when Firestore connection fails', async () => {
    // Mock failed Firestore query
    query.mockReturnValue('mock-query');
    getDocs.mockRejectedValue(new Error('Connection failed'));

    const { getByText } = render(<FirebaseVerification />);
    
    await waitFor(() => {
      expect(getByText('Status: Error ❌')).toBeTruthy();
      expect(getByText('Failed to connect to Firestore')).toBeTruthy();
      expect(getByText('Connection failed')).toBeTruthy();
    });

    expect(collection).toHaveBeenCalledWith(firebaseDb, 'users');
    expect(limit).toHaveBeenCalledWith(1);
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledWith('mock-query');
  });
}); 