#!/usr/bin/env node

// Deployment verification script
import fs from 'fs';
import path from 'path';

console.log('🔍 VEdit Video Editor - Deployment Verification');
console.log('================================================');

const requiredFiles = [
  'package.json',
  'server/package.json',
  'server/server.js',
  'src/App.tsx',
  'src/pages/VideoEditor.tsx',
  'src/pages/HomePage.tsx',
  'railway.json',
  'nixpacks.toml',
  'Dockerfile'
];

console.log('\n📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'start', 'dev'];

requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`❌ ${script} - MISSING`);
    allFilesExist = false;
  }
});

// Check server configuration
console.log('\n🔧 Checking server configuration...');
const serverCode = fs.readFileSync('server/server.js', 'utf8');

if (serverCode.includes('app.get(\'/\'')) {
  console.log('✅ Root health check endpoint');
} else {
  console.log('❌ Root health check endpoint - MISSING');
  allFilesExist = false;
}

if (serverCode.includes('app.get(\'/api/health\'')) {
  console.log('✅ API health check endpoint');
} else {
  console.log('❌ API health check endpoint - MISSING');
  allFilesExist = false;
}

if (serverCode.includes('server.listen(PORT, \'0.0.0.0\'')) {
  console.log('✅ Server binds to 0.0.0.0 (Docker compatible)');
} else {
  console.log('❌ Server binding - NOT DOCKER COMPATIBLE');
  allFilesExist = false;
}

// Check Railway configuration
console.log('\n🚂 Checking Railway configuration...');
if (fs.existsSync('railway.json')) {
  const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
  if (railwayConfig.deploy.healthcheckPath) {
    console.log(`✅ Health check path: ${railwayConfig.deploy.healthcheckPath}`);
  }
  if (railwayConfig.deploy.healthcheckTimeout) {
    console.log(`✅ Health check timeout: ${railwayConfig.deploy.healthcheckTimeout}s`);
  }
}

// Check Nixpacks configuration
console.log('\n📦 Checking Nixpacks configuration...');
if (fs.existsSync('nixpacks.toml')) {
  const nixpacksConfig = fs.readFileSync('nixpacks.toml', 'utf8');
  if (nixpacksConfig.includes('ffmpeg')) {
    console.log('✅ FFmpeg included in build');
  }
  if (nixpacksConfig.includes('npm install --include=dev')) {
    console.log('✅ Dev dependencies included');
  }
}

// Final result
console.log('\n🎯 DEPLOYMENT READINESS:');
if (allFilesExist) {
  console.log('✅ READY FOR DEPLOYMENT!');
  console.log('\n🚀 Next steps:');
  console.log('1. Go to https://railway.app');
  console.log('2. Deploy from GitHub repo: Manish7505/vedit-video-editor');
  console.log('3. Add environment variables');
  console.log('4. Wait for deployment to complete');
  console.log('\n🎉 Your professional video editor will be live!');
} else {
  console.log('❌ NOT READY - Fix missing files first');
  process.exit(1);
}
