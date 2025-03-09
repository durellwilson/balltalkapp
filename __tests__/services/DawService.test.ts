import DawService from '../../services/DawService';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

// Mock the PROJECTS_COLLECTION constant
jest.mock('../../constants/Collections', () => ({
  PROJECTS_COLLECTION: 'projects',
}));

describe('DawService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProjects', () => {
    it('should fetch user projects with the correct query parameters', async () => {
      // Mock data
      const userId = 'test-user-id';
      const limitCount = 5;
      const mockProjects = [
        {
          id: 'project1',
          name: 'Test Project 1',
          userId,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-02',
          tracks: [],
          tempo: 120,
        },
        {
          id: 'project2',
          name: 'Test Project 2',
          userId,
          createdAt: '2023-01-03',
          updatedAt: '2023-01-04',
          tracks: [],
          tempo: 130,
        },
      ];

      // Mock Firestore functions
      const mockFirestore = {};
      const mockCollection = {};
      const mockQuery = {};
      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          mockProjects.forEach((project) => {
            callback({
              id: project.id,
              data: () => ({ ...project }),
            });
          });
        }),
      };

      const { getFirestore, collection, where, orderBy, limit, query, getDocs } = require('firebase/firestore');

      getFirestore.mockReturnValue(mockFirestore);
      collection.mockReturnValue(mockCollection);
      where.mockReturnValue('where-clause');
      orderBy.mockImplementation((field) => `orderBy-${field}-clause`);
      limit.mockReturnValue('limit-clause');
      query.mockReturnValue(mockQuery);
      getDocs.mockResolvedValue(mockQuerySnapshot);

      // Call the function
      const result = await DawService.getUserProjects(userId, limitCount);

      // Verify the query was constructed correctly
      expect(getFirestore).toHaveBeenCalled();
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'projects');
      expect(where).toHaveBeenCalledWith('userId', '==', userId);
      expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
      expect(orderBy).toHaveBeenCalledWith('__name__', 'asc');
      expect(limit).toHaveBeenCalledWith(limitCount);
      expect(query).toHaveBeenCalledWith(
        mockCollection,
        'where-clause',
        'orderBy-updatedAt-clause',
        'orderBy-__name__-clause',
        'limit-clause'
      );
      expect(getDocs).toHaveBeenCalledWith(mockQuery);

      // Verify the result
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('project1');
      expect(result[1].id).toBe('project2');
    });

    it('should throw an error if userId is not provided', async () => {
      await expect(DawService.getUserProjects('')).rejects.toThrow('User ID is required');
    });

    it('should handle errors from Firestore', async () => {
      // Mock data
      const userId = 'test-user-id';
      const mockError = new Error('Firestore error');

      // Mock Firestore functions
      const { getFirestore, collection, where, orderBy, limit, query, getDocs } = require('firebase/firestore');

      getFirestore.mockReturnValue({});
      collection.mockReturnValue({});
      where.mockReturnValue({});
      orderBy.mockReturnValue({});
      limit.mockReturnValue({});
      query.mockReturnValue({});
      getDocs.mockRejectedValue(mockError);

      // Call the function and expect it to throw
      await expect(DawService.getUserProjects(userId)).rejects.toThrow(
        'Failed to get user projects: Firestore error'
      );
    });
  });
}); 