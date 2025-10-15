# 🚀 Railway Deployment Guide

## Quick Deploy (5 minutes)

### 1. Go to Railway
- Visit: https://railway.app
- Click "Start a New Project"
- Sign up with GitHub

### 2. Deploy Your Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Find: `Manish7505/vedit-video-editor`
- Click "Deploy Now"

### 3. Add Environment Variables
In Railway dashboard → Variables tab:

**Frontend Variables:**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2FyZWZ1bC1tb2xlLTEuY2xlcmsuYWNjb3VudHMuZGV2JA
VITE_VAPI_PUBLIC_KEY=5d37cef6-c8d8-4903-a318-157d89551cf2
VITE_VAPI_WORKFLOW_ID=140b60c3-088a-4fd5-98b4-6dcb9817d0d5
VITE_VAPI_VIDEO_PUBLIC_KEY=5d37cef6-c8d8-4903-a318-157d89551cf2
VITE_VAPI_VIDEO_WORKFLOW_ID=140b60c3-088a-4fd5-98b4-6dcb9817d0d5
VITE_VAPI_VIDEO_ASSISTANT_ID=179a4347-ff8d-4f5b-bd4b-c83f7d13e489
VITE_OPENROUTER_API_KEY=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
```

**Backend Variables:**
```
NODE_ENV=production
PORT=8080
CLERK_SECRET_KEY=sk_test_6tU55JHiIOcCGUaP3O667JN3RJTZ8RT8ZSHCPD9MnN
MONGODB_URI=mongodb://localhost:27017/vedit
```

### 4. Wait for Deployment
- Railway will automatically build and deploy
- Takes 5-10 minutes
- You'll get a live URL

### 5. Test Everything
- ✅ VAPI assistants
- ✅ File upload
- ✅ Video export with FFmpeg
- ✅ All AI features

## What You Get:
- ✅ Full FFmpeg support
- ✅ No sleep mode
- ✅ Professional hosting
- ✅ $5 free credits
- ✅ $5/month after credits

## Your Repository is Ready!
All configuration files are included:
- `railway.json` - Railway deployment config
- `nixpacks.toml` - FFmpeg and build config
- `package.json` - Start scripts configured

Just follow the 5 steps above! 🚀
