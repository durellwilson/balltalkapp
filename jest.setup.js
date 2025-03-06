// Add any global setup for Jest tests here
import '@testing-library/jest-native/extend-expect';

// Import dotenv and load environment variables
import dotenv from 'dotenv';
dotenv.config();


// Mock Expo modules that might cause issues in tests
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-constants', () => ({
  manifest: {
    extra: {
      firebaseApiKey: 'test-api-key',
      firebaseAuthDomain: 'test-auth-domain',
      firebaseProjectId: 'test-project-id',
      firebaseStorageBucket: 'test-storage-bucket',
      firebaseMessagingSenderId: 'test-messaging-sender-id',
      firebaseAppId: 'test-app-id'
    }
  }
}));

// Mock the Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  useSegments: () => [''],
  usePathname: () => '/',
  Link: 'Link',
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }
}));

// Mock the Firebase modules
jest.mock('./src/lib/firebase', () => ({
  db: {},
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  },
  storage: {}
}));

// Mock the Blob API if not available
if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(content, options) {
      this.content = content;
      this.options = options;
      this.type = options?.type || '';
    }
  };
}

// Silence console errors and warnings during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};
