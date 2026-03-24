const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Service
 * Handles AI analysis of projects using Google's Gemini API
 */

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    this.genAI = null;
    this.model = null;
    
    this.initialize();
  }

  initialize() {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ Gemini API key not found. AI analysis will be mocked.');
        return;
      }

      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      console.log(`✅ Gemini AI service initialized with model: ${this.modelName}`);
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI service:', error.message);
      this.model = null;
    }
  }

  /**
   * Analyze a software project using Gemini AI
   * @param {Object} project - Project details
   * @param {string} project.name - Project name
   * @param {string} project.description - Project description
   * @param {string} project.githubLink - GitHub repository link
   * @returns {Promise<Object>} - AI analysis results
   */
  async analyzeProject(project) {
    // If Gemini is not available, return mock analysis
    if (!this.model) {
      return this.getMockAnalysis(project);
    }

    try {
      const prompt = this.createAnalysisPrompt(project);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseAnalysisResponse(text, project);
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Fallback to mock analysis on API failure
      return this.getMockAnalysis(project, true);
    }
  }

  /**
   * Create a prompt for project analysis
   */
  createAnalysisPrompt(project) {
    return `
You are an expert software project analyst. Analyze the following software project and provide a comprehensive assessment.

PROJECT DETAILS:
- Name: ${project.name}
- Description: ${project.description}
- GitHub: ${project.githubLink || 'Not provided'}

ANALYSIS REQUIREMENTS:
1. Provide an overall score from 0-100 based on:
   - Technical completeness (30%)
   - Innovation and uniqueness (25%)
   - Code quality and best practices (25%)
   - Documentation and maintainability (20%)

2. Identify 3-5 specific strengths of the project.

3. Provide 3-5 actionable improvement suggestions.

4. Give a brief summary of your assessment.

RESPONSE FORMAT (JSON):
{
  "score": number (0-100),
  "strengths": ["strength1", "strength2", "strength3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "summary": "Brief summary of the assessment",
  "confidence": "high/medium/low"
}

IMPORTANT: Return ONLY valid JSON, no additional text.
`;
  }

  /**
   * Parse the AI response into structured data
   */
  parseAnalysisResponse(text, project) {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const requiredFields = ['score', 'strengths', 'suggestions', 'summary'];
      for (const field of requiredFields) {
        if (!analysis[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Ensure score is within range
      analysis.score = Math.max(0, Math.min(100, parseInt(analysis.score) || 50));
      
      // Add metadata
      analysis.timestamp = new Date().toISOString();
      analysis.model = this.modelName;
      analysis.projectName = project.name;
      
      return analysis;
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.log('Raw response:', text);
      
      // Return mock analysis if parsing fails
      return this.getMockAnalysis(project, true);
    }
  }

  /**
   * Generate mock analysis for testing or when API is unavailable
   */
  getMockAnalysis(project, isFallback = false) {
    const strengths = [
      "Clear project concept and purpose",
      "Good documentation structure",
      "Modern technology stack",
      "Active development visible",
      "User-friendly interface design"
    ].slice(0, 3 + Math.floor(Math.random() * 2));

    const suggestions = [
      "Add more comprehensive tests",
      "Improve error handling",
      "Add CI/CD pipeline",
      "Enhance documentation with examples",
      "Consider adding performance benchmarks",
      "Implement better logging",
      "Add user authentication if not present",
      "Improve mobile responsiveness"
    ].slice(0, 3 + Math.floor(Math.random() * 2));

    const score = 60 + Math.floor(Math.random() * 30); // 60-90
    
    const summaries = [
      "This project shows good potential with a solid foundation. With some improvements, it could become production-ready.",
      "A promising project with clear objectives. Focus on testing and documentation to reach the next level.",
      "Well-structured project with good architectural decisions. Consider adding more automation and monitoring.",
      "Good starting point with room for growth. The core functionality works well but needs polish."
    ];

    return {
      score,
      strengths,
      suggestions,
      summary: summaries[Math.floor(Math.random() * summaries.length)],
      confidence: isFallback ? "low" : "high",
      timestamp: new Date().toISOString(),
      model: isFallback ? "mock-fallback" : this.modelName,
      projectName: project.name,
      isMock: true,
      note: isFallback ? "Using mock analysis due to API failure" : "Using mock analysis (API not configured)"
    };
  }

  /**
   * Check if Gemini service is available
   */
  isAvailable() {
    return !!this.model;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      model: this.modelName,
      apiKeyConfigured: !!this.apiKey,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const geminiService = new GeminiService();

module.exports = geminiService;