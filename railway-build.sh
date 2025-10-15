#!/bin/bash

# Railway build script for VEdit Video Editor
echo "🚀 Starting Railway build process..."

# Install all dependencies including dev dependencies
echo "📦 Installing dependencies..."
npm ci --include=dev

# Build server dependencies
echo "🔧 Building server..."
cd server && npm ci && cd ..

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"
