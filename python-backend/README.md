# VEdit AI Video Editor - Python Backend

Professional video editing platform backend built with **FastAPI + FFmpeg + MoviePy + Whisper**.

## 🚀 Features

### Video Processing
- ✅ **FFmpeg Integration** - Professional video manipulation
- ✅ **MoviePy Effects** - Advanced video effects and transitions
- ✅ **Format Conversion** - Convert between all video formats
- ✅ **Video Compression** - Optimize file sizes
- ✅ **Audio Extraction** - Extract audio from videos
- ✅ **Video Merging** - Combine multiple videos
- ✅ **Speed Control** - Change playback speed
- ✅ **Volume Adjustment** - Control audio levels
- ✅ **Fade Effects** - Add fade in/out transitions

### AI Features (FREE - No API Keys Required!)
- ✅ **Auto Captions** - Whisper-powered transcription
- ✅ **AI Chatbot** - DialoGPT conversational assistant
- ✅ **Script Generation** - GPT-2 powered script writing
- ✅ **Title Generation** - AI-generated video titles
- ✅ **Brainstorming** - Creative video idea generation
- ✅ **SRT Subtitles** - Generate subtitle files

### Infrastructure
- ✅ **FastAPI** - Modern, fast web framework
- ✅ **Uvicorn** - High-performance ASGI server
- ✅ **WebSockets** - Real-time collaboration
- ✅ **File Upload** - Handle large video files
- ✅ **CORS** - Frontend integration ready

## 📋 Requirements

- Python 3.10+
- FFmpeg (included on Railway)
- 1GB+ RAM recommended
- 1 CPU core minimum

## 🛠️ Installation

### Local Development

```bash
# Clone the repository
cd python-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create uploads directories
mkdir uploads processed temp

# Run the server
uvicorn main:app --reload --port 8000
```

### Environment Variables

Create a `.env` file (copy from `env.example`):

```env
PORT=8000
FRONTEND_URL=http://localhost:3000
WHISPER_MODEL=base
```

## 🚂 Railway Deployment

### One-Click Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Python backend"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose your repository
   - Select `python-backend` directory
   - Railway auto-detects Python and deploys!

3. **Configure Environment**
   - Add environment variables in Railway dashboard
   - Set `FRONTEND_URL` to your frontend URL
   - Railway automatically sets `PORT`

4. **Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add custom domain
   - Update DNS settings

### Railway Configuration

The `railway.toml` file handles deployment:

```toml
[build]
builder = "nixpacks"  # Includes FFmpeg automatically

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/api/health"
```

## 📡 API Endpoints

### Health & Status
```
GET  /api/health          - Health check
GET  /api/status          - API status
```

### File Management
```
POST   /api/files/upload          - Upload single file
POST   /api/files/upload-multiple - Upload multiple files
GET    /api/files/list            - List uploaded files
DELETE /api/files/delete/{filename} - Delete file
```

### Video Processing
```
POST /api/video/trim           - Trim video
POST /api/video/merge          - Merge videos
POST /api/video/speed          - Change speed
POST /api/video/volume         - Adjust volume
POST /api/video/fade           - Add fade effects
POST /api/video/resize         - Resize video
POST /api/video/extract-audio  - Extract audio
POST /api/video/convert        - Convert format
POST /api/video/compress       - Compress video
GET  /api/video/info           - Get video info
```

### AI & Transcription
```
POST /api/video/transcribe        - Transcribe audio
POST /api/video/generate-captions - Generate captions
POST /api/video/generate-srt      - Generate SRT file
GET  /api/video/whisper-models    - List Whisper models
POST /api/ai/chat                 - AI chatbot
POST /api/ai/generate-script      - Generate script
POST /api/ai/generate-titles      - Generate titles
POST /api/ai/brainstorm           - Brainstorm ideas
GET  /api/ai/status               - AI status
```

### WebSocket
```
WS /ws - Real-time collaboration
```

