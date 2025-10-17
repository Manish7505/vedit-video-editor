#!/usr/bin/env node

// Test script to verify Railway deployment
// Run this locally to test your Railway URL

import https from 'https';
import http from 'http';

// Your actual Railway URL from the dashboard
const RAILWAY_URL = 'https://vedit-video-editor-production.up.railway.app';

console.log('🧪 Testing Railway Deployment...');
console.log('📍 URL:', RAILWAY_URL);
console.log('🚀 Starting Railway deployment tests...\n');

const testEndpoint = (url, description) => {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      console.log(`\n🔍 Testing ${description}: ${url}`);
      console.log('❌ Timeout: Request took too long');
      resolve(null);
    }, 10000); // 10 second timeout

    client.get(url, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`\n🔍 Testing ${description}: ${url}`);
        console.log(`✅ Status: ${res.statusCode}`);
        console.log(`📊 Headers:`, {
          'content-type': res.headers['content-type'],
          'content-length': res.headers['content-length'],
          'server': res.headers['server']
        });
        
        try {
          const jsonResponse = JSON.parse(data);
          console.log('📄 JSON Response:', JSON.stringify(jsonResponse, null, 2));
        } catch (e) {
          console.log('📄 Raw Response (first 200 chars):', data.substring(0, 200));
        }
        resolve(res.statusCode);
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      console.log(`\n🔍 Testing ${description}: ${url}`);
      console.error('❌ Error:', err.message);
      if (err.code === 'ENOTFOUND') {
        console.error('💡 DNS Error: Domain not found. Check Railway domain configuration.');
      } else if (err.code === 'ECONNREFUSED') {
        console.error('💡 Connection Refused: Server is not running or not accessible.');
      } else if (err.code === 'ETIMEDOUT') {
        console.error('💡 Timeout: Server is not responding.');
      }
      resolve(null);
    });
  });
};

const runTests = async () => {
  console.log('🔬 Running comprehensive Railway deployment tests...\n');
  
  const results = await Promise.all([
    testEndpoint(`${RAILWAY_URL}/`, 'Root Health Check'),
    testEndpoint(`${RAILWAY_URL}/health`, 'Health Endpoint'),
    testEndpoint(`${RAILWAY_URL}/api/health`, 'API Health Check'),
    testEndpoint(`${RAILWAY_URL}/api/ai/status`, 'AI Status Endpoint')
  ]);

  console.log('\n🎯 Test Summary:');
  console.log('================');
  
  const tests = [
    { name: 'Root Health Check', result: results[0] },
    { name: 'Health Endpoint', result: results[1] },
    { name: 'API Health Check', result: results[2] },
    { name: 'AI Status Endpoint', result: results[3] }
  ];

  tests.forEach(test => {
    if (test.result === 200) {
      console.log(`✅ ${test.name}: Working (200)`);
    } else if (test.result === null) {
      console.log(`❌ ${test.name}: Failed (No response)`);
    } else {
      console.log(`⚠️  ${test.name}: Partial (${test.result})`);
    }
  });

  console.log('\n📋 Diagnosis:');
  console.log('==============');
  
  if (results.every(r => r === 200)) {
    console.log('🎉 All tests passed! Your Railway deployment is working correctly.');
    console.log('💡 If you still see "can\'t reach this page", try:');
    console.log('   - Clear your browser cache');
    console.log('   - Try a different browser');
    console.log('   - Check if your firewall is blocking the connection');
  } else if (results.every(r => r === null)) {
    console.log('🚨 All tests failed! Your Railway deployment is not accessible.');
    console.log('💡 Check Railway dashboard for:');
    console.log('   - Deployment status (should be green)');
    console.log('   - Build logs for errors');
    console.log('   - Runtime logs for startup issues');
    console.log('   - Environment variables configuration');
  } else {
    console.log('⚠️  Some tests failed. Your deployment is partially working.');
    console.log('💡 Check Railway dashboard for specific errors.');
  }

  console.log('\n🔗 Useful Links:');
  console.log('================');
  console.log('Railway Dashboard: https://railway.app/dashboard');
  console.log('Your App URL:', RAILWAY_URL);
  console.log('Troubleshooting Guide: See RAILWAY_TROUBLESHOOTING.md');
};

runTests().catch(console.error);