#!/usr/bin/env node

// Start script for Railway deployment
// This avoids the 'cd' command issue in containers

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting VEdit Backend Server...');
console.log('📁 Working directory:', process.cwd());
console.log('📁 Server directory:', path.join(process.cwd(), 'server'));

// Change to server directory and start
process.chdir(path.join(process.cwd(), 'server'));

console.log('📁 New working directory:', process.cwd());

// Start the server
const serverProcess = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`🔄 Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  serverProcess.kill('SIGINT');
});