# 🚀 Deployment Guide - Railway + Vercel

Complete deployment guide for your Video Editor with Python backend.

## 📋 Prerequisites

- GitHub account (free)
- Railway account (sign up with GitHub - $5 free credits)
- Vercel account (sign up with GitHub - free)
- Your code pushed to GitHub

## 🎯 Deployment Steps

### Part 1: Deploy Backend to Railway (5 minutes)

#### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Add Python backend with FFmpeg, MoviePy, Whisper"
git push origin main
```

#### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository
6. Railway will:
   - Auto-detect Python
   - Install dependencies
   - Include FFmpeg automatically
   - Deploy your backend

#### Step 3: Get Your Backend URL
1. Wait for deployment to complete (~2-3 minutes)
2. Click on your service
3. Go to **"Settings"** → **"Domains"**
4. Copy the generated URL (e.g., `https://your-app.railway.app`)

#### Step 4: Test Backend
```bash
# Replace with your Railway URL
curl https://your-app.railway.app/api/health

# Should return:
# {"status":"healthy","services":{"ffmpeg":"available",...}}
```

### Part 2: Deploy Frontend to Vercel (3 minutes)

#### Step 1: Update Frontend Configuration
Edit `.env` or create `.env.production`:
```env
VITE_API_URL=https://your-app.railway.app
VITE_WS_URL=wss://your-app.railway.app/ws
```

Or update `src/config/api.ts`:
```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-app.railway.app',
  WS_URL: 'wss://your-app.railway.app/ws'
}
```

#### Step 2: Push Changes
```bash
git add .
git commit -m "Update API URL for Railway backend"
git push origin main
```

#### Step 3: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Environment Variables**:
     ```
     VITE_API_URL = https://your-app.railway.app
     VITE_WS_URL = wss://your-app.railway.app/ws
     ```
5. Click **"Deploy"**

#### Step 4: Get Your Frontend URL
1. Wait for deployment (~2 minutes)
2. Vercel gives you a URL (e.g., `https://your-app.vercel.app`)
3. Test it in browser

### Part 3: Update CORS (Important!)

#### Update Backend CORS
1. Go to Railway dashboard
2. Click your service → **"Variables"**
3. Add:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Service will auto-redeploy

Or update `python-backend/main.py` locally:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],  # Your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Push changes:
```bash
git add .
git commit -m "Update CORS for production"
git push origin main
```

## ✅ Verify Deployment

### Test Backend
```bash
# Health check
curl https://your-app.railway.app/api/health

# API status
curl https://your-app.railway.app/api/status
```

### Test Frontend
1. Open `https://your-app.vercel.app`
2. Upload a test video
3. Try AI features
4. Generate captions
5. Export video

## 🎯 Final URLs

Your application is now live at:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`
- **API Docs**: `https://your-app.railway.app/docs`

## 💰 Cost Summary

### Railway (Backend)
- **Free Credits**: $5 trial credits
- **Usage**: ~$0.20-0.50 for entire assignment
- **Lasts**: 10-25x longer than assignment period
- **Monthly**: $1-5 after free credits (if you keep it)

### Vercel (Frontend)
- **Cost**: FREE forever
- **Bandwidth**: Unlimited for hobby
- **Builds**: Unlimited

### Total for Assignment
- **$0** (uses Railway free credits)

## 🐛 Common Issues

### Issue 1: CORS Errors
**Problem**: Frontend can't connect to backend

**Solution**:
```python
# Update allow_origins in main.py
allow_origins=["https://your-app.vercel.app", "http://localhost:3000"]
```

### Issue 2: Backend Timeout
**Problem**: Video processing takes too long

**Solution**: Railway has no timeout limits (unlike Vercel). Should work fine.

### Issue 3: File Upload Fails
**Problem**: Large files fail to upload

**Solution**: Check Railway logs. May need to increase timeout or split file.

### Issue 4: Whisper Model Loading
**Problem**: First transcription is slow

**Solution**: First run downloads model (~74MB for base). Subsequent runs are fast.

## 📊 Monitoring

### Railway Dashboard
- View logs: Railway Dashboard → Your Service → Logs
- View metrics: CPU, RAM, Network usage
- View deployments: Deployment history

### Vercel Dashboard
- View deployments: Vercel Dashboard → Your Project
- View analytics: Page views, performance
- View logs: Function logs

## 🔄 Updates & Redeployment

### Update Backend
```bash
# Make changes to python-backend/
git add .
git commit -m "Update backend features"
git push origin main

# Railway auto-deploys from GitHub
```

### Update Frontend
```bash
# Make changes to src/
git add .
git commit -m "Update frontend"
git push origin main

# Vercel auto-deploys from GitHub
```

## 🎓 For Your Assignment Submission

### What to Include:
1. **Live URLs**:
   - Frontend: `https://your-app.vercel.app`
   - Backend: `https://your-app.railway.app`
   - API Docs: `https://your-app.railway.app/docs`

2. **GitHub Repository**:
   - Link to your code
   - Include README with setup instructions

3. **Features to Demonstrate**:
   - Video upload ✅
   - Timeline editing ✅
   - Auto-captions (Whisper) ✅
   - AI chatbot ✅
   - Script generation ✅
   - Video effects ✅
   - Export ✅

4. **Tech Stack**:
   - Frontend: React + TypeScript + Vite
   - Backend: FastAPI + Python
   - Video: FFmpeg + MoviePy
   - AI: Whisper + Hugging Face
   - Deployment: Railway + Vercel

### Demo Script:
1. Open live URL
2. Upload sample video
3. Show timeline editing
4. Generate auto-captions
5. Use AI chatbot
6. Apply video effects
7. Export final video

## 🎉 Success!

Your professional video editor is now deployed and ready for your assignment!

**Frontend**: ✅ Deployed on Vercel (free)
**Backend**: ✅ Deployed on Railway ($5 free credits)
**Total Cost**: ✅ $0 for assignment

---

Need help? Check:
- Railway logs for backend issues
- Vercel logs for frontend issues
- `/api/health` endpoint for backend status
- `/docs` endpoint for API documentation

