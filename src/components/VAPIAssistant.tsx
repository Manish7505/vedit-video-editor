import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Mic, 
  MicOff,
  Bot,
  Loader2,
  Phone,
  PhoneOff,
  Sparkles,
  MessageSquare,
  AlertCircle
} from 'lucide-react'

interface VAPIAssistantProps {
  workflowId?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'dark' | 'light'
  size?: 'small' | 'medium' | 'large'
}

const VAPIAssistant: React.FC<VAPIAssistantProps> = ({
  workflowId,
  position = 'bottom-right',
  theme = 'dark',
  size = 'medium'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [assistantMessage, setAssistantMessage] = useState<string>('Hi! I\'m your AI assistant. How can I help you today?')
  const [pulseAnimation, setPulseAnimation] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const vapiRef = useRef<any>(null)

  // Get configuration from environment
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY || ''
  const configWorkflowId = workflowId || import.meta.env.VITE_VAPI_WORKFLOW_ID || ''

  // Initialize VAPI when component mounts
  useEffect(() => {
    const initializeVAPI = async () => {
      if (!publicKey) {
        setError('VAPI public key not found. Please add VITE_VAPI_PUBLIC_KEY to your .env file')
        return
      }

      if (!configWorkflowId) {
        setError('Workflow ID not found. Please add VITE_VAPI_WORKFLOW_ID to your .env file')
        return
      }

      try {
        // Dynamically import VAPI
        const Vapi = (await import('@vapi-ai/web')).default
        vapiRef.current = new Vapi(publicKey)
        
        // Set up event listeners
        vapiRef.current.on('call-start', () => {
          console.log('✅ Call started successfully')
          setCallStatus('connected')
          setIsConnected(true)
          setIsLoading(false)
          setError(null)
          setAssistantMessage('I\'m listening... Go ahead and speak!')
        })

        vapiRef.current.on('call-end', () => {
          console.log('📞 Call ended')
          setCallStatus('ended')
          setIsConnected(false)
          setIsLoading(false)
          setAssistantMessage('Call ended. Click to start a new conversation!')
          setTimeout(() => {
            setCallStatus('idle')
          }, 2000)
        })

        vapiRef.current.on('speech-start', () => {
          console.log('🎤 Assistant started speaking')
          setPulseAnimation(true)
          setAssistantMessage('Speaking...')
        })

        vapiRef.current.on('speech-end', () => {
          console.log('🔇 Assistant finished speaking')
          setPulseAnimation(false)
          setAssistantMessage('Your turn to speak!')
        })

        vapiRef.current.on('error', (error: any) => {
          console.error('❌ VAPI Error:', error)
          
          let errorMessage = 'An error occurred. Please try again.'
          
          if (error?.message) {
            errorMessage = error.message
          } else if (error?.type) {
            errorMessage = `Error: ${error.type}`
          } else if (error?.code) {
            errorMessage = `Error Code: ${error.code}`
          }
          
          // Common error messages
          if (errorMessage.includes('assistant') || errorMessage.includes('Assistant')) {
            errorMessage = 'This appears to be a Workflow ID, but VAPI needs an Assistant ID. Please create an assistant in your VAPI dashboard and use the Assistant ID instead.'
          } else if (errorMessage.includes('workflow') || errorMessage.includes('Workflow')) {
            errorMessage = 'Workflow configuration issue. Please check your VAPI dashboard.'
          } else if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
            errorMessage = 'Permission denied. Please check your VAPI account settings.'
          } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
            errorMessage = 'Network error. Please check your internet connection.'
          }
          
          setError(errorMessage)
          setCallStatus('idle')
          setIsConnected(false)
          setIsLoading(false)
          setAssistantMessage('Error occurred. Please try again.')
        })

        vapiRef.current.on('message', (message: any) => {
          console.log('💬 Message received:', message)
          if (message?.transcript) {
            setAssistantMessage(message.transcript)
          }
        })

        vapiRef.current.on('call-update', (call: any) => {
          console.log('📞 Call update:', call)
        })

        setIsInitialized(true)
        console.log('✅ VAPI initialized successfully')

      } catch (err) {
        console.error('❌ Failed to initialize VAPI:', err)
        setError('Failed to initialize voice assistant. Please check your configuration.')
      }
    }

    initializeVAPI()

    // Cleanup on unmount
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop()
        } catch (e) {
          console.error('Error stopping VAPI:', e)
        }
      }
    }
  }, [publicKey, configWorkflowId])

  const startCall = async () => {
    if (!vapiRef.current) {
      setError('Voice assistant not initialized. Please refresh the page.')
      return
    }

    if (!isInitialized) {
      setError('Voice assistant is still initializing. Please wait a moment.')
      return
    }

    try {
      setIsLoading(true)
      setCallStatus('connecting')
      setError(null)
      setAssistantMessage('Connecting to AI assistant...')

      console.log('🚀 Starting call with workflow ID:', configWorkflowId)

      // Try different ways to start the call
      console.log('📞 Starting call with workflow ID:', configWorkflowId)

      // Method 1: Try as assistantId first (most common)
      try {
        console.log('🔄 Trying as assistantId...')
        await vapiRef.current.start({ assistantId: configWorkflowId })
        return // Success, exit function
      } catch (assistantError: any) {
        console.log('❌ Failed as assistantId:', assistantError.message)
        
        // Method 2: Try as workflowId
        try {
          console.log('🔄 Trying as workflowId...')
          await vapiRef.current.start({ workflowId: configWorkflowId })
          return // Success, exit function
        } catch (workflowError: any) {
          console.log('❌ Failed as workflowId:', workflowError.message)
          
          // Method 3: Try with just the ID (some VAPI versions)
          try {
            console.log('🔄 Trying with direct ID...')
            await vapiRef.current.start(configWorkflowId)
            return // Success, exit function
          } catch (directError: any) {
            console.log('❌ Failed with direct ID:', directError.message)
            
            // All methods failed
            throw new Error(`All connection methods failed. Last error: ${directError.message}. Your ID might need to be an Assistant ID instead of a Workflow ID. Please check your VAPI dashboard.`)
          }
        }
      }
      
    } catch (err: any) {
      console.error('❌ Failed to start call:', err)
      setError(err?.message || 'Failed to start voice assistant. Please check your configuration.')
      setIsLoading(false)
      setCallStatus('idle')
      setAssistantMessage('Failed to connect. Please try again.')
    }
  }

  const endCall = async () => {
    if (vapiRef.current) {
      try {
        await vapiRef.current.stop()
        console.log('📞 Call ended manually')
      } catch (err) {
        console.error('Failed to end call:', err)
      }
    }
    setCallStatus('idle')
    setIsConnected(false)
    setIsLoading(false)
    setAssistantMessage('Hi! I\'m your AI assistant. How can I help you today?')
  }

  const toggleMute = async () => {
    if (vapiRef.current && isConnected) {
      try {
        if (isMuted) {
          vapiRef.current.setMuted(false)
          setAssistantMessage('Microphone unmuted. I can hear you now!')
        } else {
          vapiRef.current.setMuted(true)
          setAssistantMessage('Microphone muted.')
        }
        setIsMuted(!isMuted)
      } catch (err) {
        console.error('Failed to toggle mute:', err)
      }
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6'
      case 'top-right':
        return 'top-6 right-6'
      case 'top-left':
        return 'top-6 left-6'
      default:
        return 'bottom-6 right-6'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-12 h-12'
      case 'large':
        return 'w-16 h-16'
      default:
        return 'w-14 h-14'
    }
  }

  // Don't render if no public key
  if (!publicKey) {
    return null
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      {/* Main Assistant Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${getSizeClasses()} 
          rounded-full
          bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500
          shadow-2xl 
          flex items-center justify-center
          border-2 border-white/20
          hover:scale-110 active:scale-95
          transition-all duration-300
          ${isConnected ? 'ring-4 ring-green-400/50 animate-pulse' : ''}
          ${pulseAnimation ? 'animate-pulse' : ''}
          group
          ${!isInitialized ? 'opacity-50' : ''}
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        disabled={!isInitialized}
      >
        <div className="relative">
          {!isInitialized ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isLoading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isConnected ? (
            <Mic className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
          ) : (
            <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
          )}
          
          {/* Notification Badge */}
          {!isOpen && !isConnected && isInitialized && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />
          )}
        </div>
      </motion.button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
              absolute ${position.includes('right') ? 'right-0' : 'left-0'} 
              ${position.includes('bottom') ? 'bottom-20' : 'top-20'}
              w-96
              bg-gradient-to-br from-zinc-900 to-zinc-950
              rounded-3xl 
              shadow-2xl 
              border-2 border-white/10
              overflow-hidden
              backdrop-blur-xl
            `}
          >
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center border-2 border-white/30">
                    {!isInitialized ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : isConnected ? (
                      <Mic className="w-6 h-6 text-white" />
                    ) : (
                      <Bot className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">AI Voice Assistant</h3>
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <div className={`w-2 h-2 rounded-full ${
                        !isInitialized ? 'bg-yellow-400 animate-pulse' :
                        isConnected ? 'bg-green-400 animate-pulse' : 
                        callStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                        'bg-gray-400'
                      }`} />
                      <span>
                        {!isInitialized ? 'Initializing...' :
                         callStatus === 'connecting' ? 'Connecting...' :
                         callStatus === 'connected' ? 'Connected & Listening' :
                         callStatus === 'ended' ? 'Call Ended' :
                         'Ready to Help'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Message Display */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${pulseAnimation ? 'animate-bounce' : ''}`}>
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed flex-1">
                    {assistantMessage}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">Error:</p>
                      <p className="text-red-300 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Debug Info */}
              {!isInitialized && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                    <div>
                      <p className="text-yellow-400 text-sm font-medium">Initializing...</p>
                      <p className="text-yellow-300 text-sm mt-1">
                        Setting up voice assistant. Please wait...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Action Button */}
              <motion.button
                onClick={isConnected ? endCall : startCall}
                disabled={isLoading || !isInitialized}
                className={`
                  w-full py-4 px-6 rounded-xl font-semibold text-base
                  flex items-center justify-center gap-3
                  transition-all duration-300
                  shadow-lg hover:shadow-xl
                  ${isConnected 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  border-2 border-white/20
                `}
                whileHover={{ scale: isLoading || !isInitialized ? 1 : 1.02 }}
                whileTap={{ scale: isLoading || !isInitialized ? 1 : 0.98 }}
              >
                {!isInitialized ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initializing...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  <>
                    <PhoneOff className="w-5 h-5" />
                    End Conversation
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    Start Voice Chat
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                )}
              </motion.button>

              {/* Secondary Controls */}
              {isConnected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 gap-3"
                >
                  <motion.button
                    onClick={toggleMute}
                    className={`
                      py-3 px-4 rounded-xl font-medium text-sm
                      flex items-center justify-center gap-2
                      transition-all duration-300
                      border-2
                      ${isMuted 
                        ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30' 
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Unmute Microphone
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Mute Microphone
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* Instructions */}
              {!isConnected && !error && isInitialized && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-xs text-center leading-relaxed">
                    💡 Click "Start Voice Chat" to begin talking with your AI assistant. 
                    Make sure your microphone is enabled!
                  </p>
                </div>
              )}

              {/* Configuration Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-white/50 text-xs text-center">
                  <strong>Config:</strong> {publicKey ? '✅ Key' : '❌ Key'} | 
                  {configWorkflowId ? '✅ Workflow' : '❌ Workflow'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/10">
              <p className="text-xs text-white/40 text-center">
                Powered by VAPI • AI Voice Technology
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default VAPIAssistant