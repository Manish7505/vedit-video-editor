import whisper
import os
from pathlib import Path
import uuid
import json

class WhisperService:
    def __init__(self):
        self.model = None
        self.model_name = "base"  # Start with base model (faster, less accurate)
        self.processed_dir = Path("processed")
        self.processed_dir.mkdir(exist_ok=True)
    
    def load_model(self, model_name: str = "base"):
        """Load Whisper model (base, small, medium, large)"""
        try:
            if self.model is None or self.model_name != model_name:
                print(f"Loading Whisper model: {model_name}")
                self.model = whisper.load_model(model_name)
                self.model_name = model_name
            return True
        except Exception as e:
            print(f"Failed to load Whisper model: {str(e)}")
            return False
    
    async def transcribe_audio(self, audio_path: str, language: str = None) -> dict:
        """Transcribe audio file to text"""
        try:
            # Load model if not loaded
            if self.model is None:
                self.load_model(self.model_name)
            
            # Transcribe
            result = self.model.transcribe(
                audio_path,
                language=language,
                task="transcribe"
            )
            
            return {
                "success": True,
                "text": result["text"],
                "language": result["language"],
                "segments": result["segments"]
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Transcription failed: {str(e)}"
            }
    
    async def generate_captions(self, audio_path: str, language: str = None) -> dict:
        """Generate captions with timestamps"""
        try:
            # Load model if not loaded
            if self.model is None:
                self.load_model(self.model_name)
            
            # Transcribe with word timestamps
            result = self.model.transcribe(
                audio_path,
                language=language,
                task="transcribe",
                word_timestamps=True
            )
            
            # Format captions
            captions = []
            for segment in result["segments"]:
                captions.append({
                    "id": len(captions) + 1,
                    "start": segment["start"],
                    "end": segment["end"],
                    "text": segment["text"].strip()
                })
            
            return {
                "success": True,
                "captions": captions,
                "language": result["language"],
                "full_text": result["text"]
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Caption generation failed: {str(e)}"
            }
    
    async def generate_srt(self, audio_path: str, language: str = None) -> str:
        """Generate SRT subtitle file"""
        try:
            # Load model if not loaded
            if self.model is None:
                self.load_model(self.model_name)
            
            # Transcribe
            result = self.model.transcribe(
                audio_path,
                language=language,
                task="transcribe"
            )
            
            # Generate SRT content
            srt_content = ""
            for i, segment in enumerate(result["segments"], start=1):
                start_time = self._format_srt_time(segment["start"])
                end_time = self._format_srt_time(segment["end"])
                text = segment["text"].strip()
                
                srt_content += f"{i}\n"
                srt_content += f"{start_time} --> {end_time}\n"
                srt_content += f"{text}\n\n"
            
            # Save SRT file
            output_filename = f"{uuid.uuid4()}.srt"
            output_path = self.processed_dir / output_filename
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(srt_content)
            
            return {
                "success": True,
                "srt_file": str(output_path),
                "url": f"/processed/{output_filename}",
                "language": result["language"]
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"SRT generation failed: {str(e)}"
            }
    
    async def translate_audio(self, audio_path: str, target_language: str = "en") -> dict:
        """Translate audio to English"""
        try:
            # Load model if not loaded
            if self.model is None:
                self.load_model(self.model_name)
            
            # Translate to English
            result = self.model.transcribe(
                audio_path,
                task="translate"
            )
            
            return {
                "success": True,
                "original_language": result.get("language", "unknown"),
                "translated_text": result["text"],
                "target_language": "en"
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Translation failed: {str(e)}"
            }
    
    def _format_srt_time(self, seconds: float) -> str:
        """Format time in SRT format (HH:MM:SS,mmm)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
    
    async def get_available_models(self) -> list:
        """Get list of available Whisper models"""
        return [
            {"name": "tiny", "size": "39 MB", "speed": "fastest", "accuracy": "lowest"},
            {"name": "base", "size": "74 MB", "speed": "fast", "accuracy": "good"},
            {"name": "small", "size": "244 MB", "speed": "medium", "accuracy": "better"},
            {"name": "medium", "size": "769 MB", "speed": "slow", "accuracy": "great"},
            {"name": "large", "size": "1550 MB", "speed": "slowest", "accuracy": "best"}
        ]

# Create singleton instance
whisper_service = WhisperService()

