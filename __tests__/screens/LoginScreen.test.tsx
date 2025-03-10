import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../app/auth/LoginScreen';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn()
}));

// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  auth: {
    // Mock auth implementation
  }
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    expect(getByText('Login to BallTalk')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('shows validation error when trying to login without email and password', async () => {
    const { getByText, findByText } = render(<LoginScreen />);
    
    fireEvent.press(getByText('Login'));
    
    const errorMessage = await findByText('Email and password are required');
    expect(errorMessage).toBeTruthy();
    
    // Firebase auth should not be called
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('calls firebase auth when form is filled and submitted', async () => {
    // Mock successful login
    signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'test-user-id' }
    });
    
    const { getByText, getByPlaceholderText, findByText } = render(<LoginScreen />);
    
    // Fill the form
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Login'));
    
    // Check for success message
    const successMessage = await findByText('Login successful!');
    expect(successMessage).toBeTruthy();
    
    // Check firebase auth was called with correct params
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
  });

  it('shows error message when login fails', async () => {
    // Mock failed login
    const mockError = new Error('Invalid email or password');
    signInWithEmailAndPassword.mockRejectedValueOnce(mockError);
    
    const { getByText, getByPlaceholderText, findByText } = render(<LoginScreen />);
    
    // Fill the form
    fireEvent.changeText(getByPlaceholderText('Email'), 'bad@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');
    
    // Submit the form
    fireEvent.press(getByText('Login'));
    
    // Check for error message
    const errorMessage = await findByText('Invalid email or password');
    expect(errorMessage).toBeTruthy();
    
    // Check firebase auth was called
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'bad@example.com',
      'wrongpassword'
    );
  });
}); 