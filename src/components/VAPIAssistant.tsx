import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Loader2,
  Phone,
  PhoneOff,
  AlertCircle,
  VolumeX,
  User
} from 'lucide-react'
import { vapiSessionManager } from '../services/vapiSessionManager'
import { Message } from '../types/message'
import { logger } from '../utils/logger'

interface VAPIAssistantProps {
  workflowId?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const VAPIAssistant: React.FC<VAPIAssistantProps> = ({
  workflowId,
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('Ready to help!')
  const [isInitialized, setIsInitialized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isInHeroSection, setIsInHeroSection] = useState(true)
  const [isInFooterSection, setIsInFooterSection] = useState(false)
  
  const vapiRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get configuration from environment (prefer homepage-specific keys, then video, then general)
  const publicKey =
    import.meta.env.VITE_VAPI_HOME_PUBLIC_KEY ||
    import.meta.env.VITE_VAPI_VIDEO_PUBLIC_KEY ||
    import.meta.env.VITE_VAPI_PUBLIC_KEY ||
    ''
  const configWorkflowId =
    workflowId ||
    import.meta.env.VITE_VAPI_HOME_WORKFLOW_ID ||
    import.meta.env.VITE_VAPI_VIDEO_WORKFLOW_ID ||
    import.meta.env.VITE_VAPI_WORKFLOW_ID ||
    ''
  const configAssistantId =
    import.meta.env.VITE_VAPI_HOME_ASSISTANT_ID ||
    import.meta.env.VITE_VAPI_VIDEO_ASSISTANT_ID ||
    ''

  // Prevent audio feedback by setting proper audio routing
  const preventAudioFeedback = async () => {
    try {
      // Request microphone permission with proper constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      })
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop())
      
      logger.debug('✅ Audio feedback prevention configured')
    } catch (err) {
      logger.error('Error configuring audio feedback prevention:', err)
    }
  }

  // Helper function to add messages
  const addMessage = (type: 'user' | 'assistant' | 'system', content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])


  // Make assistant button visible by default (do not gate on scroll)
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Track scroll position to determine if we're in hero section or footer section
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Consider hero section as the first 80% of viewport height
      const inHero = scrollY < windowHeight * 0.8
      setIsInHeroSection(inHero)
      
      // Try to find the footer element first, then fallback to percentage
      const footerElement = document.querySelector('footer') || 
                           document.querySelector('[class*="footer"]') ||
                           document.querySelector('[id*="footer"]')
      let inFooter = false
      
      if (footerElement) {
        const footerRect = footerElement.getBoundingClientRect()
        const footerTop = scrollY + footerRect.top
        const viewportBottom = scrollY + windowHeight
        
        // Consider in footer if we're within 300px of the footer (more generous)
        inFooter = viewportBottom > footerTop - 300
      } else {
        // Fallback: Consider footer section as the last 20% of the page
        const footerThreshold = documentHeight - windowHeight * 0.2
        inFooter = scrollY > footerThreshold
      }
      
      setIsInFooterSection(inFooter)
      
