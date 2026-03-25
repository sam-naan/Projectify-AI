// frontend/public/js/dashboard.js

// Function to display user information
function displayUserInfo() {
    // Try to get user from authService first, then apiService
    let user = null;
    if (authService && authService.currentUser) {
        user = authService.currentUser;
    } else if (apiService && apiService.getCurrentUser) {
        user = apiService.getCurrentUser();
    }
    
    if (user) {
        const dropdownUserNameElement = document.getElementById('dropdownUserName');
        const dropdownUserEmailElement = document.getElementById('dropdownUserEmail');
        
        const displayName = user.displayName || user.fullName || user.email?.split('@')[0] || 'User';
        const email = user.email || 'No email available';
        
        if (dropdownUserNameElement) {
            dropdownUserNameElement.textContent = displayName;
        }
        
        if (dropdownUserEmailElement) {
            dropdownUserEmailElement.textContent = email;
        }
        
        // Update avatar with first letter of name
        const dropdownAvatarElement = document.querySelector('.dropdown-avatar i');
        const smallAvatarElement = document.querySelector('.avatar-small i');
        
        const firstLetter = displayName.charAt(0).toUpperCase();
        
        if (dropdownAvatarElement) {
            dropdownAvatarElement.textContent = firstLetter;
        }
        
        if (smallAvatarElement) {
            smallAvatarElement.textContent = firstLetter;
        }
    } else {
        console.warn('No user data available');
        // Try to get from Firebase auth directly
        if (window.firebase && window.firebase.auth) {
            const currentUser = window.firebase.auth.currentUser;
            if (currentUser) {
                const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
                const email = currentUser.email || 'No email available';
                
                const dropdownUserNameElement = document.getElementById('dropdownUserName');
                const dropdownUserEmailElement = document.getElementById('dropdownUserEmail');
                
                if (dropdownUserNameElement) {
                    dropdownUserNameElement.textContent = displayName;
                }
                
                if (dropdownUserEmailElement) {
                    dropdownUserEmailElement.textContent = email;
                }
            }
        }
    }
}

// Function to fetch projects from the backend API
async function fetchProjects() {
    try {
        if (typeof apiService === 'undefined' || !apiService.projects) {
            console.warn('apiService not available, returning empty projects list');
            return [];
        }
        
        const data = await apiService.projects.getAll();
        return data.projects || [];
    } catch (error) {
        console.error('Error fetching projects:', error);
        // Display error to user
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'Failed to load projects. Please try again later.';
            errorElement.style.display = 'block';
        }
        return [];
    }
}

