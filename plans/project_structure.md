# Projectify-AI: Full-Stack Web Application Architecture

## Project Overview
A full-stack web application with JavaScript backend (Node.js/Express) and vanilla HTML/CSS/JS frontend that allows users to:
1. Register and log in with secure authentication
2. Submit projects with details (name, description, GitHub link)
3. Receive AI-generated analysis (score and improvement suggestions)
4. View projects with AI insights on a dashboard

## Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: SQLite with Sequelize ORM
- **Authentication**: JWT tokens with token blacklisting
- **AI Service**: OpenAI API (GPT models)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Testing**: Postman for API testing

## Project Structure

```
projectify-ai/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── openai.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   └── BlacklistedToken.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── projectController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── projectRoutes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── validationMiddleware.js
│   │   ├── utils/
│   │   │   ├── aiAnalyzer.js
│   │   │   └── validators.js
│   │   └── app.js
│   ├── package.json
│   ├── .env
│   └── server.js
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── css/
│   │   │   ├── style.css
│   │   │   └── auth.css
│   │   ├── js/
│   │   │   ├── auth.js
│   │   │   ├── dashboard.js
│   │   │   └── api.js
│   │   └── assets/
│   └── package.json (optional for frontend tooling)
└── plans/
    └── project_structure.md (this file)
```

## Database Schema

### Users Table
- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `username` (TEXT, UNIQUE, NOT NULL)
- `email` (TEXT, UNIQUE, NOT NULL)
- `password_hash` (TEXT, NOT NULL)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### Projects Table
- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `user_id` (INTEGER, FOREIGN KEY REFERENCES Users(id))
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `github_link` (TEXT)
- `ai_score` (INTEGER, 0-100)
- `ai_feedback` (TEXT)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### BlacklistedTokens Table
- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `token` (TEXT, UNIQUE, NOT NULL)
- `blacklisted_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (blacklist token)
- `GET /api/auth/verify` - Verify token validity

### Project Routes
- `GET /api/projects` - Get all projects for authenticated user
- `POST /api/projects` - Create new project (triggers AI analysis)
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## AI Analysis Flow
1. User submits project with name, description, GitHub link
2. Backend stores project in database
3. Backend sends project details to OpenAI API with prompt:
   "Analyze this software project: [name], [description], [GitHub link]. Provide a score (0-100) and specific improvement suggestions."
4. OpenAI returns analysis with score and feedback
5. Backend updates project record with AI score and feedback
6. Frontend displays project card with AI insights

## Authentication Flow
1. User registers with username, email, password
2. Backend hashes password, creates user, returns JWT token
3. Token stored in HTTP-only cookie or localStorage
4. Subsequent requests include token in Authorization header
5. Middleware verifies token and checks blacklist
6. Logout adds token to blacklist table

## Frontend Pages

### 1. Landing/Login Page
- Login form (username/email + password)
- Registration form (username, email, password, confirm password)
- Toggle between login/register modes
- Form validation

### 2. Dashboard Page
- Welcome message with user info
- Project submission form
- List of existing projects with AI insights
- Logout button
- Project cards showing:
  - Project name and description
  - GitHub link
  - AI score (visual indicator)
  - AI improvement suggestions

## Security Considerations
- Password hashing with bcrypt
- JWT tokens with expiration (24 hours)
- Token blacklisting for logout
- Input validation and sanitization
- CORS configuration
- Environment variables for secrets

## Dependencies

### Backend
- express: Web framework
- sqlite3: Database
- sequelize: ORM
- jsonwebtoken: JWT authentication
- bcryptjs: Password hashing
- dotenv: Environment variables
- cors: Cross-origin resource sharing
- openai: OpenAI API client
- helmet: Security headers

### Frontend (CDN)
- No build tools required
- Vanilla JavaScript
- Fetch API for HTTP requests
- LocalStorage for token management (or cookies)

## Implementation Phases

### Phase 1: Backend Authentication
- Set up Express server
- Configure SQLite database
- Implement user model and authentication
- Create JWT middleware
- Test with Postman

### Phase 2: Frontend Authentication UI
- Create HTML/CSS for login/register
- Implement form validation
- Connect to backend APIs
- Handle token storage

### Phase 3: Dashboard & Project Management
- Create dashboard layout
- Implement project submission form
- Display project list
- Connect project APIs

### Phase 4: AI Integration
- Integrate OpenAI API
- Implement AI analysis function
- Update project with AI insights
- Display AI feedback

### Phase 5: Polish & Deployment
- Error handling
- Responsive design
- Performance optimization
- Deployment configuration