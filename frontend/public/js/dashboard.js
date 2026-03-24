// frontend/public/js/dashboard.js

// Function to fetch projects from the backend API
async function fetchProjects() {
    try {
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
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Fetch and render projects
    const projects = await fetchProjects();
    renderProjects(projects);

    // Setup logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }

    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

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
        projectForm.reset();
        
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
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
}