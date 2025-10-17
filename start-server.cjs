#!/usr/bin/env node

// Start script for Railway deployment
// This serves both frontend and backend together

const express = require('express');
const path = require('path');
require('dotenv').config();

console.log('🚀 Starting VEdit Full Stack Application...');
console.log('📁 Working directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🔌 Port:', process.env.PORT || '8080');
console.log('🔑 OpenRouter API Key:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the dist directory (built frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// Import and use backend routes (with error handling)
let aiRoutes, renderRoutes, renderQueueRoutes, errorHandler;

try {
  aiRoutes = require('./server/routes/ai');
  renderRoutes = require('./server/routes/render');
  renderQueueRoutes = require('./server/routes/renderQueue');
  errorHandler = require('./server/middleware/errorHandler');
  console.log('✅ Backend routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load backend routes:', error.message);
  // Create fallback routes
  aiRoutes = express.Router();
  renderRoutes = express.Router();
  renderQueueRoutes = express.Router();
  errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  };
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API routes
app.use('/api/ai', aiRoutes);
app.use('/api/render', renderRoutes);
app.use('/api/render-queue', renderQueueRoutes);

// Root endpoint for Railway health checks
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'VEdit Video Editor is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Health check endpoint (simple, no dependencies)
app.get('/api/health', (req, res) => {
  try {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      port: PORT,
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Frontend served from /dist`);
  console.log(`🔗 API available at /api/*`);
  console.log(`❤️ Health check at /api/health`);
  console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? 'CONFIGURED' : 'MISSING'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
