from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.video_processor import video_processor
from services.whisper_service import whisper_service
from pathlib import Path

router = APIRouter()

class TrimRequest(BaseModel):
    input_path: str
    start_time: float
    end_time: float

class MergeRequest(BaseModel):
    video_paths: List[str]

class SpeedRequest(BaseModel):
    input_path: str
    speed_factor: float

class VolumeRequest(BaseModel):
    input_path: str
    volume_factor: float

class FadeRequest(BaseModel):
    input_path: str
    fade_in_duration: float = 1.0
    fade_out_duration: float = 1.0

class ResizeRequest(BaseModel):
    input_path: str
    width: int
    height: int

class ConvertRequest(BaseModel):
    input_path: str
    output_format: str

class CompressRequest(BaseModel):
    input_path: str
    crf: int = 28

class TranscribeRequest(BaseModel):
    audio_path: str
    language: Optional[str] = None

@router.post("/trim")
async def trim_video(request: TrimRequest):
    """Trim video to specific time range"""
    try:
        output_path = await video_processor.trim_video(
            request.input_path,
            request.start_time,
            request.end_time
        )
        
        return {
            "success": True,
            "message": "Video trimmed successfully",
            "output_path": output_path,
            "url": f"/processed/{Path(output_path).name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/merge")
async def merge_videos(request: MergeRequest):
    """Merge multiple videos into one"""
    try:
        output_path = await video_processor.merge_videos(request.video_paths)
        
        return {
            "success": True,
            "message": "Videos merged successfully",
            "output_path": output_path,
            "url": f"/processed/{Path(output_path).name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/speed")
async def change_speed(request: SpeedRequest):
    """Change video playback speed"""
    try:
        output_path = await video_processor.change_speed(
            request.input_path,
            request.speed_factor
        )
        
        return {
            "success": True,
            "message": "Speed changed successfully",
            "output_path": output_path,
            "url": f"/processed/{Path(output_path).name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/volume")
async def adjust_volume(request: VolumeRequest):
    """Adjust video volume"""
    try:
        output_path = await video_processor.adjust_volume(
            request.input_path,
            request.volume_factor
        )
        
        return {
            "success": True,
            "message": "Volume adjusted successfully",
            "output_path": output_path,
            "url": f"/processed/{Path(output_path).name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fade")
async def add_fade(request: FadeRequest):
    """Add fade in/out effects"""
    try:
        output_path = await video_processor.add_fade(
            request.input_path,
            request.fade_in_duration,
            request.fade_out_duration
        )
        
        return {
            "success": True,
            "message": "Fade effects added successfully",
            "output_path": output_path,
            "url": f"/processed/{Path(output_path).name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resize")
async def resize_video(request: ResizeRequest):
    """Resize video to specific dimensions"""
    try:
        output_path = await video_processor.resize_video(
            request.input_path,
            request.width,
            request.height
        )
        
        return {
            "success": True,
            "message": "Video resized successfully",
            "output_path": output_path,
            "url": f"/processed/{Path(output_path).name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-audio")
async def extract_audio(input_path: str):
    """Extract audio from video"""
    try:
        output_path = await video_processor.extract_audio(input_path)
        
        return {
            "success": True,
            "message": "Audio extracted successfully",
            "output_path": output_path,
            "url": f"/processed/{Path(output_path).name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert")
async def convert_format(request: ConvertRequest):
    """Convert video to different format"""
    try:
        output_path = await video_processor.convert_format(
            request.input_path,
            request.output_format
        )
        
        return {
            "success": True,
            "message": "Format converted successfully",
            "output_path": output_path,
            "url": f"/processed/{Path(output_path).name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compress")
async def compress_video(request: CompressRequest):
    """Compress video to reduce file size"""
    try:
        output_path = await video_processor.compress_video(
            request.input_path,
            request.crf
        )
        
        return {
            "success": True,
            "message": "Video compressed successfully",
            "output_path": output_path,
            "url": f"/processed/{Path(output_path).name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/info")
async def get_video_info(input_path: str):
    """Get video metadata"""
    try:
        info = await video_processor.get_video_info(input_path)
        
        return {
            "success": True,
            "info": info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    """Transcribe audio to text using Whisper"""
    try:
        result = await whisper_service.transcribe_audio(
            request.audio_path,
            request.language
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-captions")
async def generate_captions(request: TranscribeRequest):
    """Generate captions with timestamps"""
    try:
        result = await whisper_service.generate_captions(
            request.audio_path,
            request.language
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-srt")
async def generate_srt(request: TranscribeRequest):
    """Generate SRT subtitle file"""
    try:
        result = await whisper_service.generate_srt(
            request.audio_path,
            request.language
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/whisper-models")
async def get_whisper_models():
    """Get available Whisper models"""
    try:
        models = await whisper_service.get_available_models()
        
        return {
            "success": True,
            "models": models
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

