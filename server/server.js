const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Define PORT early to avoid reference errors
const PORT = Number(process.env.PORT || 8080);

// Import routes
const aiRoutes = require('./routes/ai');
const renderRoutes = require('./routes/render');
const renderQueueRoutes = require('./routes/renderQueue');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
// Clerk authentication removed

// Database connection removed - using file-based storage

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? true : (process.env.FRONTEND_URL || "http://localhost:3000"),
    methods: ["GET", "POST"]
  }
});

// Database connection removed - using file-based storage

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : (process.env.FRONTEND_URL || "http://localhost:3000"),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../dist')));

// Routes
// Note: auth routes are no longer needed with Clerk
app.use('/api/ai', aiRoutes);

// Root health check endpoint (backup for Railway)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT,
    service: 'VEdit Full-Stack Application'
  });
});

// Mount render routes so POST /api/render works
app.use('/api', renderRoutes);
app.use('/api', renderQueueRoutes);
// Removed API proxy routes

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT
  });
});

// Root health check for Railway
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'VEdit Video Editor API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT
  });
});

// Socket.io for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join project room
  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  // Leave project room
  socket.on('leave-project', (projectId) => {
    socket.leave(projectId);
    console.log(`User ${socket.id} left project ${projectId}`);
  });

  // Real-time video editing events
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

// Error handling
app.use(errorHandler);

// SPA fallback - serve React app for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      message: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method,
      availableRoutes: [
        'GET /api/health',
        'POST /api/ai/chat',
        'POST /api/ai/execute-command',
        'GET /api/ai/status',
        'POST /api/ai/suggestions',
        'POST /api/files/upload'
      ]
    });
  }
  
  // Serve React app for all other routes
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Debug port information
console.log('🔍 Port Configuration Debug:');
console.log('PORT environment variable:', process.env.PORT);
console.log('Calculated PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server with error handling
server.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3003"}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check available at: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Public URL should be accessible via Railway domain`);
  console.log(`✅ Server is ready to accept connections`);
});

module.exports = { app, io };
