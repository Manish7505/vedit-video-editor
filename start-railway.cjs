#!/usr/bin/env node

// Railway-optimized start script for VEdit
// This script ensures full functionality while handling Railway deployment requirements

const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

console.log('🚀 Starting VEdit Railway Deployment...');
console.log('📁 Working directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🔌 Port:', process.env.PORT || '8080');
console.log('🔑 OpenRouter API Key:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// Initialize Socket.IO with Railway-friendly configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? true : (process.env.FRONTEND_URL || "http://localhost:3000"),
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration for Railway
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

// Serve static files from the dist directory (built frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'server/uploads')));

// Import and use backend routes with comprehensive error handling
let aiRoutes, renderRoutes, renderQueueRoutes, errorHandler;

try {
  console.log('📦 Loading backend routes...');
  
  // Load routes with error handling
  aiRoutes = require('./server/routes/ai');
  console.log('✅ AI routes loaded');
  
  renderRoutes = require('./server/routes/render');
  console.log('✅ Render routes loaded');
  
  renderQueueRoutes = require('./server/routes/renderQueue');
  console.log('✅ Render queue routes loaded');
  
  errorHandler = require('./server/middleware/errorHandler');
  console.log('✅ Error handler loaded');
  
  console.log('✅ All backend routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load backend routes:', error.message);
  console.error('Stack trace:', error.stack);
  
  // Create fallback routes to prevent server crash
  aiRoutes = express.Router();
  renderRoutes = express.Router();
  renderQueueRoutes = express.Router();
  
  // Fallback AI routes
  aiRoutes.get('/status', (req, res) => {
    res.json({
      available: false,
      error: 'Backend routes failed to load',
      timestamp: new Date().toISOString()
    });
  });
  
  aiRoutes.post('/chat', (req, res) => {
    res.status(503).json({
      error: 'AI service temporarily unavailable',
      message: 'Backend routes failed to load'
    });
  });
  
  // Fallback error handler
  errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Backend routes failed to load'
    });
  };
  
  console.log('⚠️ Using fallback routes - some functionality may be limited');
}

// API routes
app.use('/api/ai', aiRoutes);
app.use('/api/render', renderRoutes);
app.use('/api/render-queue', renderQueueRoutes);

// Socket.io for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(projectId);
    console.log(`User ${socket.id} left project ${projectId}`);
  });

  socket.on('timeline-update', (data) => {
    socket.to(data.projectId).emit('timeline-update', data);
  });

  socket.on('playhead-move', (data) => {
    socket.to(data.projectId).emit('playhead-move', data);
  });

  socket.on('clip-edit', (data) => {
    socket.to(data.projectId).emit('clip-edit', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Root endpoint for Railway health checks
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'VEdit Video Editor is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT,
    uptime: process.uptime(),
    features: {
      ai: !!aiRoutes,
      render: !!renderRoutes,
      websocket: true
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      port: PORT,
      uptime: process.uptime(),
      features: {
        ai: !!aiRoutes,
        render: !!renderRoutes,
        websocket: true
      }
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

// Simple status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'VEdit API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT,
    features: {
      ai: !!aiRoutes,
      render: !!renderRoutes,
      websocket: true
    }
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const serverInstance = server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ VEdit Server running on port ${PORT}`);
  console.log(`🌐 Frontend served from /dist`);
  console.log(`🔗 API available at /api/*`);
  console.log(`❤️ Health check at /`);
  console.log(`📊 Status check at /api/status`);
  console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`🎯 Features: AI=${!!aiRoutes}, Render=${!!renderRoutes}, WebSocket=true`);
});

// Handle server errors
serverInstance.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  serverInstance.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  serverInstance.close(() => {
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
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
