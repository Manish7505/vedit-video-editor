#!/usr/bin/env node

// Test script to verify server works
import http from 'http';

console.log('🧪 Testing minimal server...');

const testServer = () => {
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Health check response: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Response:', response);
        console.log('🎉 Server is working correctly!');
        process.exit(0);
      } catch (error) {
        console.log('❌ Invalid JSON response:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (err) => {
    console.log(`❌ Health check failed: ${err.message}`);
    console.log('💡 Make sure the server is running on port 8080');
    process.exit(1);
  });

  req.on('timeout', () => {
    console.log('❌ Health check timed out');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

// Wait a moment for server to start, then test
setTimeout(testServer, 2000);
