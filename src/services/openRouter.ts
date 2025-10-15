// OpenRouter API Service for Video Editor AI Assistant
// This service handles communication with OpenRouter API for AI-powered video editing commands

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface VideoContext {
  currentTime: number
  duration: number
  clipsCount: number
  selectedClip: string | null
  clips: any[]
  tracks: any[]
  playbackState: 'playing' | 'paused'
  currentEffects: any
}

class OpenRouterService {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'
  private defaultModel = 'deepseek/deepseek-chat' // Free model

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found. Set VITE_OPENROUTER_API_KEY in .env file')
    }
  }

  // Check if OpenRouter is available
  isAvailable(): boolean {
    return !!this.apiKey
  }

  // Get available free models
  getAvailableModels(): string[] {
    return [
      'deepseek/deepseek-chat', // Recommended for text understanding
      'qwen/qwen-2.5-coder-7b-instruct', // Good for coding tasks
      'moonshot/moonshot-v1-8k', // General purpose
      'meta-llama/llama-3.1-8b-instruct', // Llama model
      'microsoft/phi-3-mini-128k-instruct' // Microsoft model
    ]
  }

  // Analyze video editing command with AI
  async analyzeVideoCommand(
    command: string, 
    videoContext: VideoContext
  ): Promise<{
    intent: string
    action: string
    parameters: any
    confidence: number
    response: string
  }> {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter API key not configured')
    }

    const systemPrompt = `You are an AI video editing assistant. Analyze the user's command and provide structured response.

Current video context:
- Current time: ${videoContext.currentTime}s
- Duration: ${videoContext.duration}s
- Number of clips: ${videoContext.clipsCount}
- Selected clip: ${videoContext.selectedClip || 'none'}
- Playback state: ${videoContext.playbackState}
- Current effects: ${JSON.stringify(videoContext.currentEffects)}

Available video editing actions:
- brightness: adjust video brightness (0-200%)
- contrast: adjust video contrast (0-200%)
- saturation: adjust color saturation (0-200%)
- volume: adjust audio volume (0-100%)
- speed: change playback speed (0.5x-2x)
- play/pause: control playback
- effects: apply visual effects (blur, sepia, grayscale, vintage, warm, cool, neon, film_grain, dramatic, cinematic)
- transitions: add transitions (fade_in, fade_out, crossfade, slide_left, slide_right, zoom_in, zoom_out)
- text: add text overlays (title, subtitle, caption, watermark)
- color_grading: professional color correction (cinematic, warm, cool, high_contrast, vintage, dramatic)
- crop: crop video (face_focus, center, custom, square, widescreen)
- transform: transform video (rotate, flip_horizontal, flip_vertical, scale)
- audio_effects: audio manipulation (fade_in, fade_out, echo, reverb, noise_reduction, ducking)
- timeline: navigate timeline (jump_to, go_to_start, go_to_end, find_moment)
- scene_detection: analyze video content (find_scenes, detect_faces, find_subjects, analyze_mood)
- auto_edit: intelligent automation (remove_boring, create_highlights, improve_flow, optimize_pacing)
- multi_track: complex editing (add_audio_track, sync_audio, picture_in_picture, layer_effects)
- animation: animated effects (bounce, slide_in, fade_in, pulse, rotate, scale)
- export: smart export (youtube_optimized, mobile_optimized, thumbnail_generation, preview)
- cut: split clips at current time
- delete: remove selected clip
- reset: clear all effects

Return JSON response with:
{
  "intent": "edit|analyze|create|delete|adjust|navigate",
  "action": "specific action like 'brightness', 'contrast', 'effects'",
  "parameters": {"value": 20, "effect": "blur"},
  "confidence": 0.95,
  "response": "Friendly response to user"
}`

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: command }
    ]

    try {
      const response = await this.makeAPICall(messages)
      const content = response.choices[0]?.message?.content || '{}'
      
      // Try to parse JSON response
      let analysis
      try {
        analysis = JSON.parse(content)
      } catch (parseError) {
        // Fallback if AI doesn't return valid JSON
        analysis = {
          intent: 'unknown',
          action: 'none',
          parameters: {},
          confidence: 0.5,
          response: content
        }
      }

      return analysis
    } catch (error) {
      console.error('OpenRouter API error:', error)
      throw new Error(`OpenRouter API failed: ${error}`)
    }
  }

  // Get AI response for general chat
  async getChatResponse(
    message: string,
    context?: string
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter API key not configured')
    }

    const systemPrompt = `You are a helpful video editing assistant. Help users with video editing tasks, provide creative suggestions, and answer questions about video editing.

${context ? `Context: ${context}` : ''}

Keep responses concise, helpful, and focused on video editing.`

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]

    try {
      const response = await this.makeAPICall(messages)
      return response.choices[0]?.message?.content || 'Sorry, I could not process your request.'
    } catch (error) {
      console.error('OpenRouter chat error:', error)
      throw new Error(`OpenRouter chat failed: ${error}`)
    }
  }

  // Make API call to OpenRouter
  private async makeAPICall(messages: OpenRouterMessage[]): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'VEdit Video Editor'
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    return await response.json()
  }

  // Get usage statistics
  async getUsageStats(): Promise<any> {
    // OpenRouter doesn't provide usage stats in free tier
    // This is a placeholder for future implementation
    return {
      credits_used: 0,
      requests_made: 0,
      model: this.defaultModel
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      await this.getChatResponse('Hello, test message')
      return true
    } catch (error) {
      console.error('OpenRouter connection test failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService()
export default openRouterService
