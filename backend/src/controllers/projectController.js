const Project = require('../models/Project');
const geminiService = require('../services/geminiService');
const { firestore } = require('../config/firebase');

/**
 * Project Controller
 * Handles project-related operations
 */

/**
 * Get all projects for the authenticated user
 */
const getUserProjects = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const projects = await Project.findByUser(req.user.uid);

    return res.status(200).json({
      message: 'Projects retrieved successfully',
      count: projects.length,
      projects: projects.map(p => p.toObject())
    });

  } catch (error) {
    console.error('Get projects error:', error);
    
    return res.status(500).json({
      error: 'Failed to get projects',
      message: 'An error occurred while fetching projects',
      details: error.message
    });
  }
};

/**
 * Create a new project with AI analysis
 */
const createProject = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { name, description, githubLink } = req.body;
    const userId = req.user.uid;

    // Create project
    const project = new Project({
      userId,
      name: name.trim(),
      description: description.trim(),
      githubLink: githubLink?.trim() || null
    });

    // Get AI analysis
    let aiAnalysis = null;
    try {
      aiAnalysis = await geminiService.analyzeProject({
        name: project.name,
        description: project.description,
        githubLink: project.githubLink
      });

      // Add AI analysis to project
      project.aiScore = aiAnalysis.score;
      project.aiFeedback = aiAnalysis.summary;
      project.aiSuggestions = aiAnalysis.suggestions;
      project.aiStrengths = aiAnalysis.strengths;
      project.aiAnalysisTimestamp = aiAnalysis.timestamp;
      project.aiModel = aiAnalysis.model;
      project.isMockAnalysis = aiAnalysis.isMock || false;
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      // Continue without AI analysis
      project.aiScore = null;
      project.aiFeedback = 'AI analysis unavailable';
      project.aiSuggestions = [];
      project.aiStrengths = [];
      project.aiAnalysisTimestamp = null;
      project.isMockAnalysis = true;
    }

    // Save project
    await project.save();

    return res.status(201).json({
      message: 'Project created successfully',
      projectId: project.id,
      project: project.toObject(),
      aiAnalysis: {
        score: project.aiScore,
        summary: project.aiFeedback,
        model: project.aiModel,
        isMock: project.isMockAnalysis
      }
    });

  } catch (error) {
    console.error('Create project error:', error);
    
    return res.status(500).json({
      error: 'Failed to create project',
      message: 'An error occurred while creating project',
      details: error.message
    });
  }
};

/**
 * Get a specific project by ID
 */
const getProjectById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const userId = req.user.uid;

    if (!firestore) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Firestore not initialized'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Project not found'
      });
    }

    // Check if user owns this project
    if (project.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this project'
      });
    }

    return res.status(200).json({
      message: 'Project retrieved successfully',
      project: project.toObject()
    });

  } catch (error) {
    console.error('Get project error:', error);
    
    return res.status(500).json({
      error: 'Failed to get project',
      message: 'An error occurred while fetching project',
      details: error.message
    });
  }
};

/**
 * Update a project
 */
const updateProject = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const userId = req.user.uid;
    const { name, description, githubLink } = req.body;

    if (!firestore) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Firestore not initialized'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Project not found'
      });
    }

    // Check if user owns this project
    if (project.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this project'
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (githubLink !== undefined) updateData.githubLink = githubLink?.trim() || null;


    // If significant changes were made, re-run AI analysis
    const significantChange = name !== undefined || description !== undefined;
    if (significantChange && geminiService.isAvailable()) {
      try {
        const aiAnalysis = await geminiService.analyzeProject({
          name: updateData.name || project.name,
          description: updateData.description || project.description,
          githubLink: updateData.githubLink || project.githubLink
        });

        updateData.aiScore = aiAnalysis.score;
        updateData.aiFeedback = aiAnalysis.summary;
        updateData.aiSuggestions = aiAnalysis.suggestions;
        updateData.aiStrengths = aiAnalysis.strengths;
        updateData.aiAnalysisTimestamp = aiAnalysis.timestamp;
        updateData.aiModel = aiAnalysis.model;
        updateData.isMockAnalysis = aiAnalysis.isMock || false;
      } catch (aiError) {
        console.error('AI re-analysis failed:', aiError);
        // Keep existing AI analysis
      }
    }

    // Update project
    await project.update(updateData);

    return res.status(200).json({
      message: 'Project updated successfully',
      project: project.toObject()
    });

  } catch (error) {
    console.error('Update project error:', error);
    
    return res.status(500).json({
      error: 'Failed to update project',
      message: 'An error occurred while updating project',
      details: error.message
    });
  }
};

/**
 * Delete a project
 */
const deleteProject = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const userId = req.user.uid;

    if (!firestore) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Firestore not initialized'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Project not found'
      });
    }

    // Check if user owns this project
    if (project.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this project'
      });
    }

    await Project.delete(id);

    return res.status(200).json({
      message: 'Project deleted successfully',
      projectId: id
    });

  } catch (error) {
    console.error('Delete project error:', error);
    
    return res.status(500).json({
      error: 'Failed to delete project',
      message: 'An error occurred while deleting project',
      details: error.message
    });
  }
};

/**
 * Trigger AI analysis for an existing project
 */
const analyzeProject = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const userId = req.user.uid;

    if (!firestore) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Firestore not initialized'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Project not found'
      });
    }

    // Check if user owns this project
    if (project.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to analyze this project'
      });
    }

    // Get AI analysis
    let aiAnalysis = null;
    try {
      aiAnalysis = await geminiService.analyzeProject({
        name: project.name,
        description: project.description,
        githubLink: project.githubLink
      });

      // Update project with new AI analysis
      await project.update({
        aiScore: aiAnalysis.score,
        aiFeedback: aiAnalysis.summary,
        aiSuggestions: aiAnalysis.suggestions,
        aiStrengths: aiAnalysis.strengths,
        aiAnalysisTimestamp: aiAnalysis.timestamp,
        aiModel: aiAnalysis.model,
        isMockAnalysis: aiAnalysis.isMock || false
      });

      return res.status(200).json({
        message: 'Project analyzed successfully',
        analysis: aiAnalysis,
        project: project.toObject()
      });

    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      
      return res.status(500).json({
        error: 'AI analysis failed',
        message: 'Failed to analyze project with AI',
        details: aiError.message
      });
    }

  } catch (error) {
    console.error('Analyze project error:', error);
    
    return res.status(500).json({
      error: 'Failed to analyze project',
      message: 'An error occurred while analyzing project',
      details: error.message
    });
  }
};

/**
 * Get AI service status
 */
const getAIStatus = async (req, res) => {
  try {
    const status = geminiService.getStatus();
    
    return res.status(200).json({
      message: 'AI service status',
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get AI status error:', error);
    
    return res.status(500).json({
      error: 'Failed to get AI status',
      message: 'An error occurred while checking AI service status',
      details: error.message
    });
  }
};

module.exports = {
  getUserProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  analyzeProject,
  getAIStatus
};