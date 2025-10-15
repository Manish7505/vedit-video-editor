import Vapi from '@vapi-ai/web'

export interface VAPIConfig {
  publicKey: string
  workflowId: string
  customConfig?: Record<string, any>
}

export class VAPIService {
  private vapi: Vapi | null = null
  private config: VAPIConfig | null = null

  constructor(config: VAPIConfig) {
    this.config = config
    this.initialize()
  }

  private initialize() {
    if (!this.config?.publicKey) {
      throw new Error('VAPI public key is required')
    }

    this.vapi = new Vapi(this.config.publicKey)
    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.vapi) return

    // Set up default event listeners
    this.vapi.on('call-start', () => {
      console.log('VAPI call started')
    })

    this.vapi.on('call-end', () => {
      console.log('VAPI call ended')
    })

    this.vapi.on('error', (error: any) => {
      console.error('VAPI error:', error)
    })

    this.vapi.on('speech-start', () => {
      console.log('Assistant started speaking')
    })

    this.vapi.on('speech-end', () => {
      console.log('Assistant finished speaking')
    })
  }

  async startCall(customData?: Record<string, any>) {
    if (!this.vapi || !this.config?.workflowId) {
      throw new Error('VAPI not initialized or workflow ID missing')
    }

    try {
      const startConfig: any = {
        workflowId: this.config.workflowId,
        ...this.config.customConfig
      }

      if (customData) {
        startConfig.customData = customData
      }

      await this.vapi.start(startConfig)
      return true
    } catch (error) {
      console.error('Failed to start VAPI call:', error)
      throw error
    }
  }

  async endCall() {
    if (!this.vapi) {
      throw new Error('VAPI not initialized')
    }

    try {
      await this.vapi.stop()
      return true
    } catch (error) {
      console.error('Failed to end VAPI call:', error)
      throw error
    }
  }

  // Note: VAPI SDK may not have built-in mute/unmute methods
  // These methods are placeholders for future implementation
  async mute() {
    if (!this.vapi) {
      throw new Error('VAPI not initialized')
    }

    try {
      // VAPI SDK doesn't have a direct mute method
      // This would need to be implemented using browser audio APIs
      console.warn('Mute functionality not available in current VAPI SDK version')
      return false
    } catch (error) {
      console.error('Failed to mute VAPI call:', error)
      throw error
    }
  }

  async unmute() {
    if (!this.vapi) {
      throw new Error('VAPI not initialized')
    }

    try {
      // VAPI SDK doesn't have a direct unmute method
      // This would need to be implemented using browser audio APIs
      console.warn('Unmute functionality not available in current VAPI SDK version')
      return false
    } catch (error) {
      console.error('Failed to unmute VAPI call:', error)
      throw error
    }
  }

  isConnected(): boolean {
    // VAPI SDK doesn't have a direct isConnected method
    // This is a placeholder - actual implementation would need to track connection state
    return false
  }

  isMuted(): boolean {
    // VAPI SDK doesn't have a direct isMuted method
    // This is a placeholder - actual implementation would need to track mute state
    return false
  }

  // Add custom event listener
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.vapi) {
      throw new Error('VAPI not initialized')
    }
    // Type assertion to handle VAPI event types
    (this.vapi as any).on(event, callback)
  }

  // Remove event listener
  off(event: string, callback: (...args: any[]) => void) {
    if (!this.vapi) {
      throw new Error('VAPI not initialized')
    }
    // Type assertion to handle VAPI event types
    (this.vapi as any).off(event, callback)
  }

  // Cleanup
  destroy() {
    if (this.vapi) {
      this.vapi.stop()
      this.vapi = null
    }
  }
}

// Factory function to create VAPI service instance
export const createVAPIService = (config: VAPIConfig): VAPIService => {
  return new VAPIService(config)
}

// Default configuration from environment variables
export const getDefaultVAPIConfig = (): VAPIConfig => {
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY || ''
  const workflowId = import.meta.env.VITE_VAPI_WORKFLOW_ID || ''

  if (!publicKey) {
    console.warn('VAPI public key not found in environment variables')
  }

  if (!workflowId) {
    console.warn('VAPI workflow ID not found in environment variables')
  }

  return {
    publicKey,
    workflowId,
    customConfig: {
      // Add any default custom configuration here
    }
  }
}
