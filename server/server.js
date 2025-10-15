const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const fileRoutes = require('./routes/files');
const aiRoutes = require('./routes/ai');
const renderRoutes = require('./routes/render');
const renderQueueRoutes = require('./routes/renderQueue');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
// Clerk authentication removed

// Import database
const connectDB = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Removed proxy static mount

// Routes
// Note: auth routes are no longer needed with Clerk
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ai', aiRoutes);
// Static hosting for rendered files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Mount render routes so POST /api/render works
app.use('/api', renderRoutes);
app.use('/api', renderQueueRoutes);
// Removed API proxy routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /api/health',
      'POST /api/ai/chat',
      'POST /api/ai/execute-command',
      'GET /api/ai/status',
      'POST /api/ai/suggestions',
      'GET /api/users/profile',
      'GET /api/projects',
      'POST /api/projects',
      'GET /api/files',
      'POST /api/files/upload'
    ]
  });
});

const PORT = Number(process.env.PORT || 5000);
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3003"}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
