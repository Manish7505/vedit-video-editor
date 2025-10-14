from fastapi import APIRouter
import subprocess
import sys
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint - simple and fast"""
    return {
        "status": "ok",
        "message": "VEdit Backend is healthy"
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

