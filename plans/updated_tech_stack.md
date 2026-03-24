# Updated Tech Stack: Firebase + Gemini

## Revised Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Authentication
- **AI Service**: Google Gemini API
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Hosting**: Firebase Hosting (optional)

## Key Changes from Original Plan

### 1. Database: SQLite → Firebase Firestore
- NoSQL document database
- Real-time updates capability
- Built-in authentication system
- Scalable cloud solution

### 2. AI Service: OpenAI → Google Gemini
- Google's AI model API
- Different pricing and capabilities
- Requires Google Cloud API key

### 3. Authentication: Custom JWT → Firebase Auth
- Built-in user management
- Email/password authentication
- Social login options (Google, GitHub, etc.)
- Secure token management

## Updated Project Structure

```
projectify-ai/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebase.js
│   │   │   └── gemini.js
│   │   ├── models/
│   │   │   ├── User.js (Firebase Auth integration)
│   │   │   └── Project.js (Firestore data model)
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── projectController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── projectRoutes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js (Firebase token verification)
│   │   │   └── validationMiddleware.js
│   │   ├── services/
│   │   │   └── geminiService.js
│   │   └── app.js
│   ├── package.json
│   ├── firebase-service-account.json
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
│   │   │   ├── auth.js (Firebase Auth SDK)
│   │   │   ├── dashboard.js
│   │   │   ├── firebase-config.js
│   │   │   └── api.js
│   │   └── assets/
└── plans/
    ├── project_structure.md
    └── updated_tech_stack.md
```

## Firebase Setup Requirements

### 1. Firebase Project Creation
- Create project in Firebase Console
- Enable Authentication (Email/Password)
- Enable Firestore Database
- Generate service account key

### 2. Firebase Configuration Files
- `firebase-service-account.json` - Backend service account
- `firebase-config.js` - Frontend Firebase config

### 3. Firestore Database Structure

#### Collections:
- `users` (managed by Firebase Auth)
- `projects`
  - Document structure:
    ```json
    {
      "userId": "firebase-auth-uid",
      "name": "Project Name",
      "description": "Project description",
      "githubLink": "https://github.com/...",
      "aiScore": 85,
      "aiFeedback": "Detailed feedback from Gemini",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
    ```

## Gemini API Integration

### 1. Google Cloud Setup
- Create Google Cloud project
- Enable Gemini API
- Generate API key

### 2. Gemini Service Implementation
- Use `@google/generative-ai` package
- Prompt engineering for project analysis
- Response parsing for score and suggestions

### 3. Analysis Prompt Example
```
Analyze this software project:
Name: {projectName}
Description: {projectDescription}
GitHub: {githubLink}

Provide:
1. A score from 0-100 based on completeness, innovation, and technical quality
2. Three specific improvement suggestions
3. Brief feedback on strengths and weaknesses

Format response as JSON:
{
  "score": number,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "feedback": "string"
}
```

## Authentication Flow with Firebase

### Backend Flow:
1. User registers/login via frontend Firebase Auth
2. Firebase returns ID token
3. Frontend sends token to backend in Authorization header
4. Backend verifies token with Firebase Admin SDK
5. Backend extracts user ID from verified token
6. Proceed with authenticated request

### Frontend Flow:
1. Initialize Firebase Auth SDK
2. Show login/register forms
3. On submit, call Firebase Auth methods
4. Store user token in localStorage/session
5. Include token in API requests

## API Endpoints (Updated)

### Authentication (Firebase-based)
- `POST /api/auth/verify-token` - Verify Firebase ID token
- `POST /api/auth/create-custom-token` - Create custom token if needed

### Projects
- `GET /api/projects` - Get user's projects (requires Firebase token)
- `POST /api/projects` - Create project with AI analysis
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Dependencies Update

### Backend Dependencies:
```json
{
  "express": "^4.18.0",
  "firebase-admin": "^12.0.0",
  "@google/generative-ai": "^0.21.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.0",
  "helmet": "^7.0.0"
}
```

### Frontend Dependencies (CDN):
```html
<!-- Firebase SDKs -->
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js"></script>
```

## Advantages of This Stack

1. **Simplified Authentication**: Firebase Auth handles user management
2. **Real-time Updates**: Firestore can push updates to frontend
3. **Scalability**: Firebase scales automatically
4. **Reduced Backend Complexity**: Less database management code
5. **Google Ecosystem**: Integration with other Google services

## Implementation Considerations

1. **Cost Management**: Firebase and Gemini have usage-based pricing
2. **Security Rules**: Configure Firestore security rules properly
3. **Offline Support**: Firestore supports offline data persistence
4. **Error Handling**: Handle Firebase/Gemini API errors gracefully
5. **Rate Limiting**: Implement rate limiting for Gemini API calls

## Next Steps
1. Create Firebase project and get credentials
2. Set up Firebase Admin SDK in backend
3. Configure Firestore database rules
4. Get Gemini API key from Google Cloud
5. Update backend dependencies
6. Implement Firebase Auth integration