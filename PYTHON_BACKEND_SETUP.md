# 🚀 Python Backend Setup Guide

Your video editor now has a professional Python backend with **FastAPI + FFmpeg + MoviePy + Whisper**!

## 🎯 What Was Built

### Backend Features
- ✅ **FastAPI** - Modern Python web framework
- ✅ **FFmpeg** - Professional video processing
- ✅ **MoviePy** - Advanced video effects
- ✅ **Whisper** - Free AI transcription (no API key needed!)
- ✅ **Hugging Face AI** - Free chatbot & script generation
- ✅ **WebSockets** - Real-time collaboration
- ✅ **File Management** - Upload/download videos
- ✅ **Railway Ready** - Deployment configured

### No API Keys Required!
- ❌ No OpenAI API needed
- ❌ No paid services needed
- ✅ 100% free AI features
- ✅ Local AI models (Whisper, GPT-2, DialoGPT)

## 📁 Project Structure

```
vedit/
├── python-backend/              # NEW Python backend
│   ├── main.py                 # FastAPI app
│   ├── requirements.txt        # Dependencies
│   ├── railway.toml           # Railway config
│   ├── routes/                # API endpoints
│   │   ├── health.py
│   │   ├── files.py
│   │   ├── video.py
│   │   └── ai.py
│   ├── services/              # Core services
│   │   ├── video_processor.py # FFmpeg + MoviePy
│   │   ├── whisper_service.py # Transcription
│   │   └── ai_service.py      # AI features
│   └── README.md              # Backend documentation
│
├── src/                        # Your React frontend
│   ├── config/
│   │   └── api.ts            # NEW API configuration
│   └── ...
│
└── server/                     # Old Node.js backend (can keep or remove)
```

## 🚀 Quick Start

### Step 1: Local Development (Optional)

```bash
# Navigate to backend
cd python-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs: http://localhost:8000/docs

### Step 2: Test the Backend

```bash
# Check health
curl http://localhost:8000/api/health

# Upload a video (test)
curl -X POST -F "file=@test-video.mp4" http://localhost:8000/api/files/upload
```

### Step 3: Deploy to Railway

#### Method 1: GitHub Deploy (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Python backend with FFmpeg + MoviePy + Whisper"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub (free $5 credits)
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose your repository
   - Click "Add variables" → Skip (optional)
   - Railway auto-detects Python and deploys!

3. **Get Your URL**
   - After deployment, Railway gives you a URL
   - Example: `https://your-app.railway.app`
   - Copy this URL

#### Method 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd python-backend
railway init

# Deploy
railway up

# Get URL
railway domain
```

### Step 4: Update Frontend

Update your frontend environment variables:

```env
# .env or .env.local
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

### Step 5: Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
vercel

# Production deploy
vercel --prod
```

## 🎬 Complete Architecture

```
┌─────────────────────────────────────┐
│         VERCEL (Frontend)           │
│  https://your-app.vercel.app        │
│  - React UI                         │
│  - Video Editor Interface           │
└──────────────┬──────────────────────┘
               │ API Calls
               ↓
┌─────────────────────────────────────┐
│       RAILWAY (Backend)             │
│  https://your-app.railway.app       │
│  - FastAPI                          │
│  - FFmpeg (video processing)        │
│  - MoviePy (effects)                │
│  - Whisper (transcription)          │
│  - AI (chatbot, scripts)            │
└─────────────────────────────────────┘
```

## 💰 Cost Breakdown

### Railway (Backend)
- **Trial**: $5 free credits
- **Lasts**: 1-3 months for assignment
- **After**: $1-10/month depending on usage
- **Assignment**: Usually FREE (uses trial credits)

### Vercel (Frontend)
- **Always**: FREE
- **No limits** for personal projects

### Total Cost for Assignment
- **$0** (using free credits)

## 🎯 Features Available

### Video Processing
```javascript
// Upload video
const formData = new FormData()
formData.append('file', videoFile)
fetch('https://your-app.railway.app/api/files/upload', {
  method: 'POST',
  body: formData
})

// Trim video
fetch('https://your-app.railway.app/api/video/trim', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input_path: 'uploads/video.mp4',
    start_time: 10,
    end_time: 30
  })
})
```

### AI Features (FREE!)
```javascript
// Generate captions with Whisper
fetch('https://your-app.railway.app/api/video/generate-captions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audio_path: 'uploads/video.mp4'
  })
})

// AI chatbot
fetch('https://your-app.railway.app/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'How do I add fade effects?'
  })
})

// Generate script
fetch('https://your-app.railway.app/api/ai/generate-script', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'video editing tips',
    script_type: 'full'
  })
})
```

## 🐛 Troubleshooting

### Backend not starting
```bash
# Check logs in Railway dashboard
# Or locally:
uvicorn main:app --reload --log-level debug
```

### FFmpeg not found (local only)
```bash
# Install FFmpeg
# Ubuntu/Debian: sudo apt install ffmpeg
# macOS: brew install ffmpeg
# Windows: Download from ffmpeg.org
```

### CORS errors
Make sure your backend allows your frontend URL:
```python
# main.py - Already configured
allow_origins=["*"]  # Update with specific domain in production
```

### File upload fails
Check file size limits and ensure upload directories exist.

## 📚 API Documentation

Once deployed, visit:
- Swagger UI: `https://your-app.railway.app/docs`
- ReDoc: `https://your-app.railway.app/redoc`
- Health Check: `https://your-app.railway.app/api/health`

## 🎓 For Your Assignment

### What to Submit
1. **Live URL**: `https://your-app.vercel.app`
2. **Backend URL**: `https://your-app.railway.app`
3. **GitHub Repo**: Link to your code
4. **Documentation**: This file + README.md

### What to Demonstrate
- ✅ Video upload and processing
- ✅ Timeline editing
- ✅ Auto-caption generation (Whisper)
- ✅ AI chatbot (no API key needed!)
- ✅ Script generation
- ✅ Video effects
- ✅ Export functionality

### Tech Stack to Highlight
- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI + Python
- **Video**: FFmpeg + MoviePy
- **AI**: Whisper + Hugging Face Transformers
- **Deployment**: Vercel + Railway
- **Features**: Real-time collaboration, AI-powered editing

## ✅ Next Steps

1. **Test Locally** (optional)
   ```bash
   cd python-backend
   uvicorn main:app --reload
   ```

2. **Deploy to Railway**
   - Push to GitHub
   - Connect Railway
   - Auto-deploy

3. **Update Frontend**
   - Set `VITE_API_URL` to Railway URL
   - Deploy to Vercel

4. **Test Everything**
   - Upload video
   - Generate captions
   - Use AI chatbot
   - Process videos

5. **Demo to Professor**
   - Show live URL
   - Demonstrate features
   - Explain tech stack

## 🎉 You're Done!

Your professional video editor with FREE AI features is ready for your assignment!

**Questions?** Check `/api/health` endpoint or Railway logs.

---

Built for academic excellence with ❤️

