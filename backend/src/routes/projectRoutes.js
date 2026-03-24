const express = require('express');
const router = express.Router();
const {
  getUserProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  analyzeProject,
  getAIStatus
} = require('../controllers/projectController');
const {
  authenticateFirebaseToken,
  optionalAuthentication
} = require('../middleware/authMiddleware');

/**
 * @route   GET /api/projects
 * @desc    Get all projects for authenticated user
 * @access  Private
 */
router.get('/', authenticateFirebaseToken, getUserProjects);

/**
 * @route   POST /api/projects
 * @desc    Create a new project with AI analysis
 * @access  Private
 * @body    {name, description, githubLink}
 */
router.post('/', authenticateFirebaseToken, createProject);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a specific project by ID
 * @access  Private
 */
router.get('/:id', authenticateFirebaseToken, getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update a project
 * @access  Private
 * @body    {name, description, githubLink}
 */
router.put('/:id', authenticateFirebaseToken, updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private
 */
router.delete('/:id', authenticateFirebaseToken, deleteProject);

/**
 * @route   POST /api/projects/:id/analyze
 * @desc    Trigger AI analysis for an existing project
 * @access  Private
 */
router.post('/:id/analyze', authenticateFirebaseToken, analyzeProject);

/**
 * @route   GET /api/projects/ai/status
 * @desc    Get AI service status
 * @access  Public
 */
router.get('/ai/status', getAIStatus);

/**
 * @route   GET /api/projects/health
 * @desc    Check projects service health
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    service: 'Projects Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      { path: '/', method: 'GET', description: 'Get user projects' },
      { path: '/', method: 'POST', description: 'Create project' },
      { path: '/:id', method: 'GET', description: 'Get project by ID' },
      { path: '/:id', method: 'PUT', description: 'Update project' },
      { path: '/:id', method: 'DELETE', description: 'Delete project' },
      { path: '/:id/analyze', method: 'POST', description: 'Analyze project with AI' },
      { path: '/ai/status', method: 'GET', description: 'Get AI service status' }
    ]
  });
});

module.exports = router;