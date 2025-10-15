import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Mic, 
  MicOff,
  Bot,
  Loader2,
  MessageSquare,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff
} from 'lucide-react'

interface WorkingVAPIAssistantProps {
  workflowId: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const WorkingVAPIAssistant: React.FC<WorkingVAPIAssistantProps> = ({ 
  workflowId, 
  position = 'bottom-right' 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('Ready to help!')
  const [isInitialized, setIsInitialized] = useState(false)
  
  const vapiRef = useRef<any>(null)
  const [messages, setMessages] = useState<Array<{id: string, type: 'user' | 'assistant', content: string, timestamp: Date}>>([])

  // Get configuration from environment
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY || ''
  const configWorkflowId = workflowId || import.meta.env.VITE_VAPI_WORKFLOW_ID || ''

  // Show/hide based on scroll position (hide on hero section)
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.8
      setIsVisible(window.scrollY > heroHeight)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Initialize VAPI
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
          setIsConnected(true)
          setIsLoading(false)
          setError(null)
          setStatusMessage('Connected! I\'m listening...')
          addMessage('assistant', 'Hello! I\'m your AI assistant. How can I help you today?')
        })

        vapiRef.current.on('call-end', () => {
          console.log('📞 Call ended')
          setIsConnected(false)
          setIsLoading(false)
          setStatusMessage('Call ended. Click to start a new conversation!')
          addMessage('assistant', 'Call ended. Thank you for chatting with me!')
        })

        vapiRef.current.on('speech-start', () => {
          console.log('🎤 Assistant started speaking')
          setStatusMessage('I\'m speaking...')
        })

        vapiRef.current.on('speech-end', () => {
          console.log('🔇 Assistant finished speaking')
          setStatusMessage('Your turn to speak!')
        })

        vapiRef.current.on('message', (message: any) => {
          console.log('💬 Message received:', message)
          if (message.type === 'transcript' && message.transcriptType === 'final') {
            addMessage('user', message.transcript)
          }
        })

        vapiRef.current.on('error', (error: any) => {
          console.error('❌ VAPI Error:', error)
          setError(`VAPI Error: ${JSON.stringify(error)}`)
          setIsConnected(false)
          setIsLoading(false)
          setStatusMessage('Error occurred. Please try again.')
        })

        setIsInitialized(true)
        setStatusMessage('Ready to help! Click to start talking.')
        console.log('✅ VAPI initialized successfully')

      } catch (err: any) {
        console.error('Failed to initialize VAPI:', err)
        setError(`Failed to initialize VAPI: ${err.message}`)
        setStatusMessage('Failed to initialize. Please check your configuration.')
      }
    }

    initializeVAPI()
  }, [publicKey, configWorkflowId])

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const startCall = async () => {
    if (!vapiRef.current || !isInitialized) {
      setError('VAPI not initialized')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setStatusMessage('Connecting...')
      
      // Try different methods to start the call
      if (configWorkflowId) {
        await vapiRef.current.start({ workflowId: configWorkflowId })
      } else {
        await vapiRef.current.start(configWorkflowId)
      }
      
    } catch (err: any) {
      console.error('Failed to start call:', err)
      setError(`Failed to start call: ${err.message}`)
      setIsLoading(false)
      setStatusMessage('Failed to start call. Please try again.')
    }
  }

  const endCall = async () => {
    if (vapiRef.current && isConnected) {
      try {
        await vapiRef.current.stop()
      } catch (err) {
        console.error('Error ending call:', err)
      }
    }
  }

  const toggleMute = async () => {
    if (vapiRef.current && isConnected) {
      try {
        if (isMuted) {
          await vapiRef.current.unmute()
          setIsMuted(false)
        } else {
          await vapiRef.current.mute()
          setIsMuted(true)
        }
      } catch (err) {
        console.error('Error toggling mute:', err)
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
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.8,
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
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40"></div>
            
            {/* Status Icon Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <Loader2 className="w-7 h-7 text-white animate-spin drop-shadow-lg" />
              </div>
            )}
            {isConnected && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <Mic className="w-7 h-7 text-white drop-shadow-lg" />
              </div>
            )}
            {error && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <Bot className="w-7 h-7 text-red-400 drop-shadow-lg" />
              </div>
            )}
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
            initial={{ opacity: 0, scale: 0.8, x: position.includes('right') ? 50 : -50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: position.includes('right') ? 50 : -50 }}
            transition={{ duration: 0.3 }}
            className={`
              fixed w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col
              ${position.includes('right') ? 'right-6' : 'left-6'}
              ${position.includes('bottom') ? 'bottom-6' : 'top-6'}
              border border-gray-200 z-50
            `}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 text-white ai-assistant-header">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                    <img
                      src="/images/artificial-8587685_1280.jpg"
                      alt="AI Assistant"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight">
                      VAPI AI Assistant
                    </h3>
                    <p className="text-white/80 text-sm leading-tight">
                      {statusMessage}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border-b border-red-200">
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <Bot className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" style={{ maxHeight: '400px' }}>
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Start a conversation with your AI assistant!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-center gap-3">
                {!isConnected ? (
                  <button
                    onClick={startCall}
                    disabled={!isInitialized || isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {isLoading ? 'Connecting...' : 'Start Call'}
                    </span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={toggleMute}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isMuted 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={endCall}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span className="text-sm font-medium">End Call</span>
                    </button>
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

export default WorkingVAPIAssistant
