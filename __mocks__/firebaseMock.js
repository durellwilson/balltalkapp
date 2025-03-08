// Mock Firebase modules for Jest tests
const firebaseMock = {
  // Firestore mocks
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(() => ({
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          id: 'test-song-id',
          artistId: 'test-artist-id',
          title: 'Test Song',
          genre: 'Pop',
          fileUrl: 'test-url',
          duration: 0,
          visibility: 'public',
          createdAt: '2024-03-06T00:00:00.000Z',
          updatedAt: '2024-03-06T00:00:00.000Z'
        }))
      })),
      update: jest.fn(),
      delete: jest.fn()
    })),
    where: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        get: jest.fn(() => ({
          docs: [{
            data: jest.fn(() => ({
              id: 'test-song-id',
              artistId: 'test-artist-id',
              title: 'Test Song',
              genre: 'Pop'
            }))
          }]
        }))
      }))
    }))
  })),
  doc: jest.fn(() => ({
    set: jest.fn(),
    get: jest.fn(() => ({
      exists: jest.fn(() => true),
      data: jest.fn(() => ({
        id: 'test-song-id',
        artistId: 'test-artist-id',
        title: 'Test Song',
        genre: 'Pop'
      }))
    })),
    update: jest.fn(),
    delete: jest.fn()
  })),
  getDoc: jest.fn(() => ({
    exists: jest.fn(() => true),
    data: jest.fn(() => ({
      id: 'test-song-id',
      artistId: 'test-artist-id',
      title: 'Test Song',
      genre: 'Pop'
    }))
  })),
  getDocs: jest.fn(() => ({
    docs: [{
      data: jest.fn(() => ({
        id: 'test-song-id',
        artistId: 'test-artist-id',
        title: 'Test Song',
        genre: 'Pop'
      }))
    }]
  })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  increment: jest.fn(() => 1),

  // Storage mocks
  ref: jest.fn(() => ({
    putFile: jest.fn(() => Promise.resolve()),
    getDownloadURL: jest.fn(() => Promise.resolve('test-url')),
    delete: jest.fn(() => Promise.resolve())
  })),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('test-url')),
  deleteObject: jest.fn(() => Promise.resolve())
};

module.exports = firebaseMock; 