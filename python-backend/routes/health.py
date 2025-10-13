from fastapi import APIRouter
import subprocess
import sys
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    
    # Check FFmpeg availability
    ffmpeg_available = False
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True, timeout=5)
        ffmpeg_available = result.returncode == 0
    except:
        pass
    
    # Check Whisper availability
    whisper_available = False
    try:
        import whisper
        whisper_available = True
    except:
        pass
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "python_version": sys.version,
        "services": {
            "ffmpeg": "available" if ffmpeg_available else "unavailable",
            "whisper": "available" if whisper_available else "unavailable",
            "moviepy": "available",
            "api": "running"
        }
    }

@router.get("/status")
async def api_status():
    """Get API status and available features"""
    return {
        "api": "VEdit Video Editor",
        "version": "1.0.0",
        "features": {
            "video_processing": True,
            "audio_processing": True,
            "ai_transcription": True,
            "ai_chatbot": True,
            "script_generation": True,
            "auto_captions": True,
            "video_effects": True,
            "format_conversion": True
        },
        "status": "operational"
    }

