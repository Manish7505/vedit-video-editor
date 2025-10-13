from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import aiofiles
import uuid
import os
from typing import List

router = APIRouter()

UPLOAD_DIR = Path("uploads")
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".aac", ".m4a", ".ogg"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a single file"""
    try:
        # Generate unique filename
        file_ext = Path(file.filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Validate file type
        if file_ext not in (ALLOWED_VIDEO_EXTENSIONS | ALLOWED_AUDIO_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS):
            raise HTTPException(status_code=400, detail="File type not allowed")
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Determine file type
        if file_ext in ALLOWED_VIDEO_EXTENSIONS:
            file_type = "video"
        elif file_ext in ALLOWED_AUDIO_EXTENSIONS:
            file_type = "audio"
        else:
            file_type = "image"
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "file": {
                "id": str(uuid.uuid4()),
                "filename": unique_filename,
                "original_name": file.filename,
                "type": file_type,
                "size": len(content),
                "url": f"/uploads/{unique_filename}",
                "path": str(file_path)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.post("/upload-multiple")
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """Upload multiple files"""
    uploaded_files = []
    
    for file in files:
        try:
            # Generate unique filename
            file_ext = Path(file.filename).suffix.lower()
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = UPLOAD_DIR / unique_filename
            
            # Validate file type
            if file_ext not in (ALLOWED_VIDEO_EXTENSIONS | ALLOWED_AUDIO_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS):
                continue
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Determine file type
            if file_ext in ALLOWED_VIDEO_EXTENSIONS:
                file_type = "video"
            elif file_ext in ALLOWED_AUDIO_EXTENSIONS:
                file_type = "audio"
            else:
                file_type = "image"
            
            uploaded_files.append({
                "id": str(uuid.uuid4()),
                "filename": unique_filename,
                "original_name": file.filename,
                "type": file_type,
                "size": len(content),
                "url": f"/uploads/{unique_filename}",
                "path": str(file_path)
            })
        
        except Exception as e:
            print(f"Error uploading {file.filename}: {str(e)}")
            continue
    
    return {
        "success": True,
        "message": f"{len(uploaded_files)} file(s) uploaded successfully",
        "files": uploaded_files
    }

@router.delete("/delete/{filename}")
async def delete_file(filename: str):
    """Delete a file"""
    try:
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        os.remove(file_path)
        
        return {
            "success": True,
            "message": "File deleted successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File deletion failed: {str(e)}")

@router.get("/list")
async def list_files(file_type: str = None):
    """List all uploaded files"""
    try:
        files = []
        
        for file_path in UPLOAD_DIR.iterdir():
            if file_path.is_file():
                file_ext = file_path.suffix.lower()
                
                # Determine file type
                if file_ext in ALLOWED_VIDEO_EXTENSIONS:
                    ftype = "video"
                elif file_ext in ALLOWED_AUDIO_EXTENSIONS:
                    ftype = "audio"
                elif file_ext in ALLOWED_IMAGE_EXTENSIONS:
                    ftype = "image"
                else:
                    continue
                
                # Filter by type if specified
                if file_type and ftype != file_type:
                    continue
                
                files.append({
                    "filename": file_path.name,
                    "type": ftype,
                    "size": file_path.stat().st_size,
                    "url": f"/uploads/{file_path.name}",
                    "created_at": file_path.stat().st_ctime
                })
        
        # Sort by creation time (newest first)
        files.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {
            "success": True,
            "files": files,
            "count": len(files)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

