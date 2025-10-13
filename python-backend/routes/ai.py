from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.ai_service import ai_service

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None

class ScriptRequest(BaseModel):
    topic: str
    script_type: str = "general"  # title, outline, full, voiceover

class TitlesRequest(BaseModel):
    topic: str
    count: int = 10

class BrainstormRequest(BaseModel):
    niche: str

@router.post("/chat")
async def chat(request: ChatRequest):
    """Get AI chat response"""
    try:
        result = await ai_service.chat(
            request.message,
            request.conversation_history
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-script")
async def generate_script(request: ScriptRequest):
    """Generate video script"""
    try:
        result = await ai_service.generate_script(
            request.topic,
            request.script_type
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-titles")
async def generate_titles(request: TitlesRequest):
    """Generate video title suggestions"""
    try:
        result = await ai_service.generate_titles(
            request.topic,
            request.count
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/brainstorm")
async def brainstorm_ideas(request: BrainstormRequest):
    """Generate video ideas for a niche"""
    try:
        result = await ai_service.brainstorm_ideas(request.niche)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def ai_status():
    """Get AI service status"""
    return {
        "success": True,
        "services": {
            "chatbot": "available" if ai_service.chatbot else "loading",
            "text_generation": "available" if ai_service.text_generator else "loading",
            "device": ai_service.device
        },
        "features": {
            "chat": True,
            "script_generation": True,
            "title_generation": True,
            "brainstorming": True
        }
    }

@router.post("/load-models")
async def load_models():
    """Preload AI models"""
    try:
        ai_service.load_chatbot()
        ai_service.load_text_generator()
        
        return {
            "success": True,
            "message": "AI models loaded successfully",
            "chatbot": "ready" if ai_service.chatbot else "failed",
            "text_generator": "ready" if ai_service.text_generator else "failed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

