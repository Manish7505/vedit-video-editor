// Backend AI Service - Uses the backend OpenRouter API
// This service handles communication with the backend AI endpoints

interface AIResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
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

class BackendAIService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '/api'
  }

  // Check if AI service is available
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/status`)
      const data = await response.json()
      return data.success && data.data?.available
    } catch (error) {
      console.error('AI service availability check failed:', error)
      return false
    }
  }

  // Test connection to AI service
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/status`)
      const data = await response.json()
      return data.success && data.data?.connected
    } catch (error) {
      console.error('AI connection test failed:', error)
      return false
    }
  }

  // Send chat message to AI
  async sendChatMessage(message: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      const data: AIResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'AI chat failed')
      }

      return data.data?.response || 'No response from AI'
    } catch (error) {
      console.error('AI chat error:', error)
      throw new Error(`AI chat failed: ${error}`)
    }
  }

  // Analyze video command
  async analyzeVideoCommand(command: string, videoContext: VideoContext): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/execute-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          command,
          context: videoContext 
        }),
      })

      const data: AIResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'AI command execution failed')
      }

      return data.data?.response || 'Command executed successfully'
    } catch (error) {
      console.error('AI command analysis error:', error)
      throw new Error(`AI command analysis failed: ${error}`)
    }
  }

  // Get AI suggestions
  async getSuggestions(context: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context }),
      })

      const data: AIResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'AI suggestions failed')
      }

      return data.data?.suggestions || []
    } catch (error) {
      console.error('AI suggestions error:', error)
      throw new Error(`AI suggestions failed: ${error}`)
    }
  }

  // Get AI service status
  async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/status`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('AI status check failed:', error)
      throw new Error(`AI status check failed: ${error}`)
    }
  }
}

export const backendAIService = new BackendAIService()
export default backendAIService
