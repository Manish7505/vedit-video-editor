import ffmpeg
import subprocess
from pathlib import Path
from moviepy.editor import VideoFileClip, AudioFileClip, CompositeVideoClip, concatenate_videoclips
from moviepy.video.fx import resize, speedx, fadein, fadeout
from moviepy.audio.fx import volumex, audio_fadein, audio_fadeout
import uuid
import os

class VideoProcessor:
    def __init__(self):
        self.temp_dir = Path("temp")
        self.processed_dir = Path("processed")
        self.temp_dir.mkdir(exist_ok=True)
        self.processed_dir.mkdir(exist_ok=True)
    
    async def trim_video(self, input_path: str, start_time: float, end_time: float) -> str:
        """Trim video to specific time range"""
        try:
            output_filename = f"{uuid.uuid4()}.mp4"
            output_path = str(self.processed_dir / output_filename)
            
            clip = VideoFileClip(input_path)
            trimmed = clip.subclip(start_time, end_time)
            trimmed.write_videofile(output_path, codec='libx264', audio_codec='aac')
            
            clip.close()
            trimmed.close()
            
            return output_path
        except Exception as e:
            raise Exception(f"Video trim failed: {str(e)}")
    
    async def merge_videos(self, video_paths: list) -> str:
        """Merge multiple videos into one"""
        try:
            output_filename = f"{uuid.uuid4()}.mp4"
            output_path = str(self.processed_dir / output_filename)
            
            clips = [VideoFileClip(path) for path in video_paths]
            final_clip = concatenate_videoclips(clips, method="compose")
            final_clip.write_videofile(output_path, codec='libx264', audio_codec='aac')
            
            for clip in clips:
                clip.close()
            final_clip.close()
            
            return output_path
        except Exception as e:
            raise Exception(f"Video merge failed: {str(e)}")
    
    async def change_speed(self, input_path: str, speed_factor: float) -> str:
        """Change video playback speed"""
        try:
            output_filename = f"{uuid.uuid4()}.mp4"
            output_path = str(self.processed_dir / output_filename)
            
            clip = VideoFileClip(input_path)
            spedup = clip.fx(speedx, speed_factor)
            spedup.write_videofile(output_path, codec='libx264', audio_codec='aac')
            
            clip.close()
            spedup.close()
            
            return output_path
        except Exception as e:
            raise Exception(f"Speed change failed: {str(e)}")
    
    async def adjust_volume(self, input_path: str, volume_factor: float) -> str:
        """Adjust video volume"""
        try:
            output_filename = f"{uuid.uuid4()}.mp4"
            output_path = str(self.processed_dir / output_filename)
            
            clip = VideoFileClip(input_path)
            adjusted = clip.fx(volumex, volume_factor)
            adjusted.write_videofile(output_path, codec='libx264', audio_codec='aac')
            
            clip.close()
            adjusted.close()
            
            return output_path
        except Exception as e:
            raise Exception(f"Volume adjustment failed: {str(e)}")
    
    async def add_fade(self, input_path: str, fade_in_duration: float = 1.0, fade_out_duration: float = 1.0) -> str:
        """Add fade in/out effects"""
        try:
            output_filename = f"{uuid.uuid4()}.mp4"
            output_path = str(self.processed_dir / output_filename)
            
            clip = VideoFileClip(input_path)
            
            if fade_in_duration > 0:
                clip = clip.fx(fadein, fade_in_duration)
            
            if fade_out_duration > 0:
                clip = clip.fx(fadeout, fade_out_duration)
            
            clip.write_videofile(output_path, codec='libx264', audio_codec='aac')
            clip.close()
            
            return output_path
        except Exception as e:
            raise Exception(f"Fade effect failed: {str(e)}")
    
    async def resize_video(self, input_path: str, width: int, height: int) -> str:
        """Resize video to specific dimensions"""
        try:
            output_filename = f"{uuid.uuid4()}.mp4"
            output_path = str(self.processed_dir / output_filename)
            
            clip = VideoFileClip(input_path)
            resized = clip.fx(resize, newsize=(width, height))
            resized.write_videofile(output_path, codec='libx264', audio_codec='aac')
            
            clip.close()
            resized.close()
            
            return output_path
        except Exception as e:
            raise Exception(f"Video resize failed: {str(e)}")
    
    async def extract_audio(self, input_path: str) -> str:
        """Extract audio from video"""
        try:
            output_filename = f"{uuid.uuid4()}.mp3"
            output_path = str(self.processed_dir / output_filename)
            
            # Use FFmpeg directly for audio extraction
            (
                ffmpeg
                .input(input_path)
                .output(output_path, acodec='libmp3lame', audio_bitrate='192k')
                .overwrite_output()
                .run(quiet=True)
            )
            
            return output_path
        except Exception as e:
            raise Exception(f"Audio extraction failed: {str(e)}")
    
    async def convert_format(self, input_path: str, output_format: str) -> str:
        """Convert video to different format"""
        try:
            output_filename = f"{uuid.uuid4()}.{output_format}"
            output_path = str(self.processed_dir / output_filename)
            
            clip = VideoFileClip(input_path)
            clip.write_videofile(output_path, codec='libx264', audio_codec='aac')
            clip.close()
            
            return output_path
        except Exception as e:
            raise Exception(f"Format conversion failed: {str(e)}")
    
    async def compress_video(self, input_path: str, crf: int = 28) -> str:
        """Compress video to reduce file size"""
        try:
            output_filename = f"{uuid.uuid4()}.mp4"
            output_path = str(self.processed_dir / output_filename)
            
            # Use FFmpeg for compression
            (
                ffmpeg
                .input(input_path)
                .output(output_path, vcodec='libx264', crf=crf, preset='medium')
                .overwrite_output()
                .run(quiet=True)
            )
            
            return output_path
        except Exception as e:
            raise Exception(f"Video compression failed: {str(e)}")
    
    async def get_video_info(self, input_path: str) -> dict:
        """Get video metadata"""
        try:
            probe = ffmpeg.probe(input_path)
            video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            audio_info = next((s for s in probe['streams'] if s['codec_type'] == 'audio'), None)
            
            return {
                "duration": float(probe['format']['duration']),
                "width": int(video_info['width']),
                "height": int(video_info['height']),
                "fps": eval(video_info['r_frame_rate']),
                "codec": video_info['codec_name'],
                "has_audio": audio_info is not None,
                "size": int(probe['format']['size'])
            }
        except Exception as e:
            raise Exception(f"Failed to get video info: {str(e)}")

# Create singleton instance
video_processor = VideoProcessor()