// Function to render projects with AI insights
function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    if (!container) return;

    container.innerHTML = ''; // Clear existing content

    if (projects.length === 0) {
        container.innerHTML = '<p class="no-projects">No projects found. Create your first project to get started!</p>';
        return;
    }

    // Helper function to find project ID from project object
    const findProjectId = (project) => {
        // First, try all known ID property names
        const id = project.id || project._id || project.projectId || project.docId;
        if (id) return id;
        
        // If not found, look for any property ending with 'id' or 'Id'
        const allKeys = Object.keys(project);
        for (const key of allKeys) {
            if (key.toLowerCase().includes('id') && project[key]) {
                console.log('Found ID in property:', key, 'value:', project[key]);
                return project[key];
            }
        }
        
        // Last resort: check for Firestore document ID pattern
        // Firestore IDs are usually 20-character alphanumeric strings
        for (const key of allKeys) {
            const value = project[key];
            if (typeof value === 'string' && /^[a-zA-Z0-9]{20}$/.test(value)) {
                console.log('Found potential Firestore ID in property:', key, 'value:', value);
                return value;
            }
        }
        
        return null;
    };

    projects.forEach(project => {
        // Debug: log project object to see available properties
        console.log('Project object:', project);
        console.log('Project keys:', Object.keys(project));
        
        // Log all properties including potential ID properties
        console.log('Project.id:', project.id);
        console.log('Project._id:', project._id);
        console.log('Project.projectId:', project.projectId);
        console.log('Project.docId:', project.docId);
        
        // Try to find any ID-like property
        const allKeys = Object.keys(project);
        const idKeys = allKeys.filter(key => key.toLowerCase().includes('id'));
        console.log('ID-like keys:', idKeys);
        idKeys.forEach(key => console.log(`Project.${key}:`, project[key]));
        
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';

        // Delete button (top right corner)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'project-delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        const projectId = findProjectId(project);
        
        if (projectId) {
            deleteBtn.title = 'Delete project';
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // Prevent card click events
                console.log('Deleting project with ID:', projectId, 'Name:', project.name);
                deleteProject(projectId, project.name);
            };
        } else {
            deleteBtn.title = 'Cannot delete: Project ID not found';
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.5';
            deleteBtn.style.cursor = 'not-allowed';
            console.error('No project ID found for project:', project.name, 'Project object:', project);
        }

        // Project score
        const scoreSection = document.createElement('div');
        scoreSection.className = 'project-score';
        
        const scoreCircle = document.createElement('div');
        scoreCircle.className = 'score-circle';
        scoreCircle.textContent = project.aiScore ? `${project.aiScore}%` : 'N/A';
        
        const scoreLabel = document.createElement('div');
        scoreLabel.className = 'score-label';
        scoreLabel.textContent = 'AI Score';

        scoreSection.appendChild(scoreCircle);
        scoreSection.appendChild(scoreLabel);

        // Project details
        const detailsSection = document.createElement('div');
        detailsSection.className = 'project-details';
        
        const title = document.createElement('h4');
        title.textContent = project.name;
        
        const description = document.createElement('p');
        description.textContent = project.description;

        detailsSection.appendChild(title);
        detailsSection.appendChild(description);

        // AI Insights
        if (project.aiSuggestions && project.aiSuggestions.length > 0) {
            const insightsSection = document.createElement('div');
            insightsSection.className = 'ai-suggestions';
            
            project.aiSuggestions.forEach(insight => {
                const insightTag = document.createElement('span');
                insightTag.className = 'suggestion-tag';
                insightTag.textContent = insight;
                insightsSection.appendChild(insightTag);
            });
            
            detailsSection.appendChild(insightsSection);
        }

        // Action buttons
        const actionsSection = document.createElement('div');
        actionsSection.className = 'project-actions';
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-outline';
        viewBtn.textContent = 'View Details';
        
        const analyzeBtn = document.createElement('button');
        analyzeBtn.className = 'btn btn-primary';
        analyzeBtn.textContent = 'Analyze with AI';
        
        // Use the projectId already found above (reuse the same variable)
        // Note: projectId is already defined in the outer scope of the forEach loop
        
        if (projectId) {
            viewBtn.onclick = () => {
                console.log('View Details - Project ID resolved:', projectId, 'from project:', project);
                viewProjectDetails(projectId);
            };
            
            analyzeBtn.onclick = () => {
                console.log('Analyze with AI - Project ID resolved:', projectId, 'from project:', project);
                analyzeProject(projectId);
            };
        } else {
            viewBtn.disabled = true;
            viewBtn.title = 'Cannot view details: Project ID not found';
            viewBtn.style.opacity = '0.5';
            viewBtn.style.cursor = 'not-allowed';
            
            analyzeBtn.disabled = true;
            analyzeBtn.title = 'Cannot analyze: Project ID not found';
            analyzeBtn.style.opacity = '0.5';
            analyzeBtn.style.cursor = 'not-allowed';
            
            console.error('No project ID found for buttons on project:', project.name);
        }

        actionsSection.appendChild(viewBtn);
        actionsSection.appendChild(analyzeBtn);

        // Assemble card
        projectCard.appendChild(deleteBtn);
        projectCard.appendChild(scoreSection);
        projectCard.appendChild(detailsSection);
        projectCard.appendChild(actionsSection);
        
        container.appendChild(projectCard);
    });
}

// Function to update dashboard overview statistics
function updateOverviewStats(projects) {
    // Calculate statistics
    const totalProjects = projects.length;
    
    // Calculate average score (only projects with aiScore)
    const projectsWithScore = projects.filter(p => p.aiScore !== null && p.aiScore !== undefined);
    const averageScore = projectsWithScore.length > 0
        ? Math.round(projectsWithScore.reduce((sum, p) => sum + p.aiScore, 0) / projectsWithScore.length)
        : 0;
    
    // Find best score
    const bestScore = projectsWithScore.length > 0
        ? Math.max(...projectsWithScore.map(p => p.aiScore))
        : 0;
    
    // Count total suggestions
    const totalSuggestions = projects.reduce((sum, p) => {
        return sum + (Array.isArray(p.aiSuggestions) ? p.aiSuggestions.length : 0);
    }, 0);

    // Update DOM elements
    const totalProjectsElement = document.getElementById('totalProjects');
    const averageScoreElement = document.getElementById('averageScore');
    const bestScoreElement = document.getElementById('bestScore');
    const totalSuggestionsElement = document.getElementById('totalSuggestions');

    if (totalProjectsElement) totalProjectsElement.textContent = totalProjects;
    if (averageScoreElement) averageScoreElement.textContent = `${averageScore}%`;
    if (bestScoreElement) bestScoreElement.textContent = `${bestScore}%`;
    if (totalSuggestionsElement) totalSuggestionsElement.textContent = totalSuggestions;
}

