#!/usr/bin/env node

// Start script for Railway deployment
// This avoids the 'cd' command issue in containers

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting VEdit Backend Server...');
console.log('📁 Working directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', process.env.PORT || '8080');

// Change to server directory
const serverDir = path.join(process.cwd(), 'server');
console.log('📁 Server directory:', serverDir);

try {
  process.chdir(serverDir);
  console.log('📁 Changed to server directory:', process.cwd());
} catch (err) {
  console.error('❌ Failed to change to server directory:', err);
  process.exit(1);
}

// Start the server
console.log('🔄 Starting server with npm start...');
const serverProcess = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '8080'
  }
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