import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Loader2,
  Phone,
  PhoneOff,
  AlertCircle,
  VolumeX,
  User,
  Send
} from 'lucide-react'
import { useVideoEditor } from '../contexts/VideoEditorContext'
import { vapiSessionManager } from '../services/vapiSessionManager'
import toast from 'react-hot-toast'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface VideoEditorVAPIAssistantProps {
  workflowId?: string
  assistantId?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const VideoEditorVAPIAssistant: React.FC<VideoEditorVAPIAssistantProps> = ({
  workflowId,
  assistantId,
  position = 'bottom-left'
}) => {
  console.log('🎬 VideoEditorVAPIAssistant rendering...', { workflowId, assistantId, position })
  
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('Ready to edit!')
  const [isInitialized, setIsInitialized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [textInput, setTextInput] = useState('')
  
  const vapiRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Get video editor context (direct subscription)
  const {
    clips,
    updateClip,
    selectedClipId,
    setSelectedClipId,
    setIsPlaying,
    setCurrentTime,
    currentTime,
    addClip,
    removeClip,
    setPlaybackRate,
    setZoom,
    zoom
  } = useVideoEditor()

  // Ensure a target clip is always selected when clips are present
  useEffect(() => {
    if (!selectedClipId && clips.length > 0) {
      setSelectedClipId(clips[0].id)
    }
  }, [clips, selectedClipId, setSelectedClipId])

  // Get configuration from environment or props
  const publicKey =
    import.meta.env.VITE_VAPI_VIDEO_PUBLIC_KEY ||
    import.meta.env.VITE_VAPI_PUBLIC_KEY ||
    ''
  // Prefer video editor specific workflow/assistant ids with fallbacks
  const configWorkflowId =
    workflowId ||
    import.meta.env.VITE_VAPI_VIDEO_WORKFLOW_ID ||
    import.meta.env.VITE_VAPI_WORKFLOW_ID ||
    ''
  const configAssistantId =
    assistantId ||
    import.meta.env.VITE_VAPI_VIDEO_ASSISTANT_ID ||
    ''

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

  // Process video editing commands
  const processCommand = async (command: string): Promise<string> => {
    const lowerCommand = command.toLowerCase()

    // Get selected clip or first clip
    const targetClip = selectedClipId 
      ? clips.find(c => c.id === selectedClipId)
      : clips[0]

    if (!targetClip && !lowerCommand.includes('add') && !lowerCommand.includes('create') && !lowerCommand.includes('play') && !lowerCommand.includes('pause') && !lowerCommand.includes('zoom')) {
      return 'Please select a clip first or upload a video to get started.'
    }

    // BRIGHTNESS COMMANDS
    if (lowerCommand.includes('brightness') || lowerCommand.includes('brighter') || lowerCommand.includes('darker')) {
      if (!targetClip) return 'No clip selected to adjust brightness'
      
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 20
      
      if (lowerCommand.includes('increase') || lowerCommand.includes('brighter') || lowerCommand.includes('brighten')) {
        const currentFilters = (targetClip as any).filters || {}
        const currentBrightness = currentFilters.brightness || 100
        const newBrightness = Math.min(200, currentBrightness + value)
        
        updateClip(targetClip.id, {
          ...targetClip,
          filters: { ...currentFilters, brightness: newBrightness }
        } as any)
        
        const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
        if (videoElement) {
          videoElement.style.filter = `brightness(${newBrightness}%)`
        }
        
        toast.success(`✅ Brightness increased to ${newBrightness}%`)
        return `✅ Increased brightness to ${newBrightness}% for "${targetClip.name}"`
      } else if (lowerCommand.includes('decrease') || lowerCommand.includes('darker') || lowerCommand.includes('darken')) {
        const currentFilters = (targetClip as any).filters || {}
        const currentBrightness = currentFilters.brightness || 100
        const newBrightness = Math.max(0, currentBrightness - value)
        
        updateClip(targetClip.id, {
          ...targetClip,
          filters: { ...currentFilters, brightness: newBrightness }
        } as any)
        
        const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
        if (videoElement) {
          videoElement.style.filter = `brightness(${newBrightness}%)`
        }
        
        toast.success(`✅ Brightness decreased to ${newBrightness}%`)
        return `✅ Decreased brightness to ${newBrightness}% for "${targetClip.name}"`
      }
    }

    // CONTRAST COMMANDS
    if (lowerCommand.includes('contrast')) {
      if (!targetClip) return 'No clip selected to adjust contrast'
      
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 15
      
      if (lowerCommand.includes('increase') || lowerCommand.includes('more')) {
        const currentFilters = (targetClip as any).filters || {}
        const currentContrast = currentFilters.contrast || 100
        const newContrast = Math.min(200, currentContrast + value)
        
        updateClip(targetClip.id, {
          ...targetClip,
          filters: { ...currentFilters, contrast: newContrast }
        } as any)
        
        const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
        if (videoElement) {
          const brightness = (currentFilters.brightness || 100)
          const saturation = (currentFilters.saturation || 100)
          videoElement.style.filter = `brightness(${brightness}%) contrast(${newContrast}%) saturate(${saturation}%)`
        }
        
        toast.success(`✅ Contrast increased to ${newContrast}%`)
        return `✅ Increased contrast to ${newContrast}% for "${targetClip.name}"`
      } else if (lowerCommand.includes('decrease') || lowerCommand.includes('less')) {
        const currentFilters = (targetClip as any).filters || {}
        const currentContrast = currentFilters.contrast || 100
        const newContrast = Math.max(0, currentContrast - value)
        
        updateClip(targetClip.id, {
          ...targetClip,
          filters: { ...currentFilters, contrast: newContrast }
        } as any)
        
        const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
        if (videoElement) {
          const brightness = (currentFilters.brightness || 100)
          const saturation = (currentFilters.saturation || 100)
          videoElement.style.filter = `brightness(${brightness}%) contrast(${newContrast}%) saturate(${saturation}%)`
        }
        
        toast.success(`✅ Contrast decreased to ${newContrast}%`)
        return `✅ Decreased contrast to ${newContrast}% for "${targetClip.name}"`
      }
    }

    // SATURATION COMMANDS
    if (lowerCommand.includes('saturation') || lowerCommand.includes('colorful') || lowerCommand.includes('vibrant')) {
      if (!targetClip) return 'No clip selected to adjust saturation'
      
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 15
      
      if (lowerCommand.includes('increase') || lowerCommand.includes('more')) {
        const currentFilters = (targetClip as any).filters || {}
        const currentSaturation = currentFilters.saturation || 100
        const newSaturation = Math.min(200, currentSaturation + value)
        
        updateClip(targetClip.id, {
          ...targetClip,
          filters: { ...currentFilters, saturation: newSaturation }
        } as any)
        
        const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
        if (videoElement) {
          const brightness = (currentFilters.brightness || 100)
          const contrast = (currentFilters.contrast || 100)
          videoElement.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${newSaturation}%)`
        }
        
        toast.success(`✅ Saturation increased to ${newSaturation}%`)
        return `✅ Increased saturation to ${newSaturation}% for "${targetClip.name}"`
      } else if (lowerCommand.includes('decrease') || lowerCommand.includes('less')) {
        const currentFilters = (targetClip as any).filters || {}
        const currentSaturation = currentFilters.saturation || 100
        const newSaturation = Math.max(0, currentSaturation - value)
        
        updateClip(targetClip.id, {
          ...targetClip,
          filters: { ...currentFilters, saturation: newSaturation }
        } as any)
        
        const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
        if (videoElement) {
          const brightness = (currentFilters.brightness || 100)
          const contrast = (currentFilters.contrast || 100)
          videoElement.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${newSaturation}%)`
        }
        
        toast.success(`✅ Saturation decreased to ${newSaturation}%`)
        return `✅ Decreased saturation to ${newSaturation}% for "${targetClip.name}"`
      }
    }

    // VOLUME COMMANDS
    if (lowerCommand.includes('volume')) {
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 50
      
      if (lowerCommand.includes('increase') || lowerCommand.includes('up') || lowerCommand.includes('louder')) {
        const mediaElements = document.querySelectorAll('video, audio')
        mediaElements.forEach((element: any) => {
          element.volume = Math.min(1, value / 100)
        })
        toast.success(`✅ Volume increased to ${value}%`)
        return `✅ Increased volume to ${value}%`
      } else if (lowerCommand.includes('decrease') || lowerCommand.includes('down') || lowerCommand.includes('lower')) {
        const mediaElements = document.querySelectorAll('video, audio')
        mediaElements.forEach((element: any) => {
          element.volume = Math.min(1, value / 100)
        })
        toast.success(`✅ Volume decreased to ${value}%`)
        return `✅ Decreased volume to ${value}%`
      } else if (lowerCommand.includes('set')) {
        const mediaElements = document.querySelectorAll('video, audio')
        mediaElements.forEach((element: any) => {
          element.volume = Math.min(1, value / 100)
        })
        toast.success(`✅ Volume set to ${value}%`)
        return `✅ Set volume to ${value}%`
      } else if (lowerCommand.includes('mute')) {
        const mediaElements = document.querySelectorAll('video, audio')
        mediaElements.forEach((element: any) => {
          element.muted = true
        })
        toast.success('✅ Audio muted')
        return `✅ Muted all audio`
      } else if (lowerCommand.includes('unmute')) {
        const mediaElements = document.querySelectorAll('video, audio')
        mediaElements.forEach((element: any) => {
          element.muted = false
        })
        toast.success('✅ Audio unmuted')
        return `✅ Unmuted all audio`
      }
    }

    // SPEED/PLAYBACK RATE COMMANDS
    if (lowerCommand.includes('speed') || lowerCommand.includes('slow') || lowerCommand.includes('fast')) {
      if (lowerCommand.includes('slow')) {
        setPlaybackRate(0.5)
        toast.success('✅ Slowed down to 0.5x')
        return '✅ Slowed down to 0.5x'
      } else if (lowerCommand.includes('fast')) {
        setPlaybackRate(2)
        toast.success('✅ Sped up to 2x')
        return '✅ Sped up to 2x'
      } else {
        const match = lowerCommand.match(/(\d+(\.\d+)?)(x)?/)
        const speed = match ? parseFloat(match[1]) : 1
        setPlaybackRate(speed)
        toast.success(`✅ Speed set to ${speed}x`)
        return `✅ Set speed to ${speed}x`
      }
    }

    // PLAYBACK CONTROL COMMANDS
    if (lowerCommand.includes('play') && !lowerCommand.includes('playback')) {
      setIsPlaying(true)
      toast.success('✅ Playing video')
      return '✅ Playing video'
    } else if (lowerCommand.includes('pause') || lowerCommand.includes('stop')) {
      setIsPlaying(false)
      toast.success('✅ Paused video')
      return '✅ Paused video'
    }

    // SEEK/JUMP COMMANDS
    if (lowerCommand.includes('jump') || lowerCommand.includes('go to') || lowerCommand.includes('seek')) {
      const match = lowerCommand.match(/(\d+)/)
      if (match) {
        const seconds = parseInt(match[0])
        setCurrentTime(seconds)
        toast.success(`✅ Jumped to ${seconds} seconds`)
        return `✅ Jumped to ${seconds} seconds`
      }
    }

    // ZOOM COMMANDS
    if (lowerCommand.includes('zoom')) {
      if (lowerCommand.includes('in')) {
        const newZoom = Math.min(200, zoom + 20)
        setZoom(newZoom)
        toast.success(`✅ Zoomed in to ${newZoom}%`)
        return `✅ Zoomed in to ${newZoom}%`
      } else if (lowerCommand.includes('out')) {
        const newZoom = Math.max(50, zoom - 20)
        setZoom(newZoom)
        toast.success(`✅ Zoomed out to ${newZoom}%`)
        return `✅ Zoomed out to ${newZoom}%`
      }
    }

    // FILTER/EFFECT COMMANDS
    if (lowerCommand.includes('filter') || lowerCommand.includes('effect') || lowerCommand.includes('blur') || lowerCommand.includes('sepia') || lowerCommand.includes('grayscale') || lowerCommand.includes('vintage') || lowerCommand.includes('warm') || lowerCommand.includes('cool')) {
      if (!targetClip) return 'No clip selected to apply effects'
      
      const videoElement = (document.querySelector(`[data-clip-id="${targetClip.id}"] video`) || document.querySelector('video')) as HTMLVideoElement
      if (!videoElement) return 'No video element found'
      
      const currentFilters = (targetClip as any).filters || {}
      let filterString = ''
      let effectName = ''
      
      if (lowerCommand.includes('blur')) {
        filterString = `blur(5px)`
        effectName = 'blur'
        currentFilters.blur = true
      } else if (lowerCommand.includes('sepia')) {
        filterString = `sepia(100%)`
        effectName = 'sepia'
        currentFilters.sepia = true
      } else if (lowerCommand.includes('grayscale') || lowerCommand.includes('black and white')) {
        filterString = `grayscale(100%)`
        effectName = 'grayscale'
        currentFilters.grayscale = true
      } else if (lowerCommand.includes('invert')) {
        filterString = `invert(100%)`
        effectName = 'invert'
        currentFilters.invert = true
      } else if (lowerCommand.includes('vintage') || lowerCommand.includes('old')) {
        filterString = `sepia(50%) contrast(110%) brightness(110%)`
        effectName = 'vintage'
        currentFilters.vintage = true
      } else if (lowerCommand.includes('warm')) {
        filterString = `sepia(30%) saturate(130%)`
        effectName = 'warm'
        currentFilters.warm = true
      } else if (lowerCommand.includes('cool')) {
        filterString = `hue-rotate(180deg) saturate(110%)`
        effectName = 'cool'
        currentFilters.cool = true
      }
      
      if (filterString) {
        const brightness = currentFilters.brightness || 100
        const contrast = currentFilters.contrast || 100
        const saturation = currentFilters.saturation || 100
        
        videoElement.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${filterString}`
        
        updateClip(targetClip.id, {
          ...targetClip,
          filters: currentFilters
        } as any)
        
        toast.success(`✅ Applied ${effectName} effect`)
        return `✅ Applied ${effectName} effect to "${targetClip.name}"`
      }
      
      return 'Available effects: blur, sepia, grayscale, invert, vintage, warm, cool'
    }

    // CUT/SPLIT COMMANDS
    if (lowerCommand.includes('cut') || lowerCommand.includes('split')) {
      if (!targetClip) return 'No clip selected to cut'
      
      const cutTime = currentTime
      
      if (cutTime > targetClip.startTime && cutTime < targetClip.endTime) {
        const newClip = {
          trackId: targetClip.trackId,
          name: `${targetClip.name} (2)`,
          type: targetClip.type,
          startTime: cutTime,
          endTime: targetClip.endTime,
          duration: targetClip.endTime - cutTime,
          file: targetClip.file,
          url: targetClip.url,
          content: targetClip.content,
          waveform: targetClip.waveform
        }
        
        updateClip(targetClip.id, { 
          endTime: cutTime,
          duration: cutTime - targetClip.startTime
        })
        
        addClip(newClip)
        
        toast.success('✅ Clip cut successfully')
        return `✅ Cut clip "${targetClip.name}" at ${cutTime.toFixed(2)}s`
      } else {
        return 'Current time is not within the clip boundaries'
      }
    }

    // DELETE/REMOVE COMMANDS
    if (lowerCommand.includes('delete') || lowerCommand.includes('remove')) {
      if (!targetClip) return 'No clip selected to delete'
      
      removeClip(targetClip.id)
      toast.success('✅ Clip deleted')
      return `✅ Deleted clip "${targetClip.name}"`
    }

    // RESET/CLEAR FILTERS
    if (lowerCommand.includes('reset') || lowerCommand.includes('clear')) {
      if (!targetClip) return 'No clip selected'
      
      const videoElement = document.querySelector('video') as HTMLVideoElement
      if (videoElement) {
        videoElement.style.filter = 'none'
      }
      
      updateClip(targetClip.id, {
        ...targetClip,
        filters: {}
      } as any)
      
      toast.success('✅ All filters cleared')
      return `✅ Cleared all filters from "${targetClip.name}"`
    }

    // Default response
    return `I understand you want to: "${command}". Try these commands:

✅ Brightness: "increase brightness by 20", "make it darker"
✅ Contrast: "add more contrast", "decrease contrast"
✅ Saturation: "make it more colorful", "increase saturation"
✅ Effects: "add blur effect", "apply sepia filter", "vintage effect"
✅ Volume: "set volume to 80", "mute audio"
✅ Playback: "play", "pause", "speed up to 2x"
✅ Navigation: "jump to 30 seconds", "zoom in"
✅ Editing: "cut here", "delete clip", "reset filters"`
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add welcome message when panel opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('assistant', 'Welcome! I\'m your Video Editor AI Assistant. I can help you edit videos with voice and text commands!')
      addMessage('system', 'Try: "increase brightness", "add blur effect", "play video", or click "Start Voice" to use voice commands')
    }
  }, [isOpen])

  // Listen for call end events from other assistants and page navigation
  useEffect(() => {
    const handleCallEnded = (event: CustomEvent) => {
      if (event.detail.source !== 'video-editor-assistant' && isConnected) {
        console.log('📞 Call ended by another assistant, cleaning up video editor...')
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
      console.log('🚪 Video editor page unloading, cleaning up VAPI...')
      if (vapiRef.current && isConnected) {
        try {
          vapiRef.current.stop()
        } catch (err) {
          console.error('Error stopping VAPI on page unload:', err)
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
        event.returnValue = 'You have an active video editing session. Are you sure you want to leave?'
        return 'You have an active video editing session. Are you sure you want to leave?'
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
        setError('VAPI public key not found. Set VITE_VAPI_VIDEO_PUBLIC_KEY or VITE_VAPI_PUBLIC_KEY in .env')
        return
      }

      if (!configWorkflowId && !configAssistantId) {
        setError('Workflow or Assistant ID not found. Set VITE_VAPI_VIDEO_WORKFLOW_ID (or VITE_VAPI_WORKFLOW_ID) in .env')
        return
      }

      try {
        // Dynamically import VAPI
        const Vapi = (await import('@vapi-ai/web')).default
        console.log('🔧 Initializing Video Editor VAPI with public key:', publicKey.substring(0, 8) + '...')
        
        // Initialize VAPI with proper audio configuration to prevent feedback
        vapiRef.current = new Vapi(publicKey)
        
        // Note: Audio settings configuration may not be available in all VAPI versions
        // The VAPI SDK handles audio configuration internally
        
        // Set up event listeners
        vapiRef.current.on('call-start', () => {
          console.log('✅ Video Editor Call started successfully')
          setIsConnected(true)
          setIsLoading(false)
          setError(null)
          setIsListening(true)
          setStatusMessage('Connected - Ready to edit')
          addMessage('system', 'Video editing assistant is ready!')
          addMessage('assistant', 'Hello! I\'m your video editing assistant. I can help you adjust brightness, add effects, cut clips, and more. Try saying "Increase brightness" or "Add blur effect"!')
        })

        vapiRef.current.on('call-end', () => {
          console.log('📞 Video Editor Call ended by VAPI')
          setIsConnected(false)
          setIsLoading(false)
          setIsSpeaking(false)
          setIsListening(false)
          setIsMuted(false)
          setStatusMessage('Call ended')
          addMessage('system', 'Video editing session ended. Click "Start Editing" to continue.')
          // Clean up session manager
          vapiSessionManager.endCall('video-editor')
          // Ensure clean state
          try { vapiRef.current?.removeAllListeners?.() } catch {}
          vapiRef.current = null
        })

        vapiRef.current.on('speech-start', (data: any) => {
          console.log('🎤 Video Editor Speech started:', data)
          if (data.role === 'assistant') {
            setIsSpeaking(true)
            setIsListening(false)
            setStatusMessage('Assistant is speaking...')
          } else if (data.role === 'user') {
            setIsListening(false)
            setStatusMessage('You are speaking...')
          }
        })

        vapiRef.current.on('speech-end', (data: any) => {
          console.log('🔇 Video Editor Speech ended:', data)
          if (data.role === 'assistant') {
            setIsSpeaking(false)
            setIsListening(true)
            setStatusMessage('Listening for commands...')
          } else if (data.role === 'user') {
            setIsListening(true)
            setStatusMessage('Listening for commands...')
          }
        })

        // Alternative event listeners for better compatibility
        vapiRef.current.on('user-speech-start', () => {
          console.log('🎤 User started speaking (alternative)')
          setIsListening(false)
          setStatusMessage('You are speaking...')
        })

        vapiRef.current.on('user-speech-end', () => {
          console.log('🔇 User finished speaking (alternative)')
          setIsListening(true)
          setStatusMessage('Listening for commands...')
        })

        vapiRef.current.on('message', async (message: any) => {
          console.log('💬 Video Editor Message received:', message)
          
          // Handle transcript messages
          if (message.type === 'transcript') {
            if (message.transcriptType === 'final') {
              const role = message.role || 'user'
              const text = message.transcript || message.text || ''
              if (text) {
                addMessage(role === 'assistant' ? 'assistant' : 'user', text)
                
                // Process user commands automatically
                if (role === 'user') {
                  try {
                    const response = await processCommand(text)
                    addMessage('system', response)
                  } catch (error: any) {
                    console.error('Error processing command:', error)
                    addMessage('system', `Error: ${error.message}`)
                  }
                }
              }
            }
          }
          
          // Handle conversation updates
          if (message.type === 'conversation-update') {
            console.log('Conversation update:', message)
          }
        })

        vapiRef.current.on('error', (error: any) => {
          console.error('❌ Video Editor VAPI Error:', error)
          console.error('❌ Video Editor VAPI Error Details:', JSON.stringify(error, null, 2))
          
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
          setStatusMessage('Error occurred. Please try again.')
        })

        setIsInitialized(true)
        setStatusMessage('Ready to edit! Click to start.')
        console.log('✅ Video Editor VAPI initialized successfully')

      } catch (err: any) {
        console.error('Failed to initialize Video Editor VAPI:', err)
        setError(`Failed to initialize VAPI: ${err.message}`)
        setStatusMessage('Failed to initialize. Please check your configuration.')
      }
    }

    initializeVAPI()

    // Cleanup function
    return () => {
      if (vapiRef.current) {
        console.log('🧹 Cleaning up Video Editor VAPI...')
        try {
          vapiRef.current.stop()
        } catch (err) {
          console.error('Error during cleanup:', err)
        }
        vapiRef.current.removeAllListeners()
        vapiRef.current = null
      }
    }
  }, [publicKey, configWorkflowId, configAssistantId])

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
    if (!vapiSessionManager.startCall('video-editor')) {
      setError('Another assistant is already in a call. Please end that call first.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setStatusMessage('Connecting...')
      
      console.log('🚀 Starting Video Editor VAPI call with:', { workflowId: configWorkflowId, assistantId: configAssistantId })
      
      // Start call using workflow id string (preferred)
      if (configWorkflowId) {
        await vapiRef.current.start(configWorkflowId)
      } else if (configAssistantId) {
        await vapiRef.current.start(configAssistantId)
      } else {
        throw new Error('Missing workflow/assistant id')
      }
      
    } catch (err: any) {
      console.error('Failed to start call:', err)
      console.error('Start call error details:', JSON.stringify(err, null, 2))
      setError(`Failed to start call: ${err.message || err.errorMsg || 'Unknown error'}`)
      setIsLoading(false)
      setStatusMessage('Failed to start call. Please try again.')
      
      // Clear the session storage on error
      vapiSessionManager.endCall('video-editor')
    }
  }

  const endCall = async () => {
    console.log('🛑 Attempting to end video editor call...')
    console.log('🔍 Debug - vapiRef.current:', !!vapiRef.current)
    console.log('🔍 Debug - isConnected:', isConnected)
    
    if (!vapiRef.current || !isConnected) {
      console.log('⚠️ No active VAPI video editor call to stop')
      // Still reset states and clean up session
      setIsConnected(false)
      setIsLoading(false)
      setIsSpeaking(false)
      setIsListening(false)
      setIsMuted(false)
      setStatusMessage('Call ended')
      vapiSessionManager.endCall('video-editor')
      return
    }

    // Add timeout to force cleanup if call doesn't end
    const forceCleanupTimeout = setTimeout(() => {
      console.log('⚠️ Force cleanup triggered - call did not end within 3 seconds')
      setIsConnected(false)
      setIsLoading(false)
      setIsSpeaking(false)
      setIsListening(false)
      setIsMuted(false)
      setStatusMessage('Call ended (forced)')
      vapiSessionManager.endCall('video-editor')
      // Force destroy the VAPI instance
      if (vapiRef.current) {
        try {
          vapiRef.current.removeAllListeners()
          vapiRef.current = null
        } catch (e) {
          console.error('Error during force cleanup:', e)
        }
      }
    }, 3000)

    try {
      setIsLoading(true)
      setStatusMessage('Ending call...')
      
      // Immediately reset connection state to provide better UX
      setIsConnected(false)
      setIsSpeaking(false)
      setIsListening(false)
      
      console.log('🛑 Stopping VAPI video editor call...')
      
      // Try multiple methods to stop the call
      try {
        await vapiRef.current.stop()
        console.log('✅ VAPI video editor stop successful')
      } catch (stopError) {
        console.warn('⚠️ Primary stop failed, trying alternative methods:', stopError)
        
        // Try alternative stop methods
        try {
          if (vapiRef.current && typeof vapiRef.current.destroy === 'function') {
            await vapiRef.current.destroy()
            console.log('✅ VAPI destroyed successfully')
          }
        } catch (destroyError) {
          console.warn('⚠️ Destroy failed:', destroyError)
        }
        
        // Force cleanup regardless
        console.log('🔄 Forcing cleanup after stop failure')
      }
      
      // Remove event listeners
      if (vapiRef.current) {
        vapiRef.current.removeAllListeners()
      }
      
    } catch (err) {
      console.error('❌ Error stopping VAPI video editor call:', err)
    } finally {
      // Always perform cleanup
      setIsConnected(false)
      setIsLoading(false)
      setIsSpeaking(false)
      setIsListening(false)
      setIsMuted(false)
      setStatusMessage('Call ended')
      addMessage('system', 'Video editing session ended successfully.')
      
      // Clear session storage and notify other components
      vapiSessionManager.endCall('video-editor')
      
      // Nullify the VAPI reference to ensure clean state
      vapiRef.current = null
      
      // Clear the timeout
      clearTimeout(forceCleanupTimeout)
      
      console.log('✅ Video editor call cleanup completed successfully')
    }
  }

  const toggleMute = () => {
    if (vapiRef.current && isConnected) {
      try {
        const newMutedState = !isMuted
        console.log(`🔇 ${newMutedState ? 'Muting' : 'Unmuting'} microphone...`)
        vapiRef.current.setMuted(newMutedState)
        setIsMuted(newMutedState)
        setStatusMessage(newMutedState ? 'Microphone muted' : 'Microphone active')
        addMessage('system', newMutedState ? 'Microphone muted' : 'Microphone unmuted')
      } catch (err) {
        console.error('Error toggling mute:', err)
      }
    }
  }

  // Handle text input submission
  const handleTextSubmit = async () => {
    const trimmedInput = textInput.trim()
    if (!trimmedInput) return

    addMessage('user', trimmedInput)
    setTextInput('')

    try {
      const response = await processCommand(trimmedInput)
      addMessage('assistant', response)
    } catch (error: any) {
      console.error('Error processing text command:', error)
      addMessage('system', `Error: ${error.message}`)
    }
  }

  // Handle Enter key in text input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right': return 'bottom-6 right-6'
      case 'bottom-left': return 'bottom-6 left-6'
      case 'top-right': return 'top-6 right-6'
      case 'top-left': return 'top-6 left-6'
      default: return 'bottom-6 left-6'
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.div 
        className={`fixed ${getPositionClasses()} z-50`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1,
          scale: 1,
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
      >
        <motion.button
          onClick={() => {
            console.log('🎬 VideoEditorVAPIAssistant button clicked!', { isOpen })
            setIsOpen(!isOpen)
          }}
          className={`
            relative w-16 h-16 rounded-full
            shadow-2xl overflow-hidden
            border-2 border-white/30
            hover:scale-110 active:scale-95
            transition-all duration-300
            bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500
            ${isConnected ? 'ring-4 ring-purple-400/50 animate-pulse' : ''}
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
              alt="Video Editor AI"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" style={{ display: 'none' }}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-orange-500/40"></div>
            
            {/* Status Icon Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <Loader2 className="w-7 h-7 text-white animate-spin drop-shadow-lg" />
              </div>
            )}
            {isConnected && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <div className="w-7 h-7 rounded-full bg-green-500 animate-pulse" />
              </div>
            )}
            {error && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <div className="w-7 h-7 rounded-full bg-red-500" />
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
                        alt="Video Editor AI"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isConnected && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white leading-tight mb-0.5">
                      Video Editor AI
                    </h3>
                    <p className="text-gray-400 text-sm leading-tight truncate">
                      {statusMessage}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-all duration-200 flex-shrink-0 ml-3 group"
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
                      alt="Video Editor AI"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <h4 className="text-xl font-bold text-white mb-2">Ready to Edit!</h4>
                  <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">
                    Click <span className="text-green-400 font-semibold">"Start Voice"</span> below to begin voice-controlled video editing
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
                              alt="Video Editor AI"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl shadow-xl ${
                            message.type === 'user'
                              ? 'bg-gradient-to-br from-purple-600 to-pink-700 text-white rounded-br-sm'
                              : 'bg-gray-800 text-gray-100 border border-gray-700/50 rounded-bl-sm'
                          }`}
                        >
                          <div className="px-4 py-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {message.type === 'user' && (
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-700 flex items-center justify-center flex-shrink-0 shadow-lg">
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

            {/* Text Input (Always Available) */}
            <div className="px-6 py-4 border-t border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a command... (e.g., 'increase brightness')"
                  className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
                <motion.button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  whileHover={{ scale: textInput.trim() ? 1.05 : 1 }}
                  whileTap={{ scale: textInput.trim() ? 0.95 : 1 }}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    textInput.trim()
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="px-6 py-4 border-t border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
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
                        <span>Start Voice</span>
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
                          <span>End Voice</span>
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

export default VideoEditorVAPIAssistant

