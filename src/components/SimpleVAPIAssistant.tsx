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

interface SimpleVAPIAssistantProps {
  workflowId?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const SimpleVAPIAssistant: React.FC<SimpleVAPIAssistantProps> = ({
  workflowId,
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('Hi! I\'m your AI assistant. Click to start talking!')
  const [vapi, setVapi] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY || ''
  const configWorkflowId = workflowId || import.meta.env.VITE_VAPI_WORKFLOW_ID || ''

  useEffect(() => {
    const initVAPI = async () => {
      if (!publicKey || !configWorkflowId) {
        setError('Missing VAPI credentials. Please check your .env file.')
        return
      }

      try {
        // Dynamic import
        const Vapi = (await import('@vapi-ai/web')).default
        const vapiInstance = new Vapi(publicKey)
        
        // Event listeners
        vapiInstance.on('call-start', () => {
          console.log('✅ Call started')
          setIsConnected(true)
          setIsLoading(false)
          setError(null)
          setMessage('Connected! I\'m listening...')
        })

        vapiInstance.on('call-end', () => {
          console.log('📞 Call ended')
          setIsConnected(false)
          setIsLoading(false)
          setMessage('Call ended. Click to start again!')
        })

        vapiInstance.on('error', (error: any) => {
          console.error('❌ VAPI Error:', error)
          setError(`Error: ${error.message || 'Unknown error occurred'}`)
          setIsConnected(false)
          setIsLoading(false)
          setMessage('Error occurred. Please try again.')
        })

        vapiInstance.on('speech-start', () => {
          setMessage('I\'m speaking...')
        })

        vapiInstance.on('speech-end', () => {
          setMessage('Your turn to speak!')
        })

        setVapi(vapiInstance)
        setIsInitialized(true)
        setMessage('Ready to help! Click to start talking.')

      } catch (err: any) {
        console.error('Failed to initialize VAPI:', err)
        setError(`Failed to initialize: ${err.message}`)
      }
    }

    initVAPI()
  }, [publicKey, configWorkflowId])

  const startCall = async () => {
    if (!vapi || !isInitialized) {
      setError('VAPI not ready. Please wait...')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setMessage('Connecting...')

      // Try multiple approaches - VAPI expects different format
      const approaches = [
        () => vapi.start(configWorkflowId), // Direct ID (most common)
        () => vapi.start({ workflowId: configWorkflowId }),
        () => vapi.start({ assistantId: configWorkflowId })
      ]

      let lastError = null
      for (let i = 0; i < approaches.length; i++) {
        try {
          console.log(`🔄 Trying approach ${i + 1}...`)
          await approaches[i]()
          console.log(`✅ Success with approach ${i + 1}`)
          return
        } catch (err: any) {
          console.log(`❌ Approach ${i + 1} failed:`, err.message)
          lastError = err
        }
      }

      // All approaches failed
      throw lastError || new Error('All connection methods failed')

    } catch (err: any) {
      console.error('Failed to start call:', err)
      setError(`Connection failed: ${err.message}. You may need to create an Assistant in VAPI dashboard.`)
      setIsLoading(false)
      setMessage('Failed to connect. Please check your VAPI configuration.')
    }
  }

  const endCall = async () => {
    if (vapi) {
      try {
        await vapi.stop()
      } catch (err) {
        console.error('Error ending call:', err)
      }
    }
    setIsConnected(false)
    setIsLoading(false)
    setMessage('Call ended. Click to start again!')
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left': return 'bottom-6 left-6'
      case 'top-right': return 'top-6 right-6'
      case 'top-left': return 'top-6 left-6'
      default: return 'bottom-6 right-6'
    }
  }

  if (!publicKey || !configWorkflowId) {
    return null
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      {/* Main Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full
          bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500
          shadow-2xl flex items-center justify-center
          border-2 border-white/20
          hover:scale-110 active:scale-95
          transition-all duration-300
          ${isConnected ? 'ring-4 ring-green-400/50 animate-pulse' : ''}
          ${!isInitialized ? 'opacity-50' : ''}
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        disabled={!isInitialized}
      >
        {!isInitialized ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : isLoading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : isConnected ? (
          <Mic className="w-6 h-6 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className={`
              absolute ${position.includes('right') ? 'right-0' : 'left-0'} 
              ${position.includes('bottom') ? 'bottom-20' : 'top-20'}
              w-80 bg-gradient-to-br from-zinc-900 to-zinc-950
              rounded-2xl shadow-2xl border-2 border-white/10
              overflow-hidden backdrop-blur-xl
            `}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    {isConnected ? <Mic className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">AI Assistant</h3>
                    <p className="text-white/80 text-sm">
                      {isConnected ? 'Connected' : 'Ready to help'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Message */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5" />
                  <p className="text-white/90 text-sm">{message}</p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">Error:</p>
                      <p className="text-red-300 text-xs mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Button */}
              <motion.button
                onClick={isConnected ? endCall : startCall}
                disabled={isLoading || !isInitialized}
                className={`
                  w-full py-3 px-4 rounded-lg font-semibold
                  flex items-center justify-center gap-2
                  transition-all duration-300
                  ${isConnected 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  <>
                    <PhoneOff className="w-4 h-4" />
                    End Call
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    Start Voice Chat
                    <Sparkles className="w-3 h-3" />
                  </>
                )}
              </motion.button>

              {/* Instructions */}
              {!isConnected && !error && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs text-center">
                    💡 Click "Start Voice Chat" to begin talking with AI
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-white/5 border-t border-white/10">
              <p className="text-white/40 text-xs text-center">
                Powered by VAPI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SimpleVAPIAssistant
