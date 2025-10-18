# Railway Deployment Guide

## Quick Deployment Steps

### 1. Prepare Repository
- ✅ Dockerfile created
- ✅ railway.json configured
- ✅ Dependencies installed
- ✅ .railwayignore created

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `vedit` repository
6. Railway will auto-detect Node.js

### 3. Configure Environment Variables
Add these in Railway dashboard → Variables:

```
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://your-vercel-app.vercel.app
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
```

**Note:** Replace `https://your-vercel-app.vercel.app` with your actual Vercel URL after you deploy the frontend.

### 4. Deploy
- Click "Deploy"
- Wait for build to complete
- Get your backend URL: `https://your-app-name.railway.app`

### 5. Test Your Backend
Test these endpoints:
- `GET https://your-app-name.railway.app/` - Health check
- `GET https://your-app-name.railway.app/api/health` - API health
- `GET https://your-app-name.railway.app/api/ai/status` - AI status

## Backend Features Available
- ✅ AI Chat API (`/api/ai/chat`)
- ✅ AI Commands (`/api/ai/execute-command`)
- ✅ AI Status (`/api/ai/status`)
- ✅ AI Suggestions (`/api/ai/suggestions`)
- ✅ Video Rendering (`/api/render`)
- ✅ Health Checks (`/`, `/health`, `/api/health`)

## Next Steps
1. Deploy backend to Railway
2. Get the Railway URL
3. Update frontend to use Railway URL
4. Deploy frontend to Vercel
5. Add auto caption features
