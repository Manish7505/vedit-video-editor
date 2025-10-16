#!/usr/bin/env node

// Startup script for Railway deployment
console.log('🚀 Starting VEdit Video Editor...');
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('Port:', process.env.PORT || 8080);

// Import and start the simple server
import('./simple-server.js').catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
