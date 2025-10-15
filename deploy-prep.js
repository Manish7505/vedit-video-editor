#!/usr/bin/env node

/**
 * Deployment Preparation Script
 * This script helps prepare your VEdit application for deployment
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 VEdit Deployment Preparation\n');

// Check if all required files exist
const requiredFiles = [
  'package.json',
  'server/package.json',
  'src/main.tsx',
  'src/App.tsx',
  'vite.config.ts',
  'tsconfig.json'
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

// Generate deployment checklist
console.log('\n📝 DEPLOYMENT CHECKLIST:');
console.log('1. ✅ Code is ready');
console.log('2. ✅ Build works');
console.log('3. 🔄 Push to GitHub');
console.log('4. 🔄 Create Render.com account');
console.log('5. 🔄 Deploy backend service');
console.log('6. 🔄 Deploy frontend service');
console.log('7. 🔄 Add environment variables');
console.log('8. 🔄 Test deployment');

console.log('\n🎯 NEXT STEPS:');
console.log('1. Run: git add . && git commit -m "Ready for deployment" && git push');
console.log('2. Go to: https://render.com');
console.log('3. Follow the DEPLOYMENT_GUIDE.md instructions');
console.log('4. Your app will be live at: https://your-app-name.onrender.com');

console.log('\n✨ Ready for deployment! Good luck! 🚀');
