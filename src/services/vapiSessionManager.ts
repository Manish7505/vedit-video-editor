import { logger } from '../utils/logger'

class VAPISessionManager {
  private activeCall: 'homepage' | 'video-editor' | null = null
  private callStartTime: Date | null = null

  startCall(assistantType: 'homepage' | 'video-editor'): boolean {
    if (this.activeCall && this.activeCall !== assistantType) {
      logger.warn(`⚠️ Another assistant (${this.activeCall}) is already in a call`)
      return false
    }

    this.activeCall = assistantType
    this.callStartTime = new Date()
    window.sessionStorage.setItem('vapi-active-call', assistantType)
    
    // Notify all components
    window.dispatchEvent(new CustomEvent('vapi-call-started', { 
      detail: { source: assistantType } 
    }))
    
    logger.info(`✅ Started call: ${assistantType}`)
    return true
  }

  endCall(assistantType: 'homepage' | 'video-editor'): void {
    if (this.activeCall === assistantType) {
      this.activeCall = null
      this.callStartTime = null
      window.sessionStorage.removeItem('vapi-active-call')
      
      // Notify all components
      window.dispatchEvent(new CustomEvent('vapi-call-ended', { 
        detail: { source: assistantType } 
      }))
      
      logger.info(`✅ Ended call: ${assistantType}`)
    } else if (this.activeCall) {
      // If there's an active call but different type, still end it
      logger.warn(`⚠️ Call mismatch: expected ${assistantType}, got ${this.activeCall}. Ending anyway.`)
      this.activeCall = null
      this.callStartTime = null
      window.sessionStorage.removeItem('vapi-active-call')
      
      // Notify all components
      window.dispatchEvent(new CustomEvent('vapi-call-ended', { 
        detail: { source: this.activeCall || assistantType } 
      }))
      
      logger.info(`✅ Force ended call: ${assistantType}`)
    } else {
      logger.warn(`⚠️ No active call to end for ${assistantType}`)
    }
  }

  endAnyCall(): void {
    if (this.activeCall) {
      logger.info(`🛑 Ending any active call: ${this.activeCall}`)
      this.activeCall = null
      this.callStartTime = null
      window.sessionStorage.removeItem('vapi-active-call')
      
      // Notify all components
      window.dispatchEvent(new CustomEvent('vapi-call-ended', { 
        detail: { source: 'any' } 
      }))
      
      logger.info(`✅ Ended any active call`)
    }
  }

  getActiveCall(): 'homepage' | 'video-editor' | null {
    return this.activeCall
  }

  isCallActive(): boolean {
    return this.activeCall !== null
  }

  getCallDuration(): number | null {
    if (!this.callStartTime) return null
    return Date.now() - this.callStartTime.getTime()
  }
}

export const vapiSessionManager = new VAPISessionManager()