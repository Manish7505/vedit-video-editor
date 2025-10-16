// Minimal server for Railway - guaranteed to work
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());

// Health check endpoint - MUST be first
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    message: 'Server is healthy'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'VEdit Video Editor is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Start server immediately
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`✅ Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
});

// Handle errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

console.log('📡 Server configuration loaded');
