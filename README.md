# Projectify-AI 🚀

<div align="center">

![Projectify-AI Logo](https://img.shields.io/badge/Projectify--AI-FF6B6B?style=for-the-badge&logo=google-ai&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google-ai&logoColor=white)

**Transform Your Projects with AI-Powered Insights**

A full-stack web application that analyzes software projects using Google's Gemini AI, providing intelligent scores, feedback, and improvement suggestions.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [API Reference](#-api-reference) • [Project Structure](#-project-structure)

</div>

## 📋 Overview

Projectify-AI is a modern web application that allows developers to submit their software projects for AI-powered analysis. The application uses Google's Gemini AI to evaluate projects based on various criteria including code quality, architecture, documentation, and best practices, then provides detailed scores and actionable improvement suggestions.

### Key Capabilities
- **AI-Powered Project Analysis**: Get intelligent feedback on your software projects
- **Comprehensive Scoring**: Receive scores across multiple dimensions (code quality, architecture, documentation, etc.)
- **Personalized Dashboard**: Track all your analyzed projects in one place
- **Secure Authentication**: Firebase Authentication with email/password
- **Real-time Updates**: Instant analysis results with detailed breakdowns

## ✨ Features

### 🔐 Authentication & Security
- User registration and login with Firebase Authentication
- Secure password hashing with bcrypt
- JWT-based session management
- Protected API endpoints with middleware

### 🤖 AI Analysis Engine
- Integration with Google Gemini AI (Gemini 1.5 Pro)
- Mock analysis mode for development/testing
- Customizable analysis prompts
- Multi-dimensional scoring system
- Detailed improvement suggestions

### 📊 Project Management
- Create, read, update, and delete projects
- Project categorization and tagging
- Historical analysis tracking
- Export analysis reports

### 🎨 Modern UI/UX
- Responsive design for all devices
- Clean, intuitive dashboard
- Real-time feedback and notifications
- Interactive charts and visualizations

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Firebase Admin SDK** - Authentication and Firestore
- **Google Generative AI** - Gemini AI integration
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - API rate limiting
- **express-validator** - Request validation
- **dotenv** - Environment variable management

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with custom CSS
- **JavaScript (ES6+)** - Client-side logic
- **Font Awesome** - Icons
- **Google Fonts** - Typography

### Database & Storage
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User management

### Development Tools
- **Nodemon** - Development server auto-reload
- **Jest** - Testing framework
- **Supertest** - HTTP assertion testing

## 📁 Project Structure

```
Projectify-AI/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.js          # Firebase configuration
│   │   ├── controllers/
│   │   │   ├── authController.js    # Authentication logic
│   │   │   └── projectController.js # Project CRUD and AI analysis
│   │   ├── middleware/
│   │   │   └── authMiddleware.js    # Authentication middleware
│   │   ├── models/
│   │   │   └── Project.js           # Project data model
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # Authentication routes
│   │   │   └── projectRoutes.js     # Project routes
│   │   └── services/
│   │       └── geminiService.js     # Gemini AI integration service
│   ├── .env                         # Environment variables
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Backend dependencies
│   ├── package-lock.json            # Dependency lock file
│   └── server.js                    # Main Express server
│
└── frontend/
    └── public/
        ├── css/
        │   ├── auth.css             # Authentication page styles
        │   ├── dashboard.css        # Dashboard styles
        │   └── style.css            # Global styles
        ├── js/
        │   ├── api.js               # API client
        │   ├── auth.js              # Authentication logic
        │   └── dashboard.js         # Dashboard functionality
        ├── dashboard.html           # Main dashboard page
        └── index.html               # Landing and authentication page
```

## 🚀 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account with Firestore and Authentication enabled
- Google Cloud account with Gemini API access

### Step 1: Clone the Repository
```bash
git clone https://github.com/sam-naan/projectify-ai.git
cd projectify-ai
```

### Step 2: Backend Setup
```bash
cd backend
npm install
```

### Step 3: Environment Configuration
Create a `.env` file in the `backend` directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro

# CORS Configuration
FRONTEND_URL=http://localhost:5500,http://localhost:3000
```

### Step 4: Frontend Setup
The frontend is static HTML/CSS/JS. No build process required. You can serve it using any static file server.

### Step 5: Firebase Service Account
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Save the JSON file as `firebase-service-account.json` in the `backend` directory
4. Update the `.env` file with the credentials from the JSON file

### Step 6: Run the Application
```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Serve frontend (using Live Server or similar)
# Open frontend/public/index.html in your browser
```

The backend will run on `http://localhost:5000` and the frontend on `http://localhost:5500` (or your preferred port).

## 📖 Usage

### 1. Registration & Login
- Navigate to the application homepage
- Click "Sign Up" to create a new account
- Verify your email (if configured)
- Log in with your credentials

### 2. Submit a Project
- Click "Add New Project" from the dashboard
- Fill in project details:
  - Project name
  - Description
  - GitHub repository URL (optional)
  - Technology stack
  - Additional notes
- Click "Analyze with AI"

### 3. View Analysis Results
- The AI will analyze your project and provide:
  - Overall score (0-100)
  - Category-wise scores (Code Quality, Architecture, Documentation, etc.)
  - Strengths and weaknesses
  - Actionable improvement suggestions
  - Technology-specific recommendations

### 4. Manage Projects
- View all your analyzed projects in the dashboard
- Filter and sort projects
- View detailed analysis reports
- Delete projects as needed

## 🔌 API Reference

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/verify` | Verify authentication status | Yes |

### Project Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/projects` | Get all user projects | Yes |
| GET | `/api/projects/:id` | Get specific project | Yes |
| POST | `/api/projects` | Create new project with AI analysis | Yes |
| PUT | `/api/projects/:id` | Update project | Yes |
| DELETE | `/api/projects/:id` | Delete project | Yes |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## 🧪 Testing

Run the test suite:
```bash
cd backend
npm test
```

Test coverage includes:
- API endpoint testing
- Authentication flow
- Project CRUD operations
- AI service mocking

## 🔧 Configuration

### Environment Variables
See the complete list of environment variables in `backend/.env.example` (create one if needed).

### CORS Configuration
Configure allowed origins in the `FRONTEND_URL` environment variable:
```env
FRONTEND_URL=http://localhost:5500,http://localhost:3000,https://yourdomain.com
```

### Rate Limiting
Default rate limit: 100 requests per 15 minutes per IP. Adjust in `server.js`:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // Adjust this value
});
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new functionality
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for powerful AI capabilities
- [Firebase](https://firebase.google.com/) for authentication and database
- [Express.js](https://expressjs.com/) for the robust backend framework
- All contributors and users of Projectify-AI

## 📞 Support

For support, feature requests, or bug reports:
- Open an issue on GitHub
- Email: support@projectify-ai.com
- Join our Discord community

---

<div align="center">

Made with ❤️ by the Projectify-AI Team

[![GitHub Stars](https://img.shields.io/github/stars/your-username/projectify-ai?style=social)](https://github.com/your-username/projectify-ai)
[![GitHub Forks](https://img.shields.io/github/forks/your-username/projectify-ai?style=social)](https://github.com/your-username/projectify-ai)

</div>