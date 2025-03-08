// Mock the Firebase modules
const mockAuth = {
  currentUser: {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
  },
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
};

const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
  set: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue({
    exists: true,
    data: () => ({ id: 'doc-id', field: 'value' }),
    docs: [
      {
        id: 'doc-id-1',
        data: () => ({ field: 'value-1' }),
      },
      {
        id: 'doc-id-2',
        data: () => ({ field: 'value-2' }),
      },
    ],
  }),
  onSnapshot: jest.fn((callback) => {
    callback({
      docs: [
        {
          id: 'doc-id-1',
          data: () => ({ field: 'value-1' }),
        },
        {
          id: 'doc-id-2',
          data: () => ({ field: 'value-2' }),
        },
      ],
    });
    return jest.fn(); // unsubscribe function
  }),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  startAfter: jest.fn().mockReturnThis(),
  startAt: jest.fn().mockReturnThis(),
  endAt: jest.fn().mockReturnThis(),
  endBefore: jest.fn().mockReturnThis(),
};

const mockStorage = {
  ref: jest.fn().mockReturnThis(),
  child: jest.fn().mockReturnThis(),
  put: jest.fn().mockResolvedValue({
    ref: {
      getDownloadURL: jest.fn().mockResolvedValue('https://example.com/file.mp3'),
    },
    metadata: {
      fullPath: 'files/file.mp3',
    },
  }),
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/file.mp3'),
  delete: jest.fn().mockResolvedValue(undefined),
  listAll: jest.fn().mockResolvedValue({
    items: [
      { name: 'file1.mp3' },
      { name: 'file2.mp3' },
    ],
    prefixes: [
      { name: 'folder1' },
      { name: 'folder2' },
    ],
  }),
  uploadBytesResumable: jest.fn().mockReturnValue({
    on: jest.fn((event, onProgress, onError, onComplete) => {
      // Simulate upload progress
      onProgress({ bytesTransferred: 50, totalBytes: 100 });
      // Simulate upload completion
      onComplete();
      
      return {
        snapshot: {
          ref: {
            getDownloadURL: jest.fn().mockResolvedValue('https://example.com/file.mp3'),
          },
          metadata: {
            fullPath: 'files/file.mp3',
          },
        },
      };
    }),
  }),
};

// Mock Firebase app
jest.mock('firebase/app', () => {
  return {
    __esModule: true,
    default: {
      apps: ['mockApp'],
      initializeApp: jest.fn().mockReturnValue({
        auth: jest.fn().mockReturnValue(mockAuth),
        firestore: jest.fn().mockReturnValue(mockFirestore),
        storage: jest.fn().mockReturnValue(mockStorage),
      }),
    },
    initializeApp: jest.fn().mockReturnValue({
      auth: jest.fn().mockReturnValue(mockAuth),
      firestore: jest.fn().mockReturnValue(mockFirestore),
      storage: jest.fn().mockReturnValue(mockStorage),
    }),
    getApp: jest.fn().mockReturnValue({
      auth: jest.fn().mockReturnValue(mockAuth),
      firestore: jest.fn().mockReturnValue(mockFirestore),
      storage: jest.fn().mockReturnValue(mockStorage),
    }),
  };
});

// Mock Firebase Auth
jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn().mockReturnValue(mockAuth),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: mockAuth.currentUser }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({ user: mockAuth.currentUser }),
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn((auth, callback) => {
      // Simulate auth state change
      callback(mockAuth.currentUser);
      return jest.fn(); // unsubscribe function
    }),
  };
});

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn().mockReturnValue(mockFirestore),
    collection: jest.fn().mockReturnValue(mockFirestore),
    doc: jest.fn().mockReturnValue(mockFirestore),
    getDoc: jest.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({ id: 'doc-id', field: 'value' }),
    }),
    getDocs: jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'doc-id-1',
          data: () => ({ field: 'value-1' }),
        },
        {
          id: 'doc-id-2',
          data: () => ({ field: 'value-2' }),
        },
      ],
    }),
    setDoc: jest.fn().mockResolvedValue(undefined),
    addDoc: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockReturnValue(mockFirestore),
    where: jest.fn().mockReturnValue(mockFirestore),
    orderBy: jest.fn().mockReturnValue(mockFirestore),
    limit: jest.fn().mockReturnValue(mockFirestore),
    onSnapshot: jest.fn().mockReturnValue(jest.fn()),
    Timestamp: {
      now: jest.fn().mockReturnValue({ seconds: 1626825600, nanoseconds: 0 }),
      fromDate: jest.fn().mockImplementation((date) => ({ 
        seconds: Math.floor(date.getTime() / 1000), 
        nanoseconds: 0 
      })),
    },
  };
});

// Mock Firebase Storage
jest.mock('firebase/storage', () => {
  return {
    getStorage: jest.fn().mockReturnValue(mockStorage),
    ref: jest.fn().mockReturnValue(mockStorage),
    uploadBytesResumable: jest.fn().mockReturnValue(mockStorage.uploadBytesResumable()),
    getDownloadURL: jest.fn().mockResolvedValue('https://example.com/file.mp3'),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    listAll: jest.fn().mockResolvedValue(mockStorage.listAll()),
  };
});

export {
  mockAuth,
  mockFirestore,
  mockStorage,
}; 