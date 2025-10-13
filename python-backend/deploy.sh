#!/bin/bash
# Railway deployment script

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Building frontend..."
cd ..
npm install
npm run build

echo "Starting server..."
cd python-backend
uvicorn main:app --host 0.0.0.0 --port $PORT
