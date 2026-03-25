const { firestore } = require('../config/firebase');

/**
 * Project Model
 * Represents a project in Firestore
 */
class Project {
  constructor({
    id = null,
    userId,
    name,
    description,
    githubLink = null,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    aiScore = null,
    aiFeedback = null,
    aiSuggestions = [],
    aiStrengths = [],
    aiAnalysisTimestamp = null,
    aiModel = null,
    isMockAnalysis = false
  }) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.description = description;
    this.githubLink = githubLink;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.aiScore = aiScore;
    this.aiFeedback = aiFeedback;
    this.aiSuggestions = aiSuggestions;
    this.aiStrengths = aiStrengths;
    this.aiAnalysisTimestamp = aiAnalysisTimestamp;
    this.aiModel = aiModel;
    this.isMockAnalysis = isMockAnalysis;
  }

  /**
   * Convert to plain JavaScript object
   */
  toObject() {
    const obj = {
      userId: this.userId,
      name: this.name,
      description: this.description,
      githubLink: this.githubLink,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      aiScore: this.aiScore,
      aiFeedback: this.aiFeedback,
      aiSuggestions: this.aiSuggestions,
      aiStrengths: this.aiStrengths,
      aiAnalysisTimestamp: this.aiAnalysisTimestamp,
      aiModel: this.aiModel,
      isMockAnalysis: this.isMockAnalysis
    };
    
    // Always include id if it's defined (even if null or empty string)
    // This ensures the frontend can access the document ID
    if (this.id !== undefined) {
      obj.id = this.id;
    }
    
    return obj;
  }

  /**
   * Create a new project in Firestore
   */
  async save() {
    try {
      if (!firestore) {
        console.warn('Firestore not initialized, assigning mock ID');
        this.id = 'mock-' + Date.now();
        return this;
      }
      const docRef = await firestore.collection('projects').add(this.toObject());
      this.id = docRef.id;
      return this;
    } catch (error) {
      // If it's an authentication error, assign mock ID for development
      if (error.code === 16 || error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid authentication')) {
        console.warn('Firestore authentication failed, assigning mock ID for development');
        this.id = 'mock-' + Date.now();
        return this;
      }
      // For other errors, log as error and throw
      console.error('Error saving project:', error);
      throw new Error('Failed to save project');
    }
  }

  /**
   * Update an existing project
   */
  async update(updateData) {
    try {
      if (!this.id) throw new Error('Project ID is required for update');
      
      if (!firestore) {
        console.warn('Firestore not initialized, skipping update for development');
        // Update current instance locally
        Object.assign(this, updateData);
        return this;
      }
      
      const projectRef = firestore.collection('projects').doc(this.id);
      await projectRef.update({
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      
      // Update current instance
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      // If it's an authentication error, update locally for development
      if (error.code === 16 || error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid authentication')) {
        console.warn('Firestore authentication failed, updating locally for development');
        Object.assign(this, updateData);
        return this;
      }
      // For other errors, log as error and throw
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  }

  /**
   * Find project by ID
   */
  static async findById(projectId) {
    try {
      if (!firestore) {
        console.warn('Firestore not initialized, returning null');
        return null;
      }
      const projectDoc = await firestore.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) return null;
      
      const projectData = projectDoc.data();
      return new Project({
        id: projectDoc.id,
        ...projectData
      });
    } catch (error) {
      // If it's an authentication error, return null for development
      if (error.code === 16 || error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid authentication')) {
        console.warn('Firestore authentication failed, returning null for development');
        return null;
      }
      // For other errors, log as error and throw
      console.error('Error finding project:', error);
      throw new Error('Failed to find project');
    }
  }

  /**
   * Get all projects for a user
   */
  static async findByUser(userId, limit = 10) {
    try {
      // Check if firestore is available
      if (!firestore) {
        console.warn('Firestore not initialized, returning empty projects');
        return [];
      }
      // First try without limit to avoid index requirement
      const snapshot = await firestore.collection('projects')
        .where('userId', '==', userId)
        .get();
      
      if (snapshot.empty) return [];
      
      // Convert to Project objects
      const projects = snapshot.docs.map(doc => new Project({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt descending
      projects.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
      
      // Apply limit manually
      return projects.slice(0, limit);
    } catch (error) {
      // If it's an authentication error, log as warning and return empty array for development
      if (error.code === 16 || error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid authentication')) {
        console.warn('Firestore authentication failed, returning empty projects for development');
        return [];
      }
      // For other errors, log as error and throw
      console.error('Error finding user projects:', error);
      throw new Error('Failed to get user projects: ' + error.message);
    }
  }

  /**
   * Delete a project
   */
  static async delete(projectId) {
    try {
      if (!firestore) {
        console.warn('Firestore not initialized, pretending deletion succeeded for development');
        return true;
      }
      
      await firestore.collection('projects').doc(projectId).delete();
      return true;
    } catch (error) {
      // If it's an authentication error, pretend deletion succeeded for development
      if (error.code === 16 || error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid authentication')) {
        console.warn('Firestore authentication failed, pretending deletion succeeded for development');
        return true;
      }
      // For other errors, log as error and throw
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }
}

module.exports = Project;