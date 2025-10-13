// API Configuration for Python Backend
export const API_CONFIG = {
  // Update this with your Railway backend URL after deployment
  BASE_URL: import.meta.env.VITE_API_URL || 'https://your-app.railway.app',
  TIMEOUT: 30000, // 30 seconds
  WS_URL: import.meta.env.VITE_WS_URL || 'wss://your-app.railway.app/ws'
}

// API Endpoints
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/api/health',
  STATUS: '/api/status',
  
  // Files
  UPLOAD: '/api/files/upload',
  UPLOAD_MULTIPLE: '/api/files/upload-multiple',
  LIST_FILES: '/api/files/list',
  DELETE_FILE: '/api/files/delete',
  
  // Video Processing
  TRIM: '/api/video/trim',
  MERGE: '/api/video/merge',
  SPEED: '/api/video/speed',
  VOLUME: '/api/video/volume',
  FADE: '/api/video/fade',
  RESIZE: '/api/video/resize',
  EXTRACT_AUDIO: '/api/video/extract-audio',
  CONVERT: '/api/video/convert',
  COMPRESS: '/api/video/compress',
  VIDEO_INFO: '/api/video/info',
  
  // AI & Transcription
  TRANSCRIBE: '/api/video/transcribe',
  GENERATE_CAPTIONS: '/api/video/generate-captions',
  GENERATE_SRT: '/api/video/generate-srt',
  WHISPER_MODELS: '/api/video/whisper-models',
  AI_CHAT: '/api/ai/chat',
  GENERATE_SCRIPT: '/api/ai/generate-script',
  GENERATE_TITLES: '/api/ai/generate-titles',
  BRAINSTORM: '/api/ai/brainstorm',
  AI_STATUS: '/api/ai/status'
}

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// Helper function for file upload
export const uploadFile = async (file: File): Promise<any> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(buildApiUrl(API_ENDPOINTS.UPLOAD), {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    throw new Error('File upload failed')
  }
  
  return response.json()
}

// Helper function for video processing
export const processVideo = async (endpoint: string, data: any): Promise<any> => {
  const response = await fetch(buildApiUrl(endpoint), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Video processing failed')
  }
  
  return response.json()
}

// Helper function for AI requests
export const aiRequest = async (endpoint: string, data: any): Promise<any> => {
  const response = await fetch(buildApiUrl(endpoint), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('AI request failed')
  }
  
  return response.json()
}

// WebSocket connection
export const createWebSocket = (): WebSocket => {
  return new WebSocket(API_CONFIG.WS_URL)
}

export default {
  API_CONFIG,
  API_ENDPOINTS,
  buildApiUrl,
  uploadFile,
  processVideo,
  aiRequest,
  createWebSocket
}

