const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());

// Custom CORS middleware - adds headers to ALL responses
app.use((req, res, next) => {
  // Determine allowed origins
  let allowedOrigins = [];
  
  if (process.env.FRONTEND_URL) {
    allowedOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
  } else if (process.env.NODE_ENV === 'production') {
    allowedOrigins = ['https://projectify-ai.netlify.app'];
  } else {
    allowedOrigins = ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5000', 'http://127.0.0.1:5000'];
  }
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// CORS configuration for the cors package (as backup)
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    // Determine allowed origins (same logic as above)
    let allowedOrigins = [];
    
    if (process.env.FRONTEND_URL) {
      allowedOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    } else if (process.env.NODE_ENV === 'production') {
      allowedOrigins = ['https://projectify-ai.netlify.app'];
    } else {
      allowedOrigins = ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5000', 'http://127.0.0.1:5000'];
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// Apply CORS middleware as backup
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Projectify-AI Backend'
  });
});

// API routes will be added here
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/projects', require('./src/routes/projectRoutes'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist on this server`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Server is active on http://127.0.0.1:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