## 🎬 Usage Examples

### Upload Video
```javascript
const formData = new FormData()
formData.append('file', videoFile)

const response = await fetch('http://localhost:8000/api/files/upload', {
  method: 'POST',
  body: formData
})

const result = await response.json()
// result.file.url - uploaded file URL
```

### Trim Video
```javascript
const response = await fetch('http://localhost:8000/api/video/trim', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input_path: 'uploads/video.mp4',
    start_time: 10.0,
    end_time: 30.0
  })
})

const result = await response.json()
// result.url - processed video URL
```

### Generate Captions
```javascript
const response = await fetch('http://localhost:8000/api/video/generate-captions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audio_path: 'uploads/video.mp4',
    language: 'en'
  })
})

const result = await response.json()
// result.captions - array of caption objects with timestamps
```

### AI Chat
```javascript
const response = await fetch('http://localhost:8000/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'How do I add fade effects to my video?'
  })
})

const result = await response.json()
// result.response - AI response
```

## 🔧 Development

### Project Structure
```
python-backend/
├── main.py                    # FastAPI app
├── requirements.txt           # Dependencies
├── railway.toml              # Railway config
├── Procfile                  # Process file
├── routes/
│   ├── health.py            # Health endpoints
│   ├── files.py             # File management
│   ├── video.py             # Video processing
│   └── ai.py                # AI features
├── services/
│   ├── video_processor.py   # FFmpeg + MoviePy
│   ├── whisper_service.py   # Whisper transcription
│   └── ai_service.py        # AI features
└── uploads/                 # Uploaded files
    processed/               # Processed videos
    temp/                    # Temporary files
```

### Running Tests
```bash
# Install dev dependencies
pip install pytest httpx

# Run tests
pytest tests/
```

### API Documentation
Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🎯 Performance

### Whisper Models
- **tiny** (39 MB) - Fastest, lowest accuracy
- **base** (74 MB) - Fast, good accuracy (recommended)
- **small** (244 MB) - Medium speed, better accuracy
- **medium** (769 MB) - Slow, great accuracy
- **large** (1550 MB) - Slowest, best accuracy

### Processing Times (Base Model on 1 CPU)
- 5 min video transcription: ~30-60 seconds
- Video trim/cut: ~2-5 seconds
- Video merge (2 clips): ~10-20 seconds
- Format conversion: ~5-15 seconds
- Audio extraction: ~2-5 seconds

## 💰 Cost Estimate

### Railway Deployment
```
Small project (10-20 videos/day):
- Service: 1GB RAM, 1 CPU
- Monthly cost: $1-3
- Usage: ~100 hours/month

Medium project (50-100 videos/day):
- Service: 2GB RAM, 2 CPU  
- Monthly cost: $5-10
- Usage: ~200 hours/month
```

## 🐛 Troubleshooting

### FFmpeg not found
Railway includes FFmpeg automatically. For local development:
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### Whisper model download errors
Models download automatically on first use. Ensure internet connection.

### Out of memory
Reduce Whisper model size or increase Railway service RAM.

## 📚 Documentation

- FastAPI: https://fastapi.tiangolo.com
- FFmpeg: https://ffmpeg.org/documentation.html
- MoviePy: https://zulko.github.io/moviepy
- Whisper: https://github.com/openai/whisper
- Railway: https://docs.railway.app

## 🎓 Assignment Notes

This backend is perfect for academic projects:
- ✅ Professional-grade features
- ✅ Free to run (Railway trial credits)
- ✅ Easy to demonstrate
- ✅ Impressive tech stack
- ✅ Well-documented
- ✅ Production-ready

## 📄 License

MIT License - Free to use for academic and commercial projects

## 🤝 Support

For issues or questions:
1. Check `/api/health` endpoint
2. Review logs in Railway dashboard
3. Check Swagger docs at `/docs`

---

Built with ❤️ for professional video editing

