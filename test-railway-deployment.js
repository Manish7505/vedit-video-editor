#!/usr/bin/env node

// Test script to verify Railway deployment
// Run this locally to test your Railway URL

const https = require('https');
const http = require('http');

// Your actual Railway URL from the dashboard
const RAILWAY_URL = 'https://vedit-video-editor-production.up.railway.app';

console.log('🧪 Testing Railway Deployment...');
console.log('📍 URL:', RAILWAY_URL);

// Test function
function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = `${RAILWAY_URL}${path}`;
    const client = url.startsWith('https') ? https : http;
    
    console.log(`\n🔍 Testing ${description}: ${url}`);
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Status: ${res.statusCode}`);
        console.log(`📄 Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({ status: 'ERROR', error: error.message });
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Timeout');
      req.destroy();
      resolve({ status: 'TIMEOUT' });
    });
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Railway deployment tests...\n');
  
  const tests = [
    { path: '/', description: 'Root Health Check' },
    { path: '/health', description: 'Health Endpoint' },
    { path: '/api/health', description: 'API Health Check' },
    { path: '/api/ai/status', description: 'AI Status' }
  ];
  
  for (const test of tests) {
    await testEndpoint(test.path, test.description);
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('- If all tests show 200 status: ✅ Deployment is working');
  console.log('- If tests show errors: ❌ Check Railway dashboard and logs');
  console.log('- If tests timeout: ❌ Check Railway domain and networking');
}

runTests().catch(console.error);
