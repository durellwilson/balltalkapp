import { Project } from './StudioTypes';
import { v4 as uuidv4 } from 'uuid';

class MockDawService {
  // Get projects for a user
  async getProjects(userId: string): Promise<Project[]> {
    console.log('Mock: Getting projects for user', userId);
    return this.generateMockProjects(userId);
  }
  
  // Get projects for a user (static version)
  static async getUserProjects(userId: string, limitCount: number = 10): Promise<Project[]> {
    console.log('Mock: Getting user projects (static method)', userId, limitCount);
    const service = new MockDawService();
    return service.generateMockProjects(userId, limitCount);
  }
  
  // Save a project
  async saveProject(userId: string, project: Project): Promise<Project> {
    console.log('Mock: Saving project', project.name);
    return {
      ...project,
      updatedAt: new Date().toISOString()
    };
  }
  
  // Save a recording
  async saveRecording(
    userId: string,
    uri: string,
    duration: number,
    projectId: string,
    trackId: string
  ): Promise<any> {
    console.log('Mock: Saving recording', uri);
    return {
      id: uuidv4(),
      url: uri,
      duration,
      createdAt: new Date().toISOString(),
      projectId,
      trackId,
      userId
    };
  }
  
  // Generate mock projects for testing
  private generateMockProjects(userId: string, limit: number = 5): Project[] {
    const projects: Project[] = [];
    const now = new Date().toISOString();
    
    for (let i = 0; i < limit; i++) {
      projects.push({
        id: uuidv4(),
        name: `Test Project ${i + 1}`,
        createdAt: now,
        updatedAt: now,
        userId: userId,
        tracks: [
          {
            id: uuidv4(),
            name: 'Beat',
            isPlaying: false,
            isRecording: false,
            volume: 1.0,
            trackNumber: 1,
            recordingIds: []
          },
          {
            id: uuidv4(),
            name: 'Vocals',
            isPlaying: false,
            isRecording: false,
            volume: 1.0,
            trackNumber: 2,
            recordingIds: []
          }
        ],
        tempo: 120,
        isPublic: false,
        description: `Mock project ${i + 1}`,
        tags: ['test', 'mock']
      });
    }
    
    return projects;
  }
}

// Export the class directly
export { MockDawService };

// Also export as default for backward compatibility
export default MockDawService; 