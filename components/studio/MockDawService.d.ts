// Type declarations for MockDawService

import { Project, Track } from './StudioTypes';

declare module './MockDawService' {
  export interface DawService {
    // Original methods from DawService
    getProjects(userId: string): Promise<Project[]>;
    
    // Mock methods
    saveProject(userId: string, project: Project): Promise<Project>;
    saveRecording(
      userId: string,
      uri: string,
      duration: number,
      projectId: string,
      trackId: string
    ): Promise<any>;
    getUserProjects(userId: string): Promise<Project[]>;
  }

  const MockDawService: DawService;
  export default MockDawService;
}
