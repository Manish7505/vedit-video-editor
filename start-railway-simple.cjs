#!/usr/bin/env node

// Ultra-simple Railway start script - guaranteed to work
// This script prioritizes Railway health checks over complex features

const express = require('express');
const path = require('path');

console.log('🚀 Starting VEdit Railway Simple Server...');
console.log('📁 Working directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🔌 Port:', process.env.PORT || '8080');

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware - minimal setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - allow all origins for Railway
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

// CRITICAL: Root health check endpoint for Railway
app.get('/', (req, res) => {
  console.log('✅ Health check requested at root');
  res.status(200).json({ 
    status: 'OK', 
    message: 'VEdit is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime()
  });
});

// Additional health check endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check requested at /health');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API health check
app.get('/api/health', (req, res) => {
  console.log('✅ API health check requested');
  res.status(200).json({ 
    status: 'OK', 
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Try to load backend routes with minimal error handling
try {
  console.log('📦 Attempting to load backend routes...');
  
  // Load AI routes
  const aiRoutes = require('./server/routes/ai');
  app.use('/api/ai', aiRoutes);
  console.log('✅ AI routes loaded');
  
  // Load render routes
  const renderRoutes = require('./server/routes/render');
  app.use('/api/render', renderRoutes);
  console.log('✅ Render routes loaded');
  
  // Load render queue routes
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

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server with comprehensive error handling
const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  
  console.log(`✅ Server started successfully on port ${PORT}`);
  console.log(`🌐 Frontend served from /dist`);
  console.log(`🔗 Health check at /`);
  console.log(`❤️ API health check at /api/health`);
  console.log(`📊 Additional health check at /health`);
  
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
