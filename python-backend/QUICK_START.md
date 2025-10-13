# ⚡ Quick Start - Python Backend

Get your video editor backend running in 5 minutes!

## 🚀 Option 1: Deploy to Railway (Recommended for Assignment)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Python backend"
git push origin main
```

### Step 2: Deploy
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub (get $5 free credits)
3. Click "New Project" → "Deploy from GitHub"
4. Select your repo
5. Railway auto-deploys! ✅

### Step 3: Get URL
- Copy your Railway URL: `https://your-app.railway.app`
- Test: `https://your-app.railway.app/api/health`

### Step 4: Update Frontend
```env
# .env
VITE_API_URL=https://your-app.railway.app
```

## 🏠 Option 2: Run Locally (Testing)

### Prerequisites
- Python 3.10+
- FFmpeg (Railway includes it, local needs manual install)

### Steps
```bash
# 1. Navigate to backend
cd python-backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create directories
mkdir uploads processed temp

# 5. Run server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000

## 📡 Test Your Backend

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Upload Test Video
```bash
curl -X POST -F "file=@test.mp4" http://localhost:8000/api/files/upload
```

### API Documentation
- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## ✅ Features Available

- ✅ Video processing (FFmpeg + MoviePy)
- ✅ Auto-captions (Whisper) - FREE!
- ✅ AI chatbot (DialoGPT) - FREE!
- ✅ Script generation (GPT-2) - FREE!
- ✅ Real-time WebSocket
- ✅ File management

## 💡 Tips

### For Assignment
- Use Railway (free $5 credits)
- Deploy takes 2-3 minutes
- FFmpeg included automatically
- Perfect for demos

### For Development
- Run locally for faster iteration
- Use `--reload` flag for hot reload
- Check logs in terminal

## 🐛 Quick Troubleshooting

### FFmpeg not found (local only)
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

### Port already in use
```bash
# Use different port
uvicorn main:app --port 8001
```

### Dependencies fail
```bash
# Update pip first
pip install --upgrade pip
pip install -r requirements.txt
```

## 📚 Next Steps

1. ✅ Backend running
2. Update frontend API URL
3. Deploy frontend to Vercel
4. Test all features
5. Demo to professor!

## 🎯 For Your Assignment

**Railway Deployment**: Perfect choice!
- Cost: $0 (free credits)
- Time: 5 minutes
- Features: All work perfectly
- Demo: Professional live URL

Ready to go! 🚀

