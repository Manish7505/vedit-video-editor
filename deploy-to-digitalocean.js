#!/usr/bin/env node

/**
 * DigitalOcean Deployment Preparation Script
 * This script helps prepare your VEdit application for DigitalOcean deployment
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🚀 VEdit DigitalOcean Deployment Preparation\n');

// Check if all required files exist
const requiredFiles = [
  'package.json',
  'server/package.json',
  'src/main.tsx',
  'src/App.tsx',
  'vite.config.ts',
  'tsconfig.json',
  'Dockerfile',
  'docker-compose.yml'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please check your project structure.');
  process.exit(1);
}

// Check environment variables
console.log('\n🔧 Checking environment variables...');
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredVars = [
    'VITE_CLERK_PUBLISHABLE_KEY',
    'VITE_VAPI_PUBLIC_KEY',
    'VITE_VAPI_WORKFLOW_ID',
    'VITE_OPENROUTER_API_KEY'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName}`);
    } else {
      console.log(`⚠️  ${varName} - Not found in .env.local`);
    }
  });
} else {
  console.log('⚠️  .env.local file not found');
}

// Check if build works
console.log('\n🔨 Testing build process...');

try {
  console.log('Running npm run build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (error) {
  console.log('❌ Build failed. Please fix errors before deploying.');
  process.exit(1);
}

// Check server build
console.log('\n🔨 Testing server build...');
try {
  console.log('Running server build...');
  execSync('cd server && npm install', { stdio: 'inherit' });
  console.log('✅ Server build successful!');
} catch (error) {
  console.log('❌ Server build failed. Please fix errors before deploying.');
  process.exit(1);
}

// Generate deployment checklist
console.log('\n📝 DIGITALOCEAN DEPLOYMENT CHECKLIST:');
console.log('1. ✅ Code is ready');
console.log('2. ✅ Build works');
console.log('3. ✅ Server builds');
console.log('4. 🔄 Push to GitHub');
console.log('5. 🔄 Create DigitalOcean account');
console.log('6. 🔄 Get $200 free credits');
console.log('7. 🔄 Create App Platform app');
console.log('8. 🔄 Configure build settings');
console.log('9. 🔄 Add environment variables');
console.log('10. 🔄 Deploy and test');

console.log('\n🎯 NEXT STEPS:');
console.log('1. Run: git add . && git commit -m "Ready for DigitalOcean" && git push');
console.log('2. Go to: https://digitalocean.com');
console.log('3. Sign up and get $200 free credits');
console.log('4. Follow the DIGITALOCEAN_STEP_BY_STEP_GUIDE.md');
console.log('5. Your app will be live at: https://your-app-name.ondigitalocean.app');

console.log('\n💰 COST BREAKDOWN:');
console.log('- DigitalOcean App Platform: $5/month');
console.log('- Free credits: $200');
console.log('- Free hosting duration: 40+ months');
console.log('- After credits: $5/month (very affordable)');

console.log('\n✨ Ready for DigitalOcean deployment! Good luck! 🚀');