      // Debug logging (uncomment for debugging)
      // console.log('Scroll Debug:', {
      //   scrollY,
      //   windowHeight,
      //   documentHeight,
      //   inHero,
      //   inFooter,
      //   shouldShow: !inHero && !inFooter,
      //   footerElement: !!footerElement
      // })
    }

    // Initial check
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Listen for call end events from other assistants and page navigation
  useEffect(() => {
    const handleCallEnded = (event: CustomEvent) => {
      if (event.detail.source !== 'homepage' && isConnected) {
        logger.info('📞 Call ended by another assistant, cleaning up...')
        // Reset states when another assistant ends the call
        setIsConnected(false)
        setIsLoading(false)
        setIsSpeaking(false)
        setIsListening(false)
        setIsMuted(false)
        setStatusMessage('Call ended by another assistant')
        addMessage('system', 'Call ended by another assistant.')
        
        // Clean up VAPI instance
        if (vapiRef.current) {
          vapiRef.current.removeAllListeners()
          vapiRef.current = null
        }
      }
    }

    const handlePageUnload = () => {
      logger.info('🚪 Page unloading, cleaning up VAPI...')
      if (vapiRef.current && isConnected) {
        try {
          vapiRef.current.stop()
        } catch (err) {
          logger.error('Error stopping VAPI on page unload:', err)
        }
        vapiRef.current.removeAllListeners()
        vapiRef.current = null
      }
      // Clear session storage
      window.sessionStorage.removeItem('vapi-active-call')
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isConnected) {
        handlePageUnload()
        // Optional: Show confirmation dialog
        event.preventDefault()
        event.returnValue = 'You have an active call. Are you sure you want to leave?'
        return 'You have an active call. Are you sure you want to leave?'
      }
    }

    window.addEventListener('vapi-call-ended', handleCallEnded as EventListener)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handlePageUnload)
    
    return () => {
      window.removeEventListener('vapi-call-ended', handleCallEnded as EventListener)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handlePageUnload)
    }
  }, [isConnected, addMessage])

  // Initialize VAPI
  useEffect(() => {
    const initializeVAPI = async () => {
      if (!publicKey) {
        setError('VAPI public key not found. Please add VITE_VAPI_PUBLIC_KEY to your .env file')
        return
      }

      if (!configWorkflowId && !configAssistantId) {
        setError('Workflow or Assistant ID not found. Set VITE_VAPI_VIDEO_WORKFLOW_ID (or VITE_VAPI_WORKFLOW_ID) in .env')
        return
      }

      try {
        // Dynamically import VAPI
        const Vapi = (await import('@vapi-ai/web')).default
        logger.info('🔧 Initializing VAPI with public key:', publicKey.substring(0, 8) + '...')
        
        // Initialize VAPI with proper audio configuration to prevent feedback
        vapiRef.current = new Vapi(publicKey)
        
        // Note: Audio settings configuration may not be available in all VAPI versions
        // The VAPI SDK handles audio configuration internally
        
        // Set up event listeners
        vapiRef.current.on('call-start', () => {
          logger.info('✅ Call started successfully')
          setIsConnected(true)
          setIsLoading(false)
          setError(null)
          setIsListening(true)
          setStatusMessage('Connected - I\'m listening')
          addMessage('system', 'Call started. You can start speaking now!')
          addMessage('assistant', 'Hello! I\'m your AI assistant. How can I help you today?')
        })

        vapiRef.current.on('call-end', () => {
          logger.info('📞 Call ended by VAPI')
          setIsConnected(false)
          setIsLoading(false)
          setIsSpeaking(false)
          setIsListening(false)
          setIsMuted(false)
          setStatusMessage('Call ended')
          addMessage('system', 'Call ended. Click "Start Call" to begin a new conversation.')
          // Clean up session manager
          vapiSessionManager.endCall('homepage')
          // Nullify the VAPI reference to ensure clean state
          vapiRef.current = null
        })

        vapiRef.current.on('speech-start', (data: any) => {
          logger.debug('🎤 Speech started:', data)
          if (data.role === 'assistant') {
            setIsSpeaking(true)
            setIsListening(false)
            setStatusMessage('AI is speaking...')
          } else if (data.role === 'user') {
            setIsListening(false)
            setStatusMessage('You are speaking...')
          }
        })

        vapiRef.current.on('speech-end', (data: any) => {
          logger.debug('🔇 Speech ended:', data)
          if (data.role === 'assistant') {
            setIsSpeaking(false)
            setIsListening(true)
            setStatusMessage('I\'m listening...')
          } else if (data.role === 'user') {
            setIsListening(true)
            setStatusMessage('I\'m listening...')
          }
        })

        // Alternative event listeners for better compatibility
        vapiRef.current.on('user-speech-start', () => {
          logger.debug('🎤 User started speaking (alternative)')
          setIsListening(false)
          setStatusMessage('You are speaking...')
        })

        vapiRef.current.on('user-speech-end', () => {
          logger.debug('🔇 User finished speaking (alternative)')
          setIsListening(true)
          setStatusMessage('I\'m listening...')
        })

        vapiRef.current.on('message', (message: any) => {
          logger.debug('💬 Message received:', message)
          
          // Handle transcript messages
          if (message.type === 'transcript') {
            if (message.transcriptType === 'final') {
              const role = message.role || 'user'
              const text = message.transcript || message.text || ''
              if (text) {
                addMessage(role === 'assistant' ? 'assistant' : 'user', text)
              }
            }
          }
          
          // Handle conversation updates
          if (message.type === 'conversation-update') {
            logger.debug('Conversation update:', message)
          }
        })

        vapiRef.current.on('error', (error: any) => {
          logger.error('❌ VAPI Error:', error)
          logger.error('❌ VAPI Error Details:', JSON.stringify(error, null, 2))
          
          let errorMessage = 'Unknown VAPI error'
          if (error.errorMsg) {
            errorMessage = error.errorMsg
          } else if (error.message) {
            errorMessage = error.message
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message
          } else if (typeof error === 'string') {
            errorMessage = error
          } else if (error.type === 'start-method-error') {
            errorMessage = `Start method error: ${error.error?.message || 'Failed to start call'}`
          }
          
          setError(`VAPI Error: ${errorMessage}`)
          setIsConnected(false)
          setIsLoading(false)
          setIsSpeaking(false)
          setIsListening(false)
          setIsMuted(false)
          setStatusMessage('Error occurred. Please try again.')
          
          // Clean up session manager on error
          vapiSessionManager.endCall('homepage')
        })

        setIsInitialized(true)
        setStatusMessage('Ready to help! Click to start talking.')
        logger.info('✅ VAPI initialized successfully')

      } catch (err: any) {
        logger.error('Failed to initialize VAPI:', err)
        setError(`Failed to initialize VAPI: ${err.message}`)
        setStatusMessage('Failed to initialize. Please check your configuration.')
      }
    }

    initializeVAPI()

    // Cleanup function
    return () => {
      if (vapiRef.current) {
        logger.debug('🧹 Cleaning up VAPI...')
        try {
          if (isConnected) {
            vapiRef.current.stop()
          }
        } catch (err) {
          logger.error('Error during cleanup:', err)
        }
        vapiRef.current.removeAllListeners()
        vapiRef.current = null
      }
    }
  }, [publicKey, configWorkflowId, addMessage])

  const startCall = async () => {
    if (!vapiRef.current || !isInitialized) {
      setError('VAPI not initialized')
      return
    }

    if (!configWorkflowId && !configAssistantId) {
      setError('Workflow ID or Assistant ID is missing. Please check your .env file.')
      return
    }

    // Check if another assistant is already in a call
    if (!vapiSessionManager.startCall('homepage')) {
      setError('Another assistant is already in a call. Please end that call first.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setStatusMessage('Connecting...')
      
      // Prevent audio feedback before starting call
      await preventAudioFeedback()
      
      logger.info('🚀 Starting VAPI call with:', { workflowId: configWorkflowId, assistantId: configAssistantId })

      // Try multiple start signatures to support SDK variations
      const tryStartSequence = [] as Array<() => Promise<any>>
      if (configAssistantId) {
        tryStartSequence.push(() => vapiRef.current.start(configAssistantId))
        tryStartSequence.push(() => vapiRef.current.start({ assistant: { id: configAssistantId } }))
      }
      if (configWorkflowId) {
        tryStartSequence.push(() => vapiRef.current.start(configWorkflowId))
        tryStartSequence.push(() => vapiRef.current.start({ assistant: { workflow: { id: configWorkflowId } } }))
      }
      if (tryStartSequence.length === 0) throw new Error('Missing workflow/assistant id')

      let started = false
      let lastError: any = null
      for (const startAttempt of tryStartSequence) {
        try {
          await startAttempt()
          started = true
          break
        } catch (e) {
          lastError = e
          logger.warn('Start attempt failed, trying next signature...', e)
        }
      }
      if (!started) throw lastError || new Error('Failed to start VAPI call')
      
    } catch (err: any) {
      logger.error('Failed to start call:', err)
      logger.error('Start call error details:', JSON.stringify(err, null, 2))
      setError(`Failed to start call: ${err.message || err.errorMsg || 'Unknown error'}`)
      setIsLoading(false)
      setStatusMessage('Failed to start call. Please try again.')
      
      // Clear the session storage on error
      vapiSessionManager.endCall('homepage')
    }
  }

  const endCall = async () => {
    logger.info('🛑 Attempting to end call...')
    
    if (!vapiRef.current || !isConnected) {
      logger.warn('⚠️ No active VAPI call to stop')
      // Still reset states and clean up session
      setIsConnected(false)
      setIsLoading(false)
      setIsSpeaking(false)
      setIsListening(false)
      setIsMuted(false)
      setStatusMessage('Call ended')
      vapiSessionManager.endCall('homepage')
      return
    }

    // Add a timeout to force cleanup if the call doesn't end within 5 seconds
    const forceCleanupTimeout = setTimeout(() => {
      logger.warn('⚠️ Force cleanup triggered - call did not end within 5 seconds')
      setIsConnected(false)
      setIsLoading(false)
      setIsSpeaking(false)
      setIsListening(false)
      setIsMuted(false)
      setStatusMessage('Call ended (forced)')
      vapiSessionManager.endCall('homepage')
      vapiRef.current = null
    }, 5000)

    try {
      setIsLoading(true)
      setStatusMessage('Ending call...')
      
      logger.info('🛑 Stopping VAPI call...')
      await vapiRef.current.stop()
      logger.info('✅ VAPI stop successful')
      
      // Remove all event listeners before cleanup
      if (vapiRef.current) {
        vapiRef.current.removeAllListeners()
      }
      
    } catch (err) {
      logger.error('❌ Error stopping VAPI call:', err)
      // Continue with cleanup even if stop fails
    } finally {
      // Always perform cleanup
      try {
        // Reset all states
        setIsConnected(false)
        setIsLoading(false)
        setIsSpeaking(false)
        setIsListening(false)
        setIsMuted(false)
        setStatusMessage('Call ended')
        addMessage('system', 'Call ended successfully.')
        
        // Clear session storage and notify other components
        vapiSessionManager.endCall('homepage')
        
        // Nullify the VAPI reference to ensure clean state
        vapiRef.current = null
        
        // Clear the force cleanup timeout since call ended successfully
        clearTimeout(forceCleanupTimeout)
        
        logger.info('✅ Call cleanup completed successfully')
        
      } catch (cleanupErr) {
        logger.error('❌ Error during cleanup:', cleanupErr)
        // Force reset states even if cleanup fails
        setIsConnected(false)
        setIsLoading(false)
        setIsSpeaking(false)
        setIsListening(false)
        setIsMuted(false)
        setStatusMessage('Call ended')
        vapiSessionManager.endCall('homepage')
        vapiRef.current = null
        clearTimeout(forceCleanupTimeout)
      }
    }
  }

  const toggleMute = () => {
    if (vapiRef.current && isConnected) {
      try {
        const newMutedState = !isMuted
        logger.debug(`🔇 ${newMutedState ? 'Muting' : 'Unmuting'} microphone...`)
        vapiRef.current.setMuted(newMutedState)
        setIsMuted(newMutedState)
        setStatusMessage(newMutedState ? 'Microphone muted' : 'Microphone active')
        addMessage('system', newMutedState ? 'Microphone muted' : 'Microphone unmuted')
      } catch (err) {
        logger.error('Error toggling mute:', err)
      }
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right': return 'bottom-6 right-6'
      case 'bottom-left': return 'bottom-6 left-6'
      case 'top-right': return 'top-6 right-6'
      case 'top-left': return 'top-6 left-6'
      default: return 'bottom-6 right-6'
    }
  }

  return (
    <>

      {/* Floating Button */}
      <motion.div 
        className={`fixed ${getPositionClasses()} z-50`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isVisible && !isInHeroSection && !isInFooterSection ? 1 : 0,
          scale: isVisible && !isInHeroSection && !isInFooterSection ? 1 : 0.8,
          y: [0, -12, 0]
        }}
        transition={{ 
          opacity: { duration: 0.3 },
          scale: { duration: 0.3 },
          y: { 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        style={{ pointerEvents: isVisible && !isInHeroSection && !isInFooterSection ? 'auto' : 'none' }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          data-ai-assistant-button
          className={`
            relative w-16 h-16 rounded-full
            shadow-2xl overflow-hidden
            border-2 border-white/30
            hover:scale-110 active:scale-95
            transition-all duration-300
            ${isConnected ? 'ring-4 ring-green-400/50 animate-pulse' : ''}
            ${error ? 'ring-4 ring-red-400/50' : ''}
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          disabled={!isInitialized}
        >
          {/* AI Image Background */}
          <div className="absolute inset-0">
            <img
              src="/images/artificial-8587685_1280.jpg"
              alt="AI Assistant"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" style={{ display: 'none' }}></div>
            {/* Gradient overlay - always present when button is visible */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 transition-opacity duration-300"></div>
          </div>
          
          {/* Pulse effect when connected */}
          {isConnected && (
            <motion.div
              className="absolute inset-0 rounded-full bg-green-400/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={`
              fixed w-[420px] h-[650px] rounded-3xl shadow-2xl flex flex-col overflow-hidden
              ${position.includes('right') ? 'right-6' : 'left-6'}
              ${position.includes('bottom') ? 'bottom-6' : 'top-6'}
              bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
              border border-gray-700/50 backdrop-blur-xl z-50
            `}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 px-6 py-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden">
                      <img
                        src="/images/artificial-8587685_1280.jpg"
                        alt="AI Assistant"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isConnected && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white leading-tight mb-0.5">
                      AI Assistant
                    </h3>
                    <p className="text-gray-400 text-sm leading-tight truncate">
                      {statusMessage}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-all duration-200 flex-shrink-0 group"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 py-3 bg-red-500/10 border-b border-red-500/20"
                >
                  <div className="flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-gray-900/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 rounded-3xl overflow-hidden mb-6 shadow-2xl"
                  >
                    <img
                      src="/images/artificial-8587685_1280.jpg"
                      alt="AI Assistant"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <h4 className="text-xl font-bold text-white mb-2">Ready to Chat!</h4>
                  <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">
                    Click <span className="text-green-400 font-semibold">"Start Call"</span> below to begin a voice conversation
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'} ${
                      message.type === 'system' ? 'justify-center' : ''
                    }`}
                  >
                    {message.type === 'system' ? (
                      <div className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-full text-xs max-w-xs text-center backdrop-blur-sm border border-gray-600/30">
                        {message.content}
                      </div>
                    ) : (
                      <>
                        {message.type === 'assistant' && (
                          <div className="w-9 h-9 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                            <img
                              src="/images/artificial-8587685_1280.jpg"
                              alt="AI Assistant"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl shadow-xl ${
                            message.type === 'user'
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
                              : 'bg-gray-800 text-gray-100 border border-gray-700/50 rounded-bl-sm'
                          }`}
                        >
                          <div className="px-4 py-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {message.type === 'user' && (
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Status Indicator */}
            <AnimatePresence>
              {isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-t border-green-500/20"
                >
                  <div className="flex items-center justify-center gap-3">
                    {isSpeaking ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                        <span className="font-semibold text-green-400 text-sm">AI is speaking...</span>
                      </>
                    ) : isListening ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50" />
                        <span className="font-semibold text-blue-400 text-sm">Listening...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                        <span className="font-semibold text-green-400 text-sm">Connected</span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="px-6 py-5 border-t border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
              <div className="flex gap-3">
                {!isConnected ? (
                  <motion.button
                    onClick={startCall}
                    disabled={isLoading || !isInitialized}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 font-bold text-base shadow-2xl shadow-green-500/20 hover:shadow-green-500/40 border border-green-500/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-6 h-6" />
                        <span>Start Call</span>
                      </>
                    )}
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      onClick={toggleMute}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-5 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 font-bold shadow-xl border ${
                        isMuted
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-orange-500/20 hover:shadow-orange-500/40 border-orange-500/30'
                          : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white shadow-gray-500/20 hover:shadow-gray-500/40 border-gray-500/30'
                      }`}
                    >
                      {isMuted ? <VolumeX className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full bg-white" />}
                    </motion.button>
                    <motion.button
                      onClick={endCall}
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      className={`flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl hover:from-red-500 hover:to-rose-500 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-base shadow-2xl shadow-red-500/20 hover:shadow-red-500/40 border border-red-500/20 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Ending...</span>
                        </>
                      ) : (
                        <>
                          <PhoneOff className="w-6 h-6" />
                          <span>End Call</span>
                        </>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default VAPIAssistant