// Function to render recent projects in the Overview section
function renderRecentProjects(projects) {
    const container = document.getElementById('Projects');
    if (!container) return;

    container.innerHTML = ''; // Clear existing content

    if (projects.length === 0) {
        container.innerHTML = '<p class="no-projects">No projects yet. Add your first project to get started!</p>';
        return;
    }

    // Sort by creation date (newest first) and take up to 5
    const recentProjects = [...projects]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    recentProjects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'recent-project-item';
        
        const projectLink = document.createElement('a');
        projectLink.href = '#';
        projectLink.className = 'recent-project-link';
        projectLink.onclick = (e) => {
            e.preventDefault();
            showSection('projects');
        };
        
        const projectName = document.createElement('span');
        projectName.className = 'recent-project-name';
        projectName.textContent = project.name;
        
        const projectScore = document.createElement('span');
        projectScore.className = 'recent-project-score';
        projectScore.textContent = project.aiScore ? `${project.aiScore}%` : 'N/A';
        
        projectLink.appendChild(projectName);
        projectLink.appendChild(projectScore);
        projectItem.appendChild(projectLink);
        container.appendChild(projectItem);
    });

    // Add "View All" link if there are more than 5 projects
    if (projects.length > 5) {
        const viewAllLink = document.createElement('div');
        viewAllLink.className = 'view-all-projects';
        
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = 'View All Projects';
        link.onclick = (e) => {
            e.preventDefault();
            showSection('projects');
        };
        
        viewAllLink.appendChild(link);
        container.appendChild(viewAllLink);
    }
}

// Function to view project details
async function viewProjectDetails(projectId) {
    console.log('View project details:', projectId);
    
    // Validate projectId
    if (!projectId || projectId === 'undefined') {
        alert('Cannot view project details: Invalid project ID');
        console.error('Invalid project ID:', projectId);
        return;
    }
    
    try {
        // Show loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        // Fetch project details
        const response = await apiService.projects.getById(projectId);
        
        // Hide loading overlay
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        // Extract project from response (API returns { message: '...', project: {...} })
        const project = response.project || response;
        console.log('Project details response:', response);
        console.log('Extracted project:', project);
        
        // Show project details in modal
        showProjectDetailsModal(project);
    } catch (error) {
        console.error('Error fetching project details:', error);
        
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        // Show error message
        alert('Failed to load project details. Please try again.');
    }
}

