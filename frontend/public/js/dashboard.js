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

    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';

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
        viewBtn.onclick = () => viewProjectDetails(project.id);
        
        const analyzeBtn = document.createElement('button');
        analyzeBtn.className = 'btn btn-primary';
        analyzeBtn.textContent = 'Analyze with AI';
        analyzeBtn.onclick = () => analyzeProject(project.id);
        
        actionsSection.appendChild(viewBtn);
        actionsSection.appendChild(analyzeBtn);

        // Assemble card
        projectCard.appendChild(scoreSection);
        projectCard.appendChild(detailsSection);
        projectCard.appendChild(actionsSection);
        
        container.appendChild(projectCard);
    });
}

// Function to view project details
function viewProjectDetails(projectId) {
    console.log('View project details:', projectId);
    // TODO: Implement project detail view
}

// Function to analyze project with AI
function analyzeProject(projectId) {
    console.log('Analyze project with AI:', projectId);
    // TODO: Implement AI analysis
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard loading...');
    
    try {
        // Wait for authService to be available and Firebase auth to initialize
        let authChecked = false;
        let retryCount = 0;
        const maxRetries = 5;
        
        while (!authChecked && retryCount < maxRetries) {
            // Check if authService is available
            if (typeof authService !== 'undefined' && authService && typeof authService.isAuthenticated === 'function') {
                if (authService.isAuthenticated()) {
                    authChecked = true;
                    console.log('User authenticated successfully');
                    break;
                } else {
                    console.log(`User not authenticated yet (attempt ${retryCount + 1}/${maxRetries}), waiting...`);
                    // Wait for Firebase auth to restore state
                    await new Promise(resolve => setTimeout(resolve, 500));
                    retryCount++;
                }
            } else {
                console.warn('authService not available, waiting...');
                await new Promise(resolve => setTimeout(resolve, 500));
                retryCount++;
            }
        }
        
        // If still not authenticated after retries, redirect to login
        if (!authChecked) {
            console.log('User not authenticated after waiting, redirecting to index.html');
            window.location.href = 'index.html';
            return;
        }

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
        
        // Refresh projects list
        const projects = await fetchProjects();
        renderProjects(projects);
        
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