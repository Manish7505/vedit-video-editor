#!/usr/bin/env node

// Local development start script - runs on localhost
// This script is optimized for local development

const express = require('express');
const path = require('path');

console.log('🚀 Starting VEdit Local Development Server...');
console.log('📁 Working directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', process.env.PORT || '8080');

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for local development
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

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoints
app.get('/', (req, res) => {
  console.log('✅ Health check requested at root');
  res.status(200).json({ 
    status: 'OK', 
    message: 'VEdit Local Development Server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime(),
    environment: 'development'
  });
});

app.get('/health', (req, res) => {
  console.log('✅ Health check requested at /health');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/health', (req, res) => {
  console.log('✅ API health check requested');
  res.status(200).json({ 
    status: 'OK', 
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Try to load backend routes
try {
  console.log('📦 Attempting to load backend routes...');
  
  const aiRoutes = require('./server/routes/ai');
  app.use('/api/ai', aiRoutes);
  console.log('✅ AI routes loaded');
  
  const renderRoutes = require('./server/routes/render');
  app.use('/api/render', renderRoutes);
  console.log('✅ Render routes loaded');
  
  const renderQueueRoutes = require('./server/routes/renderQueue');
  app.use('/api/render-queue', renderQueueRoutes);
  console.log('✅ Render queue routes loaded');
  
  console.log('✅ All backend routes loaded successfully');
  
} catch (error) {
  console.error('⚠️ Backend routes failed to load:', error.message);
  console.log('⚠️ Continuing with frontend-only mode');
  
  // Fallback API endpoints
  app.get('/api/ai/status', (req, res) => {
    res.json({
      available: false,
      message: 'Backend routes not loaded',
      timestamp: new Date().toISOString()
    });
  });
}

// Specific routes for common paths
app.get('/video-editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Handle 404 for unknown routes
app.use((req, res) => {
  // If it's an API route, return JSON 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      message: 'API endpoint not found',
      path: req.originalUrl 
    });
  }
  
  // For all other routes, serve the React app
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server on localhost
const server = app.listen(PORT, 'localhost', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  
  console.log(`✅ Local Development Server started successfully on localhost:${PORT}`);
  console.log(`🌐 Frontend served from /dist`);
  console.log(`🔗 Health check at http://localhost:${PORT}/`);
  console.log(`❤️ API health check at http://localhost:${PORT}/api/health`);
  console.log(`🎯 Open your browser to: http://localhost:${PORT}`);
  
  // Test health check immediately
  setTimeout(() => {
    console.log('🧪 Testing health check...');
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      console.log(`✅ Health check test: ${res.statusCode}`);
    });
    
    req.on('error', (err) => {
      console.error('❌ Health check test failed:', err.message);
    });
    
    req.end();
  }, 1000);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});
