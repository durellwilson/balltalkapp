/**
 * Mock implementation of VerificationService for testing
 * This temporarily replaces the actual service to make the verification feature testable
 */

class MockVerificationService {
  // Store verification requests in memory (for demo purposes only)
  private verificationRequests: Map<string, any> = new Map();
  
  // Store user verification statuses
  private userVerificationStatus: Map<string, {
    isVerified: boolean;
    status: 'none' | 'pending' | 'approved' | 'rejected';
  }> = new Map();
  
  /**
   * Submit verification request
   */
  async submitVerificationRequest(
    userId: string,
    leagueAffiliation: string,
    teamAffiliation: string,
    documents: Blob[]
  ): Promise<boolean> {
    console.log('Submitting verification request for:', userId);
    console.log('League:', leagueAffiliation);
    console.log('Team:', teamAffiliation);
    console.log('Documents:', documents.length);
    
    try {
      // In a real implementation, this would upload the documents to storage
      // and create a verification record in the database
      
      // Create verification request object
      const verificationRequest = {
        userId,
        leagueAffiliation,
        teamAffiliation,
        documentCount: documents.length,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };
      
      // Store in our mock database
      this.verificationRequests.set(userId, verificationRequest);
      
      // Update user's verification status
      this.userVerificationStatus.set(userId, {
        isVerified: false,
        status: 'pending'
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting verification request:', error);
      return false;
    }
  }
  
  /**
   * Get user verification status
   */
  async getUserVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    status: 'none' | 'pending' | 'approved' | 'rejected';
    lastRequest?: any;
  }> {
    console.log('Getting verification status for:', userId);
    
    // Check if we have a status for this user
    if (this.userVerificationStatus.has(userId)) {
      const status = this.userVerificationStatus.get(userId)!;
      const lastRequest = this.verificationRequests.get(userId);
      
      return {
        ...status,
        lastRequest
      };
    }
    
    // Default status if none exists
    return {
      isVerified: false,
      status: 'none'
    };
  }
  
  /**
   * For testing: set a user's verification status directly
   */
  setUserVerificationStatus(
    userId: string, 
    status: 'none' | 'pending' | 'approved' | 'rejected',
    isVerified: boolean = status === 'approved'
  ): void {
    this.userVerificationStatus.set(userId, { isVerified, status });
  }
  
  /**
   * For testing: get all verification requests
   */
  getAllVerificationRequests(): any[] {
    return Array.from(this.verificationRequests.values());
  }
}

// Export singleton instance
export default new MockVerificationService();
