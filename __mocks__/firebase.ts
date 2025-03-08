// Mock Firebase for testing
const firebaseMock = {
  // Auth mock
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  },
  
  // Firestore mock
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(() => ({
          exists: true,
          data: () => ({
            id: 'test-song-id',
            artistId: 'test-artist-id',
            title: 'Test Song',
            genre: 'Pop',
            fileUrl: 'test-url',
            duration: 0,
            visibility: 'public',
            createdAt: '2024-03-06T00:00:00.000Z',
            updatedAt: '2024-03-06T00:00:00.000Z'
          })
        })),
        update: jest.fn(),
        delete: jest.fn()
      })),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          get: jest.fn(() => ({
            docs: [{
              data: () => ({
                id: 'test-song-id',
                artistId: 'test-artist-id',
                title: 'Test Song',
                genre: 'Pop'
              })
            }]
          }))
        }))
      }))
    }))
  },
  
  // Storage mock
  storage: {
    ref: jest.fn(() => ({
      putFile: jest.fn(() => Promise.resolve()),
      getDownloadURL: jest.fn(() => Promise.resolve('test-url')),
      delete: jest.fn(() => Promise.resolve())
    }))
  }
};

// Firebase v9 modular SDK mocks
const firestoreMock = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() => ({
    exists: () => true,
    data: () => ({
      id: 'test-song-id',
      artistId: 'test-artist-id',
      title: 'Test Song',
      genre: 'Pop',
      fileUrl: 'test-url',
      duration: 0,
      visibility: 'public',
      createdAt: '2024-03-06T00:00:00.000Z',
      updatedAt: '2024-03-06T00:00:00.000Z'
    })
  })),
  getDocs: jest.fn(() => ({
    docs: [{
      data: () => ({
        id: 'test-song-id',
        artistId: 'test-artist-id',
        title: 'Test Song',
        genre: 'Pop'
      })
    }]
  })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  increment: jest.fn(() => 1)
};

const storageMock = {
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('test-url')),
  deleteObject: jest.fn(() => Promise.resolve())
};

export { firebaseMock, firestoreMock, storageMock }; 