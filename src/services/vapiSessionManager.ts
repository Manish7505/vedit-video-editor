class VAPISessionManager {
  private activeCall: 'homepage' | 'video-editor' | null = null
  private callStartTime: Date | null = null

  startCall(assistantType: 'homepage' | 'video-editor'): boolean {
    if (this.activeCall && this.activeCall !== assistantType) {
      console.log(`⚠️ Another assistant (${this.activeCall}) is already in a call`)
      return false
    }

    this.activeCall = assistantType
    this.callStartTime = new Date()
    window.sessionStorage.setItem('vapi-active-call', assistantType)
    
    // Notify all components
    window.dispatchEvent(new CustomEvent('vapi-call-started', { 
      detail: { source: assistantType } 
    }))
    
    console.log(`✅ Started call: ${assistantType}`)
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
      
      console.log(`✅ Ended call: ${assistantType}`)
    } else if (this.activeCall) {
      // If there's an active call but different type, still end it
      console.log(`⚠️ Call mismatch: expected ${assistantType}, got ${this.activeCall}. Ending anyway.`)
      this.activeCall = null
      this.callStartTime = null
      window.sessionStorage.removeItem('vapi-active-call')
      
      // Notify all components
      window.dispatchEvent(new CustomEvent('vapi-call-ended', { 
        detail: { source: this.activeCall || assistantType } 
      }))
      
      console.log(`✅ Force ended call: ${assistantType}`)
    } else {
      console.log(`⚠️ No active call to end for ${assistantType}`)
    }
  }

  endAnyCall(): void {
    if (this.activeCall) {
      console.log(`🛑 Ending any active call: ${this.activeCall}`)
      this.activeCall = null
      this.callStartTime = null
      window.sessionStorage.removeItem('vapi-active-call')
      
      // Notify all components
      window.dispatchEvent(new CustomEvent('vapi-call-ended', { 
        detail: { source: 'any' } 
      }))
      
      console.log(`✅ Ended any active call`)
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