// Function to show project details modal
function showProjectDetailsModal(project) {
    console.log('Showing project details modal for project:', project);
    
    const modal = document.getElementById('projectDetailModal');
    const modalTitle = document.getElementById('projectModalTitle');
    const modalBody = document.getElementById('projectModalBody');
    
    if (!modal || !modalTitle || !modalBody) {
        console.error('Modal elements not found');
        return;
    }
    
    // Set modal title
    modalTitle.textContent = project.name || 'Project Details';
    
    // Format date
    const createdAt = project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Not available';
    
    // Format AI score with color
    const score = project.aiScore || 0;
    const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    
    // Check if we have AI analysis data
    const hasAIStrengths = project.aiStrengths && project.aiStrengths.length > 0;
    const hasAISuggestions = project.aiSuggestions && project.aiSuggestions.length > 0;
    const hasAIFeedback = project.aiFeedback && project.aiFeedback.trim().length > 0;
    
    // Create HTML for project details
    const html = `
        <div class="project-details">
            <div class="detail-section">
                <h4>Project Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${project.name || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Description:</span>
                        <span class="detail-value">${project.description || 'No description provided'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">GitHub Link:</span>
                        <span class="detail-value">
                            ${project.githubLink ? `<a href="${project.githubLink}" target="_blank">${project.githubLink}</a>` : 'Not provided'}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${createdAt}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">AI Score:</span>
                        <span class="detail-value" style="color: ${scoreColor}; font-weight: bold;">
                            ${score}/100
                        </span>
                    </div>
                    ${project.aiModel ? `
                    <div class="detail-item">
                        <span class="detail-label">AI Model:</span>
                        <span class="detail-value">${project.aiModel}</span>
                    </div>
                    ` : ''}
                    ${project.aiAnalysisTimestamp ? `
                    <div class="detail-item">
                        <span class="detail-label">Last Analyzed:</span>
                        <span class="detail-value">${new Date(project.aiAnalysisTimestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${hasAIFeedback || hasAIStrengths || hasAISuggestions ? `
            <div class="detail-section">
                <h4>AI Analysis</h4>
                <div class="detail-grid">
                    ${hasAIFeedback ? `
                    <div class="detail-item full-width">
                        <span class="detail-label">Feedback:</span>
                        <div class="detail-value">
                            <p class="ai-feedback">${project.aiFeedback}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${hasAIStrengths ? `
                    <div class="detail-item full-width">
                        <span class="detail-label">Strengths:</span>
                        <div class="detail-value">
                            <ul class="strengths-list">
                                ${project.aiStrengths.map(strength => `<li>${strength}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${hasAISuggestions ? `
                    <div class="detail-item full-width">
                        <span class="detail-label">Suggestions:</span>
                        <div class="detail-value">
                            <ul class="suggestions-list">
                                ${project.aiSuggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="analyzeProject('${project.id || project._id || ''}')">
                    <i class="fas fa-robot"></i> Re-analyze with AI
                </button>
                <button class="btn btn-outline" onclick="closeProjectDetailsModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modalBody.innerHTML = html;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Add event listener for close button (if not already added)
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn && !closeBtn.hasEventListener) {
        closeBtn.addEventListener('click', closeProjectDetailsModal);
        closeBtn.hasEventListener = true;
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeProjectDetailsModal();
        }
    });
}

// Function to close project details modal
function closeProjectDetailsModal() {
    const modal = document.getElementById('projectDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to analyze project with AI
async function analyzeProject(projectId) {
    console.log('Analyze project with AI:', projectId);
    
    // Validate projectId
    if (!projectId || projectId === 'undefined') {
        alert('Cannot analyze project: Invalid project ID');
        console.error('Invalid project ID:', projectId);
        return;
    }
    
    try {
        // Show loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        // Call API to re-analyze project
        const result = await apiService.projects.analyze(projectId);
        
        // Hide loading overlay
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        // Close project details modal if open
        closeProjectDetailsModal();
        
        // Refresh projects to show updated data
        const projects = await fetchProjects();
        renderProjects(projects);
        updateOverviewStats(projects);
        renderRecentProjects(projects);
        
    } catch (error) {
        console.error('Error analyzing project:', error);
        
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        // Show error message
        alert('Failed to re-analyze project. Please try again.');
    }
}

// Function to delete project
async function deleteProject(projectId, projectName) {
    console.log('Delete project:', projectId, projectName);
    
    // Validate projectId
    if (!projectId || projectId === 'undefined') {
        alert('Cannot delete project: Invalid project ID');
        console.error('Invalid project ID:', projectId);
        return;
    }
    
    try {
        // Show loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        // Call API to delete project
        await apiService.projects.delete(projectId);
        
        // Hide loading overlay
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        // Close project details modal if open
        closeProjectDetailsModal();
        
        // Refresh projects to show updated list
        const projects = await fetchProjects();
        renderProjects(projects);
        updateOverviewStats(projects);
        renderRecentProjects(projects);
        
    } catch (error) {
        console.error('Error deleting project:', error);
        
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        // Show error message
        alert('Failed to delete project. Please try again.');
    }
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard loading...');
    
    try {
        // Wait for authService to be available
        let authServiceAvailable = false;
        let authServiceRetryCount = 0;
        const maxAuthServiceRetries = 10; // 5 seconds total (500ms * 10)
        
        while (!authServiceAvailable && authServiceRetryCount < maxAuthServiceRetries) {
            if (typeof authService !== 'undefined' && authService && typeof authService.waitForAuthState === 'function') {
                authServiceAvailable = true;
                break;
            } else {
                console.warn('authService not available yet, waiting...');
                await new Promise(resolve => setTimeout(resolve, 500));
                authServiceRetryCount++;
            }
        }
        
        if (!authServiceAvailable) {
            console.error('authService not available after waiting, redirecting to index.html');
            window.location.href = 'index.html';
            return;
        }
        
        // Wait for authentication state to be determined
        console.log('Waiting for authentication state...');
        const isAuthenticated = await authService.waitForAuthState(5000); // 5 second timeout
        
        if (!isAuthenticated) {
            console.log('User not authenticated after waiting, redirecting to index.html');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('User authenticated successfully');

        // Check if apiService is available
        if (typeof apiService === 'undefined') {
            console.error('apiService is not defined. Make sure api.js is loaded before dashboard.js');
            // Show error to user
            const errorElement = document.getElementById('error-message');
            if (errorElement) {
                errorElement.textContent = 'Error: API service not available. Please refresh the page.';
                errorElement.style.display = 'block';
            }
        } else {
            console.log('apiService is available');
            
            // Ensure apiService has authentication token
            if (!apiService.token && window.firebase && window.firebase.auth && window.firebase.auth.currentUser) {
                console.log('Getting fresh token for apiService...');
                try {
                    const firebaseUser = window.firebase.auth.currentUser;
                    const token = await firebaseUser.getIdToken();
                    apiService.setToken(token);
                    apiService.setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName
                    });
                    console.log('Token set in apiService');
                } catch (tokenError) {
                    console.warn('Failed to get Firebase token:', tokenError);
                }
            }
        }

        // Display user information
        displayUserInfo();

        // Fetch and render projects
        const projects = await fetchProjects();
        renderProjects(projects);
        updateOverviewStats(projects);
        renderRecentProjects(projects);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Show error to user
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = `Error loading dashboard: ${error.message}`;
            errorElement.style.display = 'block';
        }
    }

    // Setup profile dropdown functionality
    const profileDropdownBtn = document.getElementById('profileDropdownBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileDropdownBtn && profileDropdown) {
        // Toggle dropdown on button click
        profileDropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileDropdown.contains(e.target) && !profileDropdownBtn.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                profileDropdown.classList.remove('show');
            }
        });
    }

    // Setup logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    
    const handleLogout = async () => {
        await authService.logout();
        window.location.href = 'index.html';
    };
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', handleLogout);
    }

    // Setup navigation for dropdown items
    document.querySelectorAll('.dropdown-item[data-section]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            // Close dropdown after selection
            if (profileDropdown) {
                profileDropdown.classList.remove('show');
            }
        });
    });

    // Setup add project buttons
    const newProjectBtn = document.getElementById('newProjectBtn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => showSection('addProject'));
    }
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', () => showSection('addProject'));
    }
    const addFirstProject = document.getElementById('addFirstProject');
    if (addFirstProject) {
        addFirstProject.addEventListener('click', () => showSection('addProject'));
    }
    const addProjectEmpty = document.getElementById('addProjectEmpty');
    if (addProjectEmpty) {
        addProjectEmpty.addEventListener('click', () => showSection('addProject'));
    }

    // Setup cancel button
    const cancelProjectBtn = document.getElementById('cancelProjectBtn');
    if (cancelProjectBtn) {
        cancelProjectBtn.addEventListener('click', () => showSection('projects'));
    }

    // Setup back to dashboard button
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => showSection('overview'));
    }

    // Setup view all projects link
    const viewAllProjects = document.getElementById('viewAllProjects');
    if (viewAllProjects) {
        viewAllProjects.addEventListener('click', () => showSection('projects'));
    }

    // Show initial section
    showSection('overview');
    
    // Setup project form submission
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', submitProject);
    }
});

// Submit new project form
const submitProject = async (e) => {
    e.preventDefault();
    
    const projectForm = document.getElementById('projectForm');
    const projectName = document.getElementById('projectName').value;
    const projectDescription = document.getElementById('projectDescription').value;
    const githubLink = document.getElementById('githubLink').value;
    
    const statusElement = document.getElementById('projectFormStatus');
    statusElement.textContent = 'Submitting project for analysis...';
    statusElement.className = 'form-status info';
    
    try {
        const data = await apiService.projects.create({
            name: projectName,
            description: projectDescription,
            githubLink: githubLink || null
        });
        
        statusElement.textContent = 'Project submitted successfully! AI analysis completed.';
        statusElement.className = 'form-status success';
        
        // Reset form
        if (projectForm) projectForm.reset();
        
        // Refresh projects list and update all views
        const projects = await fetchProjects();
        renderProjects(projects);
        updateOverviewStats(projects);
        renderRecentProjects(projects);
        
        // Navigate back to My Projects section
        showSection('projects');
        
    } catch (error) {
        console.error('Project submission error:', error);
        statusElement.textContent = `Error: ${error.message}`;
        statusElement.className = 'form-status error';
    }
};

// Function to show specific section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(`${sectionId}Section`);
    if (section) {
        section.classList.add('active');
    }
    
    // Update active dropdown item
    document.querySelectorAll('.dropdown-item[data-section]').forEach(item => {
        item.classList.remove('active');
    });
    
    const dropdownItem = document.querySelector(`.dropdown-item[data-section="${sectionId}"]`);
    if (dropdownItem) {
        dropdownItem.classList.add('active');
    }
}