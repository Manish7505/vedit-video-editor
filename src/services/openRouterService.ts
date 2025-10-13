// OpenRouter API Service for AI Models
export interface OpenRouterModel {
  id: string
  name: string
  description: string
  pricing: {
    prompt: string
    completion: string
  }
}

export interface OpenRouterResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenRouterService {
  private static instance: OpenRouterService
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'

  private constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
    console.log('🔧 OpenRouter: Initializing with API key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT FOUND')
  }

  static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService()
    }
    return OpenRouterService.instance
  }

  // Check if API key is available
  isApiKeyAvailable(): boolean {
    return !!this.apiKey
  }

  // Get available models
  async getModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'VEdit AI Platform'
        }
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error)
      throw error
    }
  }

  // Chat completion using OpenRouter
  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    model: string = 'openai/whisper-1',
    options: any = {}
  ): Promise<OpenRouterResponse> {
    try {
      console.log('🚀 OpenRouter: Making chat completion request...')
      console.log('📝 Model:', model)
      console.log('💬 Messages:', messages.length)

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'VEdit AI Platform'
        },
        body: JSON.stringify({
          model,
          messages,
          ...options
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ OpenRouter API error:', response.status, errorText)
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ OpenRouter: Chat completion successful')
      return data
    } catch (error) {
      console.error('❌ OpenRouter chat completion error:', error)
      throw error
    }
  }

  // Audio transcription using OpenRouter (if supported)
  async transcribeAudio(
    audioBlob: Blob,
    model: string = 'openai/whisper-1'
  ): Promise<any> {
    try {
      console.log('🎤 OpenRouter: Starting audio transcription...')
      
      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob)
      
      // For OpenRouter, we might need to use a different approach
      // since they may not support direct audio upload
      // Let's try using a text-based approach first
      
      const messages = [
        {
          role: 'system',
          content: 'You are an AI assistant that helps with audio transcription. Please transcribe the provided audio content.'
        },
        {
          role: 'user',
          content: `Please transcribe this audio file. The audio is encoded as base64: ${base64Audio.substring(0, 100)}...`
        }
      ]

      const response = await this.chatCompletion(messages, model)
      return response
    } catch (error) {
      console.error('❌ OpenRouter transcription error:', error)
      throw error
    }
  }

  // Convert blob to base64
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:audio/wav;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      const models = await this.getModels()
      console.log('✅ OpenRouter: Connection successful, found', models.length, 'models')
      return true
    } catch (error) {
      console.error('❌ OpenRouter: Connection failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const openRouterService = OpenRouterService.getInstance()
