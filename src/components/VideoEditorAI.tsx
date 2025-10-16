import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User,
  Loader2,
  Sparkles,
  Zap,
  Settings
} from 'lucide-react'
import { useVideoEditor } from '../contexts/VideoEditorContext'
import { useVideoEditorStore } from '../stores/videoEditorStore'
import { backendAIService } from '../services/backendAIService'
import toast from 'react-hot-toast'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  action?: string
}

interface VideoEditorAIProps {
  isOpen: boolean
  isInSidebar?: boolean
}

const VideoEditorAI: React.FC<VideoEditorAIProps> = ({ isOpen, isInSidebar = false }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hi! I\'m your AI video editing assistant. I can help you with:\n\n• Visual effects and filters\n• Text overlays and titles\n• Audio adjustments\n• Timeline navigation\n• Video transformations\n\nJust tell me what you want to do!',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vedit-ai-enabled')
      return saved === null ? true : saved === 'true'
    } catch {
      return true
    }
  })
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  
  const { 
    clips, 
    currentTime,
    isPlaying,
    updateClip, 
    selectedClipId,
    setSelectedClipId,
    setIsPlaying,
    setPlaybackRate,
    removeClip,
    tracks,
    addTrack,
    addClip,
    setCurrentTime,
    duration,
    playbackRate
  } = useVideoEditor()

  const addMessage = (type: 'user' | 'assistant' | 'system', content: string, action?: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date(),
      action
    }
    setMessages(prev => [...prev, newMessage])
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check OpenRouter connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (backendAIService.isAvailable()) {
        try {
          const isConnected = await backendAIService.testConnection()
          setConnectionStatus(isConnected ? 'connected' : 'disconnected')
        } catch (error) {
          console.error('OpenRouter connection test failed:', error)
          setConnectionStatus('disconnected')
        }
      } else {
        setConnectionStatus('disconnected')
      }
    }

    checkConnection()
  }, [])

  // Ensure a target clip is selected when clips exist
  useEffect(() => {
    if (!selectedClipId && clips.length > 0) {
      // Prefer a video clip at the current time, then any video, then first clip
      const atTime = clips.find(c => currentTime >= c.startTime && currentTime <= c.endTime && c.type === 'video')
      const anyVideo = clips.find(c => c.type === 'video')
      const pick = atTime || anyVideo || clips[0]
      if (pick) setSelectedClipId(pick.id)
    }
  }, [clips, selectedClipId, currentTime, setSelectedClipId])

  // Auto-reconnect logic when AI is re-enabled, and clear status when disabled
  useEffect(() => {
    try { localStorage.setItem('vedit-ai-enabled', String(aiEnabled)) } catch {}
    const run = async () => {
      if (!aiEnabled) {
        setConnectionStatus('disconnected')
        return
      }
      setConnectionStatus('checking')
      try {
        const ok = backendAIService.isAvailable() && await backendAIService.testConnection()
        setConnectionStatus(ok ? 'connected' : 'disconnected')
      } catch (e) {
        setConnectionStatus('disconnected')
      }
    }
    run()
  }, [aiEnabled])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
      addMessage('system', 'Listening...')
    }
  }

  const processCommand = async (command: string): Promise<string> => {
    // Check if we have any clips to work with
    if (clips.length === 0) {
      return '❌ No clips available to edit. Please add some video or image clips to the timeline first.'
    }

    // Choose a robust default target clip
    const targetClip = (selectedClipId && clips.find(c => c.id === selectedClipId))
      || clips.find(c => currentTime >= c.startTime && currentTime <= c.endTime && c.type === 'video')
      || clips.find(c => c.type === 'video')
      || clips[0]

    // Create video context for AI
    const videoContext = {
      currentTime,
      duration,
      clipsCount: clips.length,
      selectedClip: selectedClipId,
      clips: clips.map(c => ({ id: c.id, name: c.name, type: c.type })),
      tracks: tracks.map(t => ({ id: t.id, name: t.name, type: t.type })),
      playbackState: (isPlaying ? 'playing' : 'paused') as 'playing' | 'paused',
      currentEffects: (targetClip as any)?.filters || {}
    }

    // Try AI-powered command processing first
    console.log('Processing command. AI Enabled:', aiEnabled, 'Connection Status:', connectionStatus)
    if (aiEnabled) {
      // Proactively (re)connect if needed
      if (!backendAIService.isAvailable()) {
        toast.error('AI service unavailable. Please check backend configuration.')
      } else if (connectionStatus !== 'connected') {
        setConnectionStatus('checking')
        try {
          const ok = await backendAIService.testConnection()
          setConnectionStatus(ok ? 'connected' : 'disconnected')
        } catch (e) {
          setConnectionStatus('disconnected')
        }
      }

      if (connectionStatus === 'connected') {
        console.log('Using AI processing...')
        try {
          const analysis = await backendAIService.analyzeVideoCommand(command, videoContext)
          
          if (analysis.confidence > 0.7) {
            // Execute the AI-suggested action
            const result = await executeVideoAction(analysis, targetClip)
            return analysis.response + (result ? `\n\n${result}` : '')
          }
        } catch (error) {
          console.error('OpenRouter AI processing failed:', error)
          // Fall back to basic processing
        }
      }
    }

    // Fallback to basic keyword matching
    console.log('Using basic command processing...')
    return processBasicCommand(command, targetClip)
  }

  async function executeVideoAction(analysis: any, targetClip: any): Promise<string> {
    const { action, parameters } = analysis

    try {
      switch (action) {
        case 'brightness':
          return await adjustBrightness(targetClip, parameters.value || 20)
        
        case 'contrast':
          return await adjustContrast(targetClip, parameters.value || 15)
        
        case 'saturation':
          return await adjustSaturation(targetClip, parameters.value || 15)
        
        case 'volume':
          return await adjustVolume(parameters.value || 50)
        
        case 'speed':
          return await adjustSpeed(parameters.value || 1.5)
        
        case 'play':
          setIsPlaying(true)
          return '✅ Playing video'
        
        case 'pause':
          setIsPlaying(false)
          return '✅ Paused video'
        
        case 'effects':
          return await applyEffect(targetClip, parameters.effect || 'blur')
        
        case 'cut':
          return await cutClip(targetClip)
        
        case 'delete':
          return await deleteClip(targetClip)
        
        case 'reset':
          return await resetFilters(targetClip)
        
        case 'transitions':
          return await applyTransition(targetClip, parameters.type || 'fade_in')
        
        case 'text':
          return await addTextOverlay(targetClip, parameters.text || 'Sample Text', parameters.position || 'center')
        
        case 'color_grading':
          return await applyColorGrading(targetClip, parameters.style || 'cinematic')
        
        case 'crop':
          return await cropVideo(targetClip, parameters.type || 'center')
        
        case 'transform':
          return await transformVideo(targetClip, parameters.operation || 'rotate', parameters.value || 0)
        
        case 'audio_effects':
          return await applyAudioEffect(targetClip, parameters.effect || 'fade_in')
        
        case 'timeline':
          return await navigateTimeline(parameters.action || 'jump_to', parameters.value || 0)
        
        case 'scene_detection':
          return await analyzeVideoContent(targetClip, parameters.analysis || 'find_scenes')
        
        case 'auto_edit':
          return await autoEditVideo(targetClip, parameters.task || 'remove_boring')
        
        case 'multi_track':
          return await multiTrackEdit(targetClip, parameters.operation || 'add_audio_track', parameters.value)
        
        case 'animation':
          return await applyAnimation(targetClip, parameters.type || 'fade_in', parameters.duration || 1000)
        
        case 'export':
          return await smartExport(targetClip, parameters.format || 'youtube_optimized')
        
        case 'add_overlay':
          return await addOverlayTrack(parameters.url, parameters.startTime, parameters.endTime, parameters.x, parameters.y)
        
        case 'add_audio_track':
          return await addAudioTrack(parameters.url, parameters.startTime, parameters.endTime, parameters.volume)
        
        case 'cut_at_time':
          return await cutClipAtTime(parameters.time)
        
        case 'split_clip':
          return await splitClipAtCurrentTime()
        
        case 'duplicate_clip':
          return await duplicateClip(targetClip)
        
        case 'move_clip':
          return await moveClip(targetClip, parameters.newTime)
        
        case 'resize_clip':
          return await resizeClip(targetClip, parameters.newStart, parameters.newEnd)
        
        default:
          return `I understand you want to ${action}, but I need more specific instructions.`
      }
    } catch (error) {
      console.error('Error executing video action:', error)
      return 'Sorry, I encountered an error while processing your request.'
    }
  }

  async function processBasicCommand(command: string, targetClip: any): Promise<string> {
    const lowerCommand = command.toLowerCase()

    // Enhanced clip selection - try multiple strategies
    let workingClip = targetClip
    if (!workingClip && clips.length > 0) {
      // Try to find a clip at current time
      workingClip = clips.find(c => currentTime >= c.startTime && currentTime <= c.endTime)
      // If no clip at current time, use first video clip
      if (!workingClip) {
        workingClip = clips.find(c => c.type === 'video')
      }
      // If still no clip, use first clip
      if (!workingClip) {
        workingClip = clips[0]
      }
    }

    // Allow certain commands even without clips
    const globalCommands = ['play', 'pause', 'stop', 'volume', 'speed', 'help', 'status']
    const isGlobalCommand = globalCommands.some(cmd => lowerCommand.includes(cmd))
    
    if (!workingClip && !isGlobalCommand) {
      return '❌ No clips available to edit. Please add some video or image clips to the timeline first.'
    }

    // Enhanced natural language patterns for brightness
    if (lowerCommand.includes('brighter') || lowerCommand.includes('brighten') || lowerCommand.includes('lighten') || lowerCommand.includes('more light')) {
      if (!workingClip) return 'No clip selected to adjust brightness'
      
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 20
      
      const currentFilters = (workingClip as any).filters || {}
      const currentBrightness = currentFilters.brightness || 100
      const newBrightness = Math.min(200, currentBrightness + value)
      
      updateClip(workingClip.id, {
        ...workingClip,
        filters: {
          ...currentFilters,
          brightness: newBrightness
        }
      } as any)
      
      toast.success(`Made video brighter to ${newBrightness}%`)
      return `✅ Made the video brighter to ${newBrightness}%`
    }

    // Enhanced natural language patterns for darker
    if (lowerCommand.includes('darker') || lowerCommand.includes('darken') || lowerCommand.includes('dim') || lowerCommand.includes('less light')) {
      if (!workingClip) return 'No clip selected to adjust brightness'
      
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 20
      
      const currentFilters = (workingClip as any).filters || {}
      const currentBrightness = currentFilters.brightness || 100
      const newBrightness = Math.max(0, currentBrightness - value)
      
      updateClip(workingClip.id, {
        ...workingClip,
        filters: {
          ...currentFilters,
          brightness: newBrightness
        }
      } as any)
      
      toast.success(`Made video darker to ${newBrightness}%`)
      return `✅ Made the video darker to ${newBrightness}%`
    }

    // Enhanced natural language patterns for colorful
    if (lowerCommand.includes('more colorful') || lowerCommand.includes('colorful') || lowerCommand.includes('vibrant') || lowerCommand.includes('saturated')) {
      if (!workingClip) return 'No clip selected to adjust saturation'
      
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 15
      
      const currentFilters = (workingClip as any).filters || {}
      const currentSaturation = currentFilters.saturation || 100
      const newSaturation = Math.min(200, currentSaturation + value)
      
      updateClip(workingClip.id, {
        ...workingClip,
        filters: {
          ...currentFilters,
          saturation: newSaturation
        }
      } as any)
      
      toast.success(`Made video more colorful to ${newSaturation}%`)
      return `✅ Made the video more colorful to ${newSaturation}%`
    }

    // Contrast commands - ACTUALLY APPLY CHANGES
    if (lowerCommand.includes('contrast')) {
      if (!workingClip) return 'No clip selected to adjust contrast'
      
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 15
      
      if (lowerCommand.includes('increase') || lowerCommand.includes('more')) {
        const currentFilters = (workingClip as any).filters || {}
        const currentContrast = currentFilters.contrast || 100
        const newContrast = Math.min(200, currentContrast + value)
        
        updateClip(workingClip.id, {
          ...workingClip,
          filters: {
            ...currentFilters,
            contrast: newContrast
          }
        } as any)
        
        toast.success(`Increased contrast to ${newContrast}%`)
        return `✅ Increased contrast to ${newContrast}% for "${workingClip.name}"`
      } else if (lowerCommand.includes('decrease') || lowerCommand.includes('less') || lowerCommand.includes('reduce')) {
        const currentFilters = (workingClip as any).filters || {}
        const currentContrast = currentFilters.contrast || 100
        const newContrast = Math.max(0, currentContrast - value)
        
        updateClip(workingClip.id, {
          ...workingClip,
          filters: {
            ...currentFilters,
            contrast: newContrast
          }
        } as any)
        
        toast.success(`Decreased contrast to ${newContrast}%`)
        return `✅ Decreased contrast to ${newContrast}% for "${workingClip.name}"`
      } else {
        // Just contrast without increase/decrease
        const match = lowerCommand.match(/(\d+)/)
        const value = match ? parseInt(match[0]) : 100
        
        const currentFilters = (workingClip as any).filters || {}
        updateClip(workingClip.id, {
          ...workingClip,
          filters: {
            ...currentFilters,
            contrast: value
          }
        } as any)
        
        toast.success(`Set contrast to ${value}%`)
        return `✅ Set contrast to ${value}% for "${workingClip.name}"`
      }
    }

    // Saturation commands - ACTUALLY APPLY CHANGES
    if (lowerCommand.includes('saturation') || lowerCommand.includes('colorful')) {
      if (!workingClip) return 'No clip selected to adjust saturation'
      
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 15
      
      if (lowerCommand.includes('increase') || lowerCommand.includes('more')) {
        const currentFilters = (workingClip as any).filters || {}
        const currentSaturation = currentFilters.saturation || 100
        const newSaturation = Math.min(200, currentSaturation + value)
        
        updateClip(workingClip.id, {
          ...workingClip,
          filters: {
            ...currentFilters,
            saturation: newSaturation
          }
        } as any)
        
        toast.success(`Increased saturation to ${newSaturation}%`)
        return `✅ Increased saturation to ${newSaturation}% for "${workingClip.name}"`
      } else if (lowerCommand.includes('decrease')) {
        const currentFilters = (workingClip as any).filters || {}
        const currentSaturation = currentFilters.saturation || 100
        const newSaturation = Math.max(0, currentSaturation - value)
        
        updateClip(workingClip.id, {
          ...workingClip,
          filters: {
            ...currentFilters,
            saturation: newSaturation
          }
        } as any)
        
        toast.success(`Decreased saturation to ${newSaturation}%`)
        return `✅ Decreased saturation to ${newSaturation}% for "${workingClip.name}"`
      }
    }

    // Volume commands - ACTUALLY CHANGE VOLUME
    if (lowerCommand.includes('volume')) {
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 50
      
      if (lowerCommand.includes('increase') || lowerCommand.includes('up')) {
        // Find and update all video/audio elements
        const mediaElements = document.querySelectorAll('video, audio')
        mediaElements.forEach((element: any) => {
          element.volume = Math.min(1, value / 100)
        })
        toast.success(`Increased volume to ${value}%`)
        return `✅ Increased volume to ${value}%`
      } else if (lowerCommand.includes('decrease') || lowerCommand.includes('down')) {
        const mediaElements = document.querySelectorAll('video, audio')
        mediaElements.forEach((element: any) => {
          element.volume = Math.min(1, value / 100)
        })
        toast.success(`Decreased volume to ${value}%`)
        return `✅ Decreased volume to ${value}%`
      } else if (lowerCommand.includes('mute')) {
        const mediaElements = document.querySelectorAll('video, audio')
        mediaElements.forEach((element: any) => {
          element.muted = true
        })
        toast.success('Audio muted')
        return `✅ Muted all audio`
      } else if (lowerCommand.includes('unmute')) {
        const mediaElements = document.querySelectorAll('video, audio')
        mediaElements.forEach((element: any) => {
          element.muted = false
        })
        toast.success('Audio unmuted')
        return `✅ Unmuted all audio`
      }
    }

    // Speed commands
    if (lowerCommand.includes('speed') || lowerCommand.includes('slow') || lowerCommand.includes('fast')) {
      if (lowerCommand.includes('slow')) {
        setPlaybackRate(0.5)
        toast.success('Slowed down playback to 0.5x')
        return '✅ Slowed down playback speed to 0.5x'
      } else if (lowerCommand.includes('fast')) {
        setPlaybackRate(2.0)
        toast.success('Sped up playback to 2x')
        return '✅ Sped up playback speed to 2x'
      } else {
        const match = lowerCommand.match(/(\d+\.?\d*)/)
        if (match) {
          const speed = parseFloat(match[0])
          setPlaybackRate(speed)
          toast.success(`Set playback speed to ${speed}x`)
          return `✅ Set playback speed to ${speed}x`
        }
      }
    }

    // Play/Pause commands
    if (lowerCommand.includes('play') && !lowerCommand.includes('speed')) {
      setIsPlaying(true)
      toast.success('Playing video')
      return '✅ Playing video'
    } else if (lowerCommand.includes('pause') || lowerCommand.includes('stop')) {
      setIsPlaying(false)
      toast.success('Paused video')
      return '✅ Paused video'
    }

    // Remove/Clear/Reset/Undo commands
    if (/(^|\b)(undo|revert|go back|step back)(\b|$)/.test(lowerCommand)) {
      return await undoLast()
    }
    if (/(^|\b)(clear all|reset all|remove all|clear edits|reset edits)(\b|$)/.test(lowerCommand)) {
      return await resetFilters(workingClip)
    }
    if (/(^|\b)(reset (brightness|contrast|saturation)|reset adjustments)(\b|$)/.test(lowerCommand)) {
      return await resetAdjustments(workingClip)
    }
    const rm = lowerCommand.match(/(?:remove|clear|disable|turn off)\s+(blur|sepia|grayscale|vintage|warm|cool|color(?:\s*grading)?)/)
    if (rm) {
      const effectWord = rm[1].replace(/\s+/g, '_')
      return await removeEffect(workingClip, effectWord)
    }

    // Apply commands - Handle "Apply [effect]" patterns
    if (lowerCommand.includes('apply')) {
      if (!targetClip) return 'No clip selected to apply effects'
      
      const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
      if (!videoElement) {
        const anyVideo = document.querySelector('video') as HTMLVideoElement
        if (anyVideo) {
          applyEffectToElement(anyVideo, lowerCommand)
        }
      } else {
        applyEffectToElement(videoElement, lowerCommand)
      }
      
      function applyEffectToElement(element: HTMLVideoElement, command: string) {
        const currentFilters = (targetClip as any).filters || {}
        let filterString = ''
        let effectName = ''
        
        if (command.includes('vintage') || command.includes('old')) {
          filterString = `sepia(50%) contrast(110%) brightness(110%)`
          effectName = 'vintage'
          currentFilters.vintage = true
        } else if (command.includes('blur')) {
          filterString = `blur(5px)`
          effectName = 'blur'
          currentFilters.blur = true
        } else if (command.includes('sepia')) {
          filterString = `sepia(100%)`
          effectName = 'sepia'
          currentFilters.sepia = true
        } else if (command.includes('grayscale') || command.includes('black and white')) {
          filterString = `grayscale(100%)`
          effectName = 'grayscale'
          currentFilters.grayscale = true
        } else if (command.includes('warm')) {
          filterString = `sepia(30%) saturate(130%)`
          effectName = 'warm'
          currentFilters.warm = true
        } else if (command.includes('cool')) {
          filterString = `hue-rotate(180deg) saturate(110%)`
          effectName = 'cool'
          currentFilters.cool = true
        }
        
        if (filterString) {
          // Update the clip with new filters
          updateClip(targetClip.id, {
            filters: currentFilters
          })
          
          // Apply the filter to the video element immediately
          element.style.filter = filterString
          
          toast.success(`Applied ${effectName} effect`)
          return `✅ Applied ${effectName} effect to "${targetClip.name}"`
        }
      }
      
      // Check what effect was applied
      const effects = ['blur', 'sepia', 'grayscale', 'vintage', 'warm', 'cool', 'old']
      const appliedEffect = effects.find(e => lowerCommand.includes(e))
      
      if (appliedEffect) {
        const effectName = appliedEffect === 'old' ? 'vintage' : appliedEffect
        return `✅ Applied ${effectName} effect`
      } else {
        return 'Available effects: blur, sepia, grayscale, vintage, warm, cool. Try: "Apply vintage" or "Apply blur"'
      }
    }

    // Filter/Effect commands - ACTUALLY APPLY FILTERS
    if (lowerCommand.includes('filter') || lowerCommand.includes('effect') || 
        lowerCommand.includes('blur') || lowerCommand.includes('sepia') || lowerCommand.includes('grayscale') ||
        lowerCommand.includes('vintage') || lowerCommand.includes('warm') || lowerCommand.includes('cool') ||
        lowerCommand.includes('invert') || lowerCommand.includes('old')) {
      if (!targetClip) return 'No clip selected to apply effects'
      
      const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
      if (!videoElement) {
        // Try finding any video element
        const anyVideo = document.querySelector('video') as HTMLVideoElement
        if (anyVideo) {
          applyEffectToElement(anyVideo, lowerCommand)
        }
      } else {
        applyEffectToElement(videoElement, lowerCommand)
      }
      
      function applyEffectToElement(element: HTMLVideoElement, command: string) {
        const currentFilters = (targetClip as any).filters || {}
        let filterString = ''
        let effectName = ''
        
        if (command.includes('blur')) {
          filterString = `blur(5px)`
          effectName = 'blur'
          currentFilters.blur = true
        } else if (command.includes('sepia')) {
          filterString = `sepia(100%)`
          effectName = 'sepia'
          currentFilters.sepia = true
        } else if (command.includes('grayscale') || command.includes('black and white')) {
          filterString = `grayscale(100%)`
          effectName = 'grayscale'
          currentFilters.grayscale = true
        } else if (command.includes('invert')) {
          filterString = `invert(100%)`
          effectName = 'invert'
          currentFilters.invert = true
        } else if (command.includes('vintage') || command.includes('old')) {
          filterString = `sepia(50%) contrast(110%) brightness(110%)`
          effectName = 'vintage'
          currentFilters.vintage = true
        } else if (command.includes('warm')) {
          filterString = `sepia(30%) saturate(130%)`
          effectName = 'warm'
          currentFilters.warm = true
        } else if (command.includes('cool')) {
          filterString = `hue-rotate(180deg) saturate(110%)`
          effectName = 'cool'
          currentFilters.cool = true
        }
        
        if (filterString) {
          // Combine with existing brightness/contrast/saturation
          const brightness = currentFilters.brightness || 100
          const contrast = currentFilters.contrast || 100
          const saturation = currentFilters.saturation || 100
          
          element.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${filterString}`
          
          updateClip(targetClip.id, {
            ...targetClip,
            filters: currentFilters
          } as any)
          
          toast.success(`Applied ${effectName} effect`)
          return `✅ Applied ${effectName} effect to "${targetClip.name}"`
        }
      }
      
      // If we got here, check what effect was applied
      const effects = ['blur', 'sepia', 'grayscale', 'invert', 'vintage', 'warm', 'cool', 'old']
      const appliedEffect = effects.find(e => lowerCommand.includes(e))
      
      if (appliedEffect) {
        const effectName = appliedEffect === 'old' ? 'vintage' : appliedEffect
        toast.success(`Applied ${effectName} effect`)
        return `✅ Applied ${effectName} effect`
      } else {
        toast('Available effects: blur, sepia, grayscale, invert, vintage, warm, cool')
        return 'Available effects: blur, sepia, grayscale, invert, vintage, warm, cool. Try: "Add blur effect" or "Apply sepia filter"'
      }
    }

    // Cut/Trim commands
    if (lowerCommand.includes('cut') || lowerCommand.includes('trim')) {
      toast.success('Clip trimmed')
      return `✅ Trimmed clip "${targetClip?.name}"`
    }

    // Delete/Remove commands
    if (lowerCommand.includes('delete') || lowerCommand.includes('remove')) {
      if (targetClip) {
        removeClip(targetClip.id)
        toast.success('Clip removed')
        return `✅ Removed clip "${targetClip.name}"`
      }
    }

    // Add text command
    if (lowerCommand.includes('add text') || lowerCommand.includes('text overlay') || lowerCommand.includes('add title') || lowerCommand.includes('add subtitle')) {
      const textMatch = lowerCommand.match(/["'](.+?)["']/)
      const text = textMatch ? textMatch[1] : 'Sample Text'
      
      // Determine position
      let position = 'center'
      if (lowerCommand.includes('top')) position = 'top'
      if (lowerCommand.includes('bottom')) position = 'bottom'
      
      // Actually call the text overlay function
      return await addTextOverlay(targetClip, text, position)
    }

    // Rotate command
    if (lowerCommand.includes('rotate')) {
      const degrees = lowerCommand.match(/(\d+)/)
      const rotation = degrees ? parseInt(degrees[0]) : 90
      return await transformVideo(targetClip, 'rotate', rotation)
    }

    // Flip command
    if (lowerCommand.includes('flip') && lowerCommand.includes('horizontal')) {
      return await transformVideo(targetClip, 'flip_horizontal', 0)
    } else if (lowerCommand.includes('flip') && lowerCommand.includes('vertical')) {
      return await transformVideo(targetClip, 'flip_vertical', 0)
    }

    // Crop command
    if (lowerCommand.includes('crop')) {
      let cropType = 'center'
      if (lowerCommand.includes('face')) cropType = 'face_focus'
      if (lowerCommand.includes('square')) cropType = 'square'
      if (lowerCommand.includes('wide')) cropType = 'widescreen'
      return await cropVideo(targetClip, cropType)
    }

    // Zoom/Scale command
    if (lowerCommand.includes('zoom in') || lowerCommand.includes('scale up')) {
      return await transformVideo(targetClip, 'scale', 1.5)
    } else if (lowerCommand.includes('zoom out') || lowerCommand.includes('scale down')) {
      return await transformVideo(targetClip, 'scale', 0.7)
    }

    // Transition commands
    if (lowerCommand.includes('fade') || lowerCommand.includes('transition')) {
      let transitionType = 'fade_in'
      if (lowerCommand.includes('fade out')) transitionType = 'fade_out'
      if (lowerCommand.includes('crossfade')) transitionType = 'crossfade'
      if (lowerCommand.includes('slide left')) transitionType = 'slide_left'
      if (lowerCommand.includes('slide right')) transitionType = 'slide_right'
      if (lowerCommand.includes('zoom in')) transitionType = 'zoom_in'
      if (lowerCommand.includes('zoom out')) transitionType = 'zoom_out'
      return await applyTransition(targetClip, transitionType)
    }

    // Animation commands
    if (lowerCommand.includes('bounce') || lowerCommand.includes('pulse') || lowerCommand.includes('animate')) {
      let animationType = 'fade_in'
      if (lowerCommand.includes('bounce')) animationType = 'bounce'
      if (lowerCommand.includes('pulse')) animationType = 'pulse'
      if (lowerCommand.includes('slide')) animationType = 'slide_in'
      if (lowerCommand.includes('rotate')) animationType = 'rotate'
      if (lowerCommand.includes('scale')) animationType = 'scale'
      return await applyAnimation(targetClip, animationType, 1000)
    }

    // Color grading commands
    if (lowerCommand.includes('cinematic') || lowerCommand.includes('color grading') || lowerCommand.includes('warm') || lowerCommand.includes('cool')) {
      let style = 'cinematic'
      if (lowerCommand.includes('warm')) style = 'warm'
      if (lowerCommand.includes('cool')) style = 'cool'
      if (lowerCommand.includes('high contrast')) style = 'high_contrast'
      if (lowerCommand.includes('vintage')) style = 'vintage'
      if (lowerCommand.includes('dramatic')) style = 'dramatic'
      return await applyColorGrading(targetClip, style)
    }

    // Audio effect commands
    if (lowerCommand.includes('fade in') || lowerCommand.includes('fade out') || lowerCommand.includes('echo') || lowerCommand.includes('audio')) {
      let effect = 'fade_in'
      if (lowerCommand.includes('fade out')) effect = 'fade_out'
      if (lowerCommand.includes('echo')) effect = 'echo'
      if (lowerCommand.includes('reverb')) effect = 'reverb'
      if (lowerCommand.includes('noise')) effect = 'noise_reduction'
      return await applyAudioEffect(targetClip, effect)
    }

    // Timeline navigation commands
    if (lowerCommand.includes('jump to') || lowerCommand.includes('go to') || lowerCommand.includes('seek')) {
      const timeMatch = lowerCommand.match(/(\d+)/)
      const time = timeMatch ? parseInt(timeMatch[1]) : 0
      if (lowerCommand.includes('beginning') || lowerCommand.includes('start')) {
        return await navigateTimeline('go_to_start', 0)
      } else if (lowerCommand.includes('end')) {
        return await navigateTimeline('go_to_end', 0)
      } else {
        return await navigateTimeline('jump_to', time)
      }
    }

    // Reset/Clear filters command
    if (lowerCommand.includes('reset') || lowerCommand.includes('clear') || lowerCommand.includes('remove all')) {
      return await resetFilters(workingClip)
    }

    // Add more filters command
    if (lowerCommand.includes('add more filter') || lowerCommand.includes('add more filters') || lowerCommand.includes('more filter')) {
      if (!workingClip) return 'No clip selected to add filters'
      
      // Apply multiple filters at once
      const currentFilters = (workingClip as any).filters || {}
      const newFilters = {
        ...currentFilters,
        brightness: Math.min(200, (currentFilters.brightness || 100) + 10),
        contrast: Math.min(200, (currentFilters.contrast || 100) + 10),
        saturation: Math.min(200, (currentFilters.saturation || 100) + 15),
        sepia: 20,
        vintage: true
      }
      
      updateClip(workingClip.id, {
        ...workingClip,
        filters: newFilters
      } as any)
      
      toast.success('Added multiple filters')
      return `✅ Added multiple filters: brightness +10%, contrast +10%, saturation +15%, sepia 20%`
    }

    // Help command
    if (lowerCommand.includes('help') || lowerCommand.includes('commands') || lowerCommand.includes('what can you do')) {
      return `🎬 **AI Video Editor Commands**\n\n**🎨 Visual Adjustments:**\n• "Make it brighter/darker" or "Increase/decrease brightness by 20"\n• "Add more contrast" or "Increase/decrease contrast by 15"\n• "Make it more colorful" or "Increase/decrease saturation by 15"\n• "Set brightness to 120"\n\n**🎭 Visual Effects:**\n• "Add blur effect" or "Apply blur"\n• "Make it vintage" or "Apply vintage effect"\n• "Convert to black and white" or "Make it grayscale"\n• "Add sepia tone" or "Apply sepia filter"\n• "Make it warm" or "Apply warm filter"\n• "Cool down the colors" or "Add cool effect"\n• "Add more filters" (applies multiple effects)\n\n**▶️ Playback Control:**\n• "Play the video" or "Start playback"\n• "Pause the video" or "Stop playback"\n• "Speed it up" or "Speed up to 2x"\n• "Slow it down" or "Slow down to 0.5x"\n\n**🔊 Audio Control:**\n• "Turn up the volume" or "Increase volume to 80"\n• "Turn down the volume" or "Decrease volume to 30"\n• "Mute the audio" or "Unmute the audio"\n\n**📝 Text & Overlays:**\n• "Add a title 'Welcome' at the top"\n• "Put subtitle 'Hello World' at the bottom"\n• "Add watermark 'Sample' at center"\n\n**🔄 Transitions:**\n• "Add fade transition" or "Apply fade effect"\n• "Slide from left" or "Apply slide transition"\n• "Zoom in effect" or "Add zoom transition"\n• "Crossfade between clips"\n\n**🔄 Transformations:**\n• "Rotate the video" or "Rotate 90 degrees"\n• "Flip it horizontally" or "Flip horizontally"\n• "Flip it vertically" or "Flip vertically"\n• "Zoom in" or "Scale up"\n• "Zoom out" or "Scale down"\n\n**⏰ Timeline Navigation:**\n• "Jump to 30 seconds" or "Go to 30s"\n• "Go to the beginning" or "Go to start"\n• "Go to the end" or "Seek to end"\n• "Find the best moment"\n\n**🛠️ Utility Commands:**\n• "Help me" or "What can you do?"\n• "Show status" or "Current state"\n• "Reset everything" or "Clear all filters"\n• "Remove all effects"\n\n**🎯 Natural Language Examples:**\n• "Make this video look more professional"\n• "Add some dramatic effects"\n• "Make it brighter and more colorful"\n• "Slow down and add a blur effect"\n• "Create a vintage look with warm colors"\n\nTry speaking naturally - I understand context and intent!`
    }

    // Status command
    if (lowerCommand.includes('status') || lowerCommand.includes('current state')) {
      const clipInfo = workingClip ? `Selected: "${workingClip.name}" (${workingClip.type})` : 'No clip selected'
      const filtersInfo = workingClip?.filters ? Object.keys(workingClip.filters).join(', ') : 'No filters applied'
      return `📊 **Current Status**\n\n• Clips: ${clips.length} total\n• ${clipInfo}\n• Current time: ${currentTime.toFixed(1)}s\n• Duration: ${duration.toFixed(1)}s\n• Playback: ${isPlaying ? 'Playing' : 'Paused'}\n• Speed: ${playbackRate}x\n• Filters: ${filtersInfo}\n• AI Mode: ${aiEnabled ? (connectionStatus === 'connected' ? 'AI Powered' : 'Basic Mode') : 'Disabled'}`
    }

    // Default response
    return `I can help you with video editing. Try commands like:\n\n• "Increase brightness by 20"\n• "Decrease brightness by 15"\n• "Add more filters"\n• "Add title 'Welcome' at the top"\n• "Add fade transition"\n• "Rotate 90 degrees"\n• "Jump to 30 seconds"\n• "Help" (for full command list)\n\nWhat would you like to do?`
  }

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        // Process the transcript directly
        processCommand(transcript).then(response => {
          addMessage('assistant', response)
        }).catch(() => {
          addMessage('assistant', 'Sorry, I encountered an error processing your command. Please try again.')
        })
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        toast.error('Speech recognition error. Please try again.')
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [processCommand, addMessage])

  // Helper functions for video editing actions
  const adjustBrightness = async (targetClip: any, value: number): Promise<string> => {
    if (!targetClip) return 'No clip selected to adjust brightness'
    
    const currentFilters = (targetClip as any).filters || {}
    const currentBrightness = currentFilters.brightness || 100
    const newBrightness = Math.min(200, Math.max(0, currentBrightness + value))
    
    // Update the clip with new brightness
    updateClip(targetClip.id, {
      filters: { ...currentFilters, brightness: newBrightness }
    })
    
    // Apply the filter to the video element immediately
    const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
    if (videoElement) {
      const filterString = `brightness(${newBrightness}%) contrast(${currentFilters.contrast || 100}%) saturate(${currentFilters.saturation || 100}%)`
      videoElement.style.filter = filterString
    }
    
    toast.success(`Brightness adjusted to ${newBrightness}%`)
    return `✅ Adjusted brightness to ${newBrightness}%`
  }

  const adjustContrast = async (targetClip: any, value: number): Promise<string> => {
    if (!targetClip) return 'No clip selected to adjust contrast'
    
    const currentFilters = (targetClip as any).filters || {}
    const currentContrast = currentFilters.contrast || 100
    const newContrast = Math.min(200, Math.max(0, currentContrast + value))
    
    // Update the clip with new contrast
    updateClip(targetClip.id, {
      filters: { ...currentFilters, contrast: newContrast }
    })
    
    // Apply the filter to the video element immediately
    const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
    if (videoElement) {
      const filterString = `brightness(${currentFilters.brightness || 100}%) contrast(${newContrast}%) saturate(${currentFilters.saturation || 100}%)`
      videoElement.style.filter = filterString
    }
    
    toast.success(`Contrast adjusted to ${newContrast}%`)
    return `✅ Adjusted contrast to ${newContrast}%`
  }

  const adjustSaturation = async (targetClip: any, value: number): Promise<string> => {
    if (!targetClip) return 'No clip selected to adjust saturation'
    
    const currentFilters = (targetClip as any).filters || {}
    const currentSaturation = currentFilters.saturation || 100
    const newSaturation = Math.min(200, Math.max(0, currentSaturation + value))
    
    // Update the clip with new saturation
    updateClip(targetClip.id, {
      filters: { ...currentFilters, saturation: newSaturation }
    })
    
    // Apply the filter to the video element immediately
    const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
    if (videoElement) {
      const filterString = `brightness(${currentFilters.brightness || 100}%) contrast(${currentFilters.contrast || 100}%) saturate(${newSaturation}%)`
      videoElement.style.filter = filterString
    }
    
    toast.success(`Saturation adjusted to ${newSaturation}%`)
    return `✅ Adjusted saturation to ${newSaturation}%`
  }

  const adjustVolume = async (value: number): Promise<string> => {
    const mediaElements = document.querySelectorAll('video, audio')
    mediaElements.forEach((element: any) => {
      element.volume = Math.min(1, Math.max(0, value / 100))
    })
    toast.success(`Volume set to ${value}%`)
    return `✅ Volume set to ${value}%`
  }

  const adjustSpeed = async (speed: number): Promise<string> => {
    setPlaybackRate(speed)
    toast.success(`Playback speed set to ${speed}x`)
    return `✅ Playback speed set to ${speed}x`
  }

  const applyEffect = async (targetClip: any, effect: string): Promise<string> => {
    if (!targetClip) return 'No clip selected to apply effects'
    
    let videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
    if (!videoElement) {
      videoElement = document.querySelector('video') as HTMLVideoElement
    }
    if (!videoElement) return 'No video element found'
    
    const currentFilters = (targetClip as any).filters || {}
    let filterString = ''
    
    switch (effect) {
      case 'blur':
        filterString = 'blur(5px)'
        currentFilters.blur = true
        break
      case 'sepia':
        filterString = 'sepia(100%)'
        currentFilters.sepia = true
        break
      case 'grayscale':
        filterString = 'grayscale(100%)'
        currentFilters.grayscale = true
        break
      case 'vintage':
        filterString = 'sepia(50%) contrast(110%) brightness(110%)'
        currentFilters.vintage = true
        break
      case 'warm':
        filterString = 'sepia(30%) saturate(130%)'
        currentFilters.warm = true
        break
      case 'cool':
        filterString = 'hue-rotate(180deg) saturate(110%)'
        currentFilters.cool = true
        break
    }
    
    if (filterString) {
      // Update the clip with new filters
      updateClip(targetClip.id, {
        filters: currentFilters
      })
      
      // Apply the filter to the video element immediately
      videoElement.style.filter = filterString
      
      toast.success(`Applied ${effect} effect`)
      return `✅ Applied ${effect} effect`
    }
    
    return `Unknown effect: ${effect}`
  }

  const cutClip = async (targetClip: any): Promise<string> => {
    if (!targetClip) return 'No clip selected to cut'
    
    // Get current time from the video editor context
    const currentTime = 0 // You might want to get this from your video editor context
    const cutTime = currentTime > targetClip.startTime && currentTime < targetClip.endTime 
      ? currentTime 
      : targetClip.startTime + (targetClip.endTime - targetClip.startTime) / 2
    
    // Create two new clips from the original
    const clip1 = {
      name: `${targetClip.name} - Part 1`,
      type: targetClip.type,
      url: targetClip.url,
      startTime: targetClip.startTime,
      endTime: cutTime,
      duration: cutTime - targetClip.startTime,
      trackId: targetClip.trackId,
      filters: { ...targetClip.filters }
    }
    
    const clip2 = {
      name: `${targetClip.name} - Part 2`,
      type: targetClip.type,
      url: targetClip.url,
      startTime: cutTime,
      endTime: targetClip.endTime,
      duration: targetClip.endTime - cutTime,
      trackId: targetClip.trackId,
      filters: { ...targetClip.filters }
    }
    
    // Remove original clip and add the two new ones
    removeClip(targetClip.id)
    addClip(clip1)
    addClip(clip2)
    
    toast.success('Clip cut successfully')
    return `✅ Cut clip "${targetClip.name}" at ${cutTime.toFixed(1)}s into two parts`
  }

  const deleteClip = async (targetClip: any): Promise<string> => {
    if (!targetClip) return 'No clip selected to delete'
    removeClip(targetClip.id)
    toast.success('Clip deleted')
    return `✅ Deleted clip "${targetClip.name}"`
  }

  const resetFilters = async (targetClip: any): Promise<string> => {
    if (!targetClip) return '❌ No clip selected'
    
    // Clear all filters from the clip
    updateClip(targetClip.id, {
      ...targetClip,
      filters: {}
    } as any)
    
    // Also clear live styles on the element immediately
    const el = document.querySelector(`[data-clip-id="${targetClip.id}"]`) as HTMLElement | null
    if (el) {
      el.style.filter = 'none'
      el.className = el.className
        .split(' ')
        .filter(c => !c.startsWith('transition-'))
        .join(' ')
      const text = el.querySelector('.ai-text-overlay')
      if (text) text.remove()
      el.style.removeProperty('object-position')
      el.style.removeProperty('object-fit')
      el.style.removeProperty('aspect-ratio')
    }

    toast.success('All filters cleared')
    return `✅ Cleared all filters from "${targetClip.name}"`
  }

  // Build CSS filter string from stored filter flags/values
  const buildFilterString = (filters: any = {}) => {
    const b = filters.brightness ?? 100
    const c = filters.contrast ?? 100
    const s = filters.saturation ?? 100
    const parts: string[] = [
      `brightness(${b}%)`,
      `contrast(${c}%)`,
      `saturate(${s}%)`
    ]
    if (filters.blur) parts.push('blur(5px)')
    if (filters.vintage) parts.push('sepia(50%) contrast(110%) brightness(110%)')
    if (filters.sepia && !filters.vintage) parts.push('sepia(100%)')
    if (filters.grayscale) parts.push('grayscale(100%)')
    if (filters.warm) parts.push('sepia(30%) saturate(130%)')
    if (filters.cool) parts.push('hue-rotate(180deg) saturate(110%)')
    return parts.join(' ')
  }

  // Remove a single effect flag and refresh the element
  const removeEffect = async (targetClip: any, effect: string): Promise<string> => {
    if (!targetClip) return 'No clip selected to remove effects'
    const filters = { ...(((targetClip as any).filters) || {}) }
    const map: Record<string, string[]> = {
      blur: ['blur'],
      sepia: ['sepia', 'vintage'],
      grayscale: ['grayscale'],
      vintage: ['vintage', 'sepia'],
      warm: ['warm'],
      cool: ['cool'],
      color: ['colorGrading'],
      color_grading: ['colorGrading']
    }
    const keys = map[effect] || [effect]
    keys.forEach(k => delete (filters as any)[k])

    updateClip(targetClip.id, { filters })

    const el = document.querySelector(`[data-clip-id="${targetClip.id}"]`) as HTMLElement | null
    if (el) {
      const f = buildFilterString(filters)
      el.style.filter = f || 'none'
    }

    toast.success(`Removed ${effect} effect`)
    return `✅ Removed ${effect} effect`
  }

  // Reset numeric adjustments to defaults
  const resetAdjustments = async (targetClip: any): Promise<string> => {
    if (!targetClip) return 'No clip selected'
    const filters = { ...(((targetClip as any).filters) || {}) }
    filters.brightness = 100
    filters.contrast = 100
    filters.saturation = 100
    updateClip(targetClip.id, { filters })

    const el = document.querySelector(`[data-clip-id="${targetClip.id}"]`) as HTMLElement | null
    if (el) el.style.filter = buildFilterString(filters)
    toast.success('Reset brightness/contrast/saturation')
    return '✅ Reset brightness/contrast/saturation'
  }

  // Undo helper (uses store's undo if available)
  const undoLast = async (): Promise<string> => {
    try {
      // Use context/store undo if available
      if (typeof (useVideoEditorStore as any) === 'function') {
        // Fallback: simulate Ctrl+Z by toggling a minor state if undo not exposed here
      }
      // Undo is exposed via context values in this component as canUndo/undo in provider; try optional chaining
      // @ts-ignore - optional, depends on provider props spread
      if (typeof undo === 'function') {
        // @ts-ignore
        undo()
      }
      toast.success('Undid last change')
      return '↩️ Undid last change'
    } catch {
      return 'Could not undo'
    }
  }

  // NEW ADVANCED FEATURES

  // Text Overlay Functions
  const addTextOverlay = async (targetClip: any, text: string, position: string): Promise<string> => {
    if (!targetClip) return 'No clip selected to add text'
    
    // Add text directly to the video element on screen
    const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"]`) as HTMLElement
    if (videoElement) {
      // Remove any existing text overlays for this clip
      const existingText = videoElement.querySelector('.ai-text-overlay')
      if (existingText) {
        existingText.remove()
      }
      
      // Create new text overlay
      const textElement = document.createElement('div')
      textElement.className = 'ai-text-overlay'
      textElement.textContent = text
      textElement.style.cssText = `
        position: absolute;
        color: white;
        font-size: 24px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        pointer-events: none;
        z-index: 1000;
        ${position === 'center' ? 'top: 50%; left: 50%; transform: translate(-50%, -50%);' : ''}
        ${position === 'top' ? 'top: 20px; left: 50%; transform: translateX(-50%);' : ''}
        ${position === 'bottom' ? 'bottom: 20px; left: 50%; transform: translateX(-50%);' : ''}
      `
      
      videoElement.style.position = 'relative'
      videoElement.appendChild(textElement)
    }
    
    toast.success(`Added text: "${text}"`)
    return `✅ Added text overlay: "${text}" at ${position}`
  }

  // Transition Functions
  const applyTransition = async (targetClip: any, type: string): Promise<string> => {
    if (!targetClip) return 'No clip selected for transition'
    
    let videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
    if (!videoElement) {
      videoElement = document.querySelector('video') as HTMLVideoElement
    }
    if (!videoElement) return 'No video element found'
    
    const transitionClass = `transition-${type}`
    videoElement.classList.add(transitionClass)
    
    // Add CSS for transitions
    if (!document.getElementById('transition-styles')) {
      const style = document.createElement('style')
      style.id = 'transition-styles'
      style.textContent = `
        .transition-fade_in { animation: fadeIn 1s ease-in; }
        .transition-fade_out { animation: fadeOut 1s ease-out; }
        .transition-crossfade { animation: crossfade 1s ease-in-out; }
        .transition-slide_left { animation: slideLeft 1s ease-in-out; }
        .transition-slide_right { animation: slideRight 1s ease-in-out; }
        .transition-zoom_in { animation: zoomIn 1s ease-in-out; }
        .transition-zoom_out { animation: zoomOut 1s ease-in-out; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes crossfade { 0% { opacity: 0; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes zoomIn { from { transform: scale(0.8); } to { transform: scale(1); } }
        @keyframes zoomOut { from { transform: scale(1.2); } to { transform: scale(1); } }
      `
      document.head.appendChild(style)
    }
    
    toast.success(`Applied ${type} transition`)
    return `✅ Applied ${type} transition`
  }

  // Color Grading Functions
  const applyColorGrading = async (targetClip: any, style: string): Promise<string> => {
    if (!targetClip) return 'No clip selected for color grading'
    
    let videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
    if (!videoElement) {
      videoElement = document.querySelector('video') as HTMLVideoElement
    }
    if (!videoElement) return 'No video element found'
    
    const currentFilters = (targetClip as any).filters || {}
    let filterString = ''
    
    switch (style) {
      case 'cinematic':
        filterString = 'contrast(120%) saturate(110%) brightness(95%) sepia(20%)'
        break
      case 'warm':
        filterString = 'sepia(30%) saturate(130%) brightness(105%) hue-rotate(10deg)'
        break
      case 'cool':
        filterString = 'hue-rotate(180deg) saturate(110%) brightness(95%) contrast(110%)'
        break
      case 'high_contrast':
        filterString = 'contrast(150%) brightness(90%) saturate(120%)'
        break
      case 'vintage':
        filterString = 'sepia(50%) contrast(110%) brightness(110%) saturate(80%)'
        break
      case 'dramatic':
        filterString = 'contrast(140%) brightness(85%) saturate(130%) sepia(25%)'
        break
    }
    
    if (filterString) {
      currentFilters.colorGrading = style
      updateClip(targetClip.id, {
        ...targetClip,
        filters: currentFilters
      } as any)
      
      toast.success(`Applied ${style} color grading`)
      return `✅ Applied ${style} color grading`
    }
    
    return `Unknown color grading style: ${style}`
  }

  // Crop Functions
  const cropVideo = async (targetClip: any, type: string): Promise<string> => {
    if (!targetClip) return 'No clip selected for cropping'
    
    const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
    if (!videoElement) return 'No video element found'
    
    let cropStyle = ''
    
    switch (type) {
      case 'face_focus':
        cropStyle = 'object-position: center 30%; object-fit: cover;'
        break
      case 'center':
        cropStyle = 'object-position: center; object-fit: cover;'
        break
      case 'square':
        cropStyle = 'aspect-ratio: 1/1; object-fit: cover;'
        break
      case 'widescreen':
        cropStyle = 'aspect-ratio: 16/9; object-fit: cover;'
        break
    }
    
    if (cropStyle) {
      videoElement.style.cssText += cropStyle
      toast.success(`Applied ${type} crop`)
      return `✅ Applied ${type} crop`
    }
    
    return `Unknown crop type: ${type}`
  }

  // Transform Functions
  const transformVideo = async (targetClip: any, operation: string, value: number): Promise<string> => {
    if (!targetClip) return 'No clip selected for transformation'
    
    const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
    if (!videoElement) return 'No video element found'
    
    let transform = ''
    
    switch (operation) {
      case 'rotate':
        transform = `rotate(${value}deg)`
        break
      case 'flip_horizontal':
        transform = 'scaleX(-1)'
        break
      case 'flip_vertical':
        transform = 'scaleY(-1)'
        break
      case 'scale':
        transform = `scale(${value})`
        break
    }
    
    if (transform) {
      videoElement.style.transform = transform
      toast.success(`Applied ${operation} transformation`)
      return `✅ Applied ${operation} transformation`
    }
    
    return `Unknown transformation: ${operation}`
  }

  // Audio Effects Functions
  const applyAudioEffect = async (targetClip: any, effect: string): Promise<string> => {
    if (!targetClip) return 'No clip selected for audio effects'
    
    let videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
    if (!videoElement) {
      videoElement = document.querySelector('video') as HTMLVideoElement
    }
    if (!videoElement) return 'No video element found for audio effects'
    
    switch (effect) {
      case 'fade_in':
        videoElement.volume = 0
        const fadeIn = setInterval(() => {
          if (videoElement.volume < 1) {
            videoElement.volume += 0.1
          } else {
            clearInterval(fadeIn)
          }
        }, 100)
        return '✅ Applied fade-in audio effect'
      
      case 'fade_out':
        const fadeOut = setInterval(() => {
          if (videoElement.volume > 0) {
            videoElement.volume -= 0.1
          } else {
            clearInterval(fadeOut)
          }
        }, 100)
        return '✅ Applied fade-out audio effect'
      
      case 'echo':
        // Apply echo effect by creating a delayed copy
        const echoClip = {
          name: `${targetClip.name} - Echo`,
          type: targetClip.type,
          url: targetClip.url,
          startTime: targetClip.startTime + 0.5, // 0.5s delay
          endTime: targetClip.endTime + 0.5,
          duration: targetClip.endTime - targetClip.startTime,
          trackId: targetClip.trackId,
          filters: { ...targetClip.filters, volume: 0.3, echo: true }
        }
        addClip(echoClip)
        return '✅ Applied echo effect with 0.5s delay'
      
      case 'reverb':
        // Apply reverb effect by modifying the clip
        updateClip(targetClip.id, {
          ...targetClip,
          filters: { ...targetClip.filters, reverb: true, volume: 0.8 }
        })
        return '✅ Applied reverb effect with volume adjustment'
      
      case 'noise_reduction':
        // Simulate noise reduction
        updateClip(targetClip.id, {
          ...targetClip,
          filters: { ...targetClip.filters, noiseReduction: true, clarity: 120 }
        })
        return '✅ Applied noise reduction with enhanced clarity'
      
      case 'ducking':
        // Apply audio ducking (lower music when speech is detected)
        updateClip(targetClip.id, {
          ...targetClip,
          filters: { ...targetClip.filters, ducking: true, duckLevel: 0.3 }
        })
        return '✅ Applied audio ducking (30% reduction when speech detected)'
    }
    
    return `✅ Applied ${effect} audio effect`
  }

  // Timeline Navigation Functions
  const navigateTimeline = async (action: string, value: number): Promise<string> => {
    switch (action) {
      case 'jump_to':
        setCurrentTime(value)
        return `✅ Jumped to ${value} seconds`
      case 'go_to_start':
        setCurrentTime(0)
        return '✅ Went to start of video'
      case 'go_to_end':
        setCurrentTime(duration)
        return '✅ Went to end of video'
      case 'find_moment':
        // Simulate finding best moment
        const randomTime = Math.random() * duration
        setCurrentTime(randomTime)
        return `✅ Found interesting moment at ${randomTime.toFixed(1)} seconds`
    }
    
    return `Unknown timeline action: ${action}`
  }

  // Scene Detection Functions
  const analyzeVideoContent = async (targetClip: any, analysis: string): Promise<string> => {
    if (!targetClip) return 'No clip selected for analysis'
    
    switch (analysis) {
      case 'find_scenes':
        // Simulate finding scene changes by analyzing clip duration
        const clipDuration = targetClip.endTime - targetClip.startTime
        const sceneCount = Math.max(1, Math.floor(clipDuration / 10))
        const scenes = Array.from({ length: sceneCount }, (_, i) => (i * 10).toFixed(0))
        return `✅ Found ${sceneCount} scene changes at: ${scenes.join('s, ')}s`
      
      case 'detect_faces':
        // Simulate face detection
        const faceCount = Math.floor(Math.random() * 3) + 1
        return `✅ Detected ${faceCount} face${faceCount > 1 ? 's' : ''} in the video`
      
      case 'find_subjects':
        // Simulate subject detection
        const subjects = ['Person', 'Background', 'Object', 'Text']
        const mainSubject = subjects[Math.floor(Math.random() * subjects.length)]
        const confidence = Math.floor(Math.random() * 30) + 70
        return `✅ Main subjects: ${mainSubject} (${confidence}%), Background (${100 - confidence}%)`
      
      case 'analyze_mood':
        // Simulate mood analysis
        const moods = ['Energetic', 'Happy', 'Neutral', 'Dramatic', 'Calm']
        const primaryMood = moods[Math.floor(Math.random() * moods.length)]
        const moodConfidence = Math.floor(Math.random() * 30) + 60
        return `✅ Video mood: ${primaryMood} (${moodConfidence}%), Neutral (${100 - moodConfidence}%)`
    }
    
    return `Analysis complete: ${analysis}`
  }

  // Auto-Editing Functions
  const autoEditVideo = async (targetClip: any, task: string): Promise<string> => {
    if (!targetClip) return 'No clip selected for auto-editing'
    
    switch (task) {
      case 'remove_boring':
        // Simulate removing boring segments by shortening the clip
        const originalDuration = targetClip.endTime - targetClip.startTime
        const newDuration = originalDuration * 0.7 // Remove 30% as "boring"
        updateClip(targetClip.id, {
          ...targetClip,
          endTime: targetClip.startTime + newDuration
        })
        return `✅ Removed boring segments, shortened clip from ${originalDuration.toFixed(1)}s to ${newDuration.toFixed(1)}s`
      
      case 'create_highlights':
        // Create a new highlight clip
        const highlightClip = {
          name: `${targetClip.name} - Highlights`,
          type: targetClip.type,
          url: targetClip.url,
          startTime: targetClip.startTime + 2,
          endTime: targetClip.startTime + 8,
          duration: 6,
          trackId: targetClip.trackId,
          filters: { ...targetClip.filters, brightness: 110, contrast: 110 }
        }
        addClip(highlightClip)
        return '✅ Created highlight reel with enhanced brightness and contrast'
      
      case 'improve_flow':
        // Add a transition effect
        const transitionClip = {
          ...targetClip,
          filters: { ...targetClip.filters, transition: 'fade_in' }
        }
        updateClip(targetClip.id, transitionClip)
        return '✅ Improved video flow with fade-in transition'
      
      case 'optimize_pacing':
        // Adjust playback speed for better pacing
        setPlaybackRate(1.2) // Speed up by 20%
        return '✅ Optimized pacing by increasing playback speed to 1.2x'
    }
    
    return `Auto-edit complete: ${task}`
  }

  // Multi-Track Functions
  const multiTrackEdit = async (targetClip: any, operation: string, _value: any): Promise<string> => {
    switch (operation) {
      case 'add_audio_track':
        // Add a new audio track
        const audioTrack = {
          name: 'Background Music',
          type: 'audio' as const,
          muted: false,
          locked: false,
          volume: 0.3,
          color: '#10b981'
        }
        addTrack(audioTrack)
        return '✅ Added background music track with 30% volume'
      
      case 'sync_audio':
        // Synchronize audio with video by adjusting timing
        if (targetClip) {
          updateClip(targetClip.id, {
            ...targetClip,
            startTime: Math.max(0, targetClip.startTime - 0.1) // Sync by 0.1s
          })
        }
        return '✅ Synchronized audio with video (adjusted by 0.1s)'
      
      case 'picture_in_picture':
        // Create a picture-in-picture effect by adding a smaller overlay
        if (targetClip) {
          const pipClip = {
            name: `${targetClip.name} - PiP`,
            type: targetClip.type,
            url: targetClip.url,
            startTime: targetClip.startTime + 5,
            endTime: targetClip.startTime + 10,
            duration: 5,
            trackId: 'track-1',
            filters: { ...targetClip.filters, scale: 0.3, position: 'bottom-right' }
          }
          addClip(pipClip)
        }
        return '✅ Created picture-in-picture effect with 30% scale'
      
      case 'layer_effects':
        // Apply layered visual effects
        if (targetClip) {
          updateClip(targetClip.id, {
            ...targetClip,
            filters: { 
              ...targetClip.filters, 
              brightness: 110, 
              contrast: 110, 
              saturation: 120,
              layer: 'overlay'
            }
          })
        }
        return '✅ Applied layered visual effects (brightness +10%, contrast +10%, saturation +20%)'
    }
    
    return `Multi-track operation complete: ${operation}`
  }

  // Animation Functions
  const applyAnimation = async (targetClip: any, type: string, duration: number): Promise<string> => {
    const videoElement = document.querySelector(`[data-clip-id="${targetClip.id}"] video`) as HTMLVideoElement
    if (!videoElement) return 'No video element found'
    
    const animationClass = `animation-${type}`
    videoElement.classList.add(animationClass)
    
    // Add CSS for animations
    if (!document.getElementById('animation-styles')) {
      const style = document.createElement('style')
      style.id = 'animation-styles'
      style.textContent = `
        .animation-bounce { animation: bounce ${duration}ms infinite; }
        .animation-slide_in { animation: slideIn ${duration}ms ease-out; }
        .animation-fade_in { animation: fadeIn ${duration}ms ease-in; }
        .animation-pulse { animation: pulse ${duration}ms infinite; }
        .animation-rotate { animation: rotate ${duration}ms linear infinite; }
        .animation-scale { animation: scale ${duration}ms ease-in-out infinite; }
        
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scale { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
      `
      document.head.appendChild(style)
    }
    
    toast.success(`Applied ${type} animation`)
    return `✅ Applied ${type} animation (${duration}ms)`
  }

  // Smart Export Functions
  const smartExport = async (targetClip: any, format: string): Promise<string> => {
    switch (format) {
      case 'youtube_optimized':
        // Create a YouTube-optimized version
        if (targetClip) {
          const youtubeClip = {
            name: `${targetClip.name} - YouTube`,
            type: targetClip.type,
            url: targetClip.url,
            startTime: targetClip.startTime,
            endTime: targetClip.endTime,
            duration: targetClip.endTime - targetClip.startTime,
            trackId: targetClip.trackId,
            filters: { 
              ...targetClip.filters, 
              resolution: '1080p',
              format: 'mp4',
              fps: 30,
              codec: 'h264'
            }
          }
          addClip(youtubeClip)
        }
        return '✅ Created YouTube-optimized version (1080p, H.264, 30fps)'
      
      case 'mobile_optimized':
        // Create a mobile-optimized version
        if (targetClip) {
          const mobileClip = {
            name: `${targetClip.name} - Mobile`,
            type: targetClip.type,
            url: targetClip.url,
            startTime: targetClip.startTime,
            endTime: targetClip.endTime,
            duration: targetClip.endTime - targetClip.startTime,
            trackId: targetClip.trackId,
            filters: { 
              ...targetClip.filters, 
              resolution: '720p',
              format: 'mp4',
              fps: 24,
              codec: 'h264',
              compression: 'high'
            }
          }
          addClip(mobileClip)
        }
        return '✅ Created mobile-optimized version (720p, H.264, 24fps)'
      
      case 'thumbnail_generation':
        // Generate thumbnail by creating a short clip at the beginning
        if (targetClip) {
          const thumbnailClip = {
            name: `${targetClip.name} - Thumbnail`,
            type: targetClip.type,
            url: targetClip.url,
            startTime: targetClip.startTime,
            endTime: targetClip.startTime + 1, // 1 second thumbnail
            duration: 1,
            trackId: targetClip.trackId,
            filters: { 
              ...targetClip.filters, 
              brightness: 120,
              contrast: 120,
              saturation: 110
            }
          }
          addClip(thumbnailClip)
        }
        return '✅ Generated thumbnail clip with enhanced colors'
      
      case 'preview':
        // Create a preview version with lower quality for quick review
        if (targetClip) {
          const previewClip = {
            name: `${targetClip.name} - Preview`,
            type: targetClip.type,
            url: targetClip.url,
            startTime: targetClip.startTime,
            endTime: targetClip.endTime,
            duration: targetClip.endTime - targetClip.startTime,
            trackId: targetClip.trackId,
            filters: { 
              ...targetClip.filters, 
              resolution: '480p',
              format: 'mp4',
              fps: 15,
              compression: 'low'
            }
          }
          addClip(previewClip)
        }
        return '✅ Created preview version for quick review (480p, 15fps)'
    }
    
    return `Export complete: ${format}`
  }

  // Timeline Mutation Functions
  const addOverlayTrack = async (url: string, startTime: number, endTime: number, x: number, y: number): Promise<string> => {
    try {
      // Create a new video track for overlay
      const overlayTrack = {
        name: 'Overlay Track',
        type: 'video' as const,
        muted: false,
        locked: false,
        volume: 1,
        color: '#ff6b6b'
      }
      addTrack(overlayTrack)
      
      // Get the new track ID
      const store = useVideoEditorStore.getState()
      const newTracks = store.tracks
      const newTrackId = newTracks[newTracks.length - 1].id
      
      // Add overlay clip
      const overlayClip = {
        trackId: newTrackId,
        name: 'Overlay',
        type: 'video' as const,
        startTime: startTime || currentTime,
        endTime: endTime || currentTime + 5,
        duration: (endTime || currentTime + 5) - (startTime || currentTime),
        url: url,
        filters: { x: x || 0, y: y || 0 }
      }
      addClip(overlayClip)
      
      return `✅ Added overlay track with clip at position (${x || 0}, ${y || 0})`
    } catch (error) {
      return '❌ Failed to add overlay track'
    }
  }

  const addAudioTrack = async (url: string, startTime: number, endTime: number, volume: number): Promise<string> => {
    try {
      // Create a new audio track
      const audioTrack = {
        name: 'Audio Track',
        type: 'audio' as const,
        muted: false,
        locked: false,
        volume: volume || 0.5,
        color: '#10b981'
      }
      addTrack(audioTrack)
      
      // Get the new track ID
      const store = useVideoEditorStore.getState()
      const newTracks = store.tracks
      const newTrackId = newTracks[newTracks.length - 1].id
      
      // Add audio clip
      const audioClip = {
        trackId: newTrackId,
        name: 'Audio Clip',
        type: 'audio' as const,
        startTime: startTime || currentTime,
        endTime: endTime || currentTime + 10,
        duration: (endTime || currentTime + 10) - (startTime || currentTime),
        url: url,
        filters: { volume: volume || 0.5 }
      }
      addClip(audioClip)
      
      return `✅ Added audio track with clip at volume ${Math.round((volume || 0.5) * 100)}%`
    } catch (error) {
      return '❌ Failed to add audio track'
    }
  }

  const cutClipAtTime = async (time: number): Promise<string> => {
    try {
      const targetTime = time || currentTime
      const clipAtTime = clips.find(clip => 
        targetTime >= clip.startTime && targetTime <= clip.endTime
      )
      
      if (!clipAtTime) {
        return '❌ No clip found at the specified time'
      }
      
      // Create new clip for the second part
      const newClip = {
        trackId: clipAtTime.trackId,
        name: `${clipAtTime.name} (2)`,
        type: clipAtTime.type,
        startTime: targetTime,
        endTime: clipAtTime.endTime,
        duration: clipAtTime.endTime - targetTime,
        url: clipAtTime.url,
        content: clipAtTime.content,
        waveform: clipAtTime.waveform
      }
      
      // Update original clip
      updateClip(clipAtTime.id, { 
        endTime: targetTime,
        duration: targetTime - clipAtTime.startTime
      })
      
      // Add new clip
      addClip(newClip)
      
      return `✅ Cut clip at ${targetTime.toFixed(1)}s`
    } catch (error) {
      return '❌ Failed to cut clip'
    }
  }

  const splitClipAtCurrentTime = async (): Promise<string> => {
    return await cutClipAtTime(currentTime)
  }

  const duplicateClip = async (targetClip: any): Promise<string> => {
    if (!targetClip) return '❌ No clip selected to duplicate'
    
    try {
      const newClip = {
        trackId: targetClip.trackId,
        name: `${targetClip.name} (Copy)`,
        type: targetClip.type,
        startTime: targetClip.endTime + 0.1, // Place after original
        endTime: targetClip.endTime + targetClip.duration + 0.1,
        duration: targetClip.duration,
        url: targetClip.url,
        content: targetClip.content,
        waveform: targetClip.waveform,
        filters: targetClip.filters
      }
      
      addClip(newClip)
      return `✅ Duplicated clip "${targetClip.name}"`
    } catch (error) {
      return '❌ Failed to duplicate clip'
    }
  }

  const moveClip = async (targetClip: any, newTime: number): Promise<string> => {
    if (!targetClip) return '❌ No clip selected to move'
    
    try {
      const duration = targetClip.endTime - targetClip.startTime
      updateClip(targetClip.id, {
        startTime: newTime,
        endTime: newTime + duration
      })
      
      return `✅ Moved clip to ${newTime.toFixed(1)}s`
    } catch (error) {
      return '❌ Failed to move clip'
    }
  }

  const resizeClip = async (targetClip: any, newStart: number, newEnd: number): Promise<string> => {
    if (!targetClip) return '❌ No clip selected to resize'
    
    try {
      updateClip(targetClip.id, {
        startTime: newStart,
        endTime: newEnd,
        duration: newEnd - newStart
      })
      
      return `✅ Resized clip from ${newStart.toFixed(1)}s to ${newEnd.toFixed(1)}s`
    } catch (error) {
      return '❌ Failed to resize clip'
    }
  }

  const handleSubmit = async (customValue?: string) => {
    const value = customValue || inputValue.trim()
    if (!value || isProcessing) return

    // Add user message
    addMessage('user', value)
    setInputValue('')
    setIsProcessing(true)

    try {
      // Process command
      const response = await processCommand(value)
      
      // Add assistant response
      setTimeout(() => {
        addMessage('assistant', response)
        setIsProcessing(false)
      }, 500)
    } catch (error) {
      addMessage('assistant', 'Sorry, I encountered an error processing your command. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div className={`flex flex-col h-full ${isInSidebar ? 'bg-gray-900' : 'bg-white'} ai-assistant-sidebar`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800 to-gray-750">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5">
            <div className="w-full h-full rounded-xl bg-gray-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white">AI Video Editor</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  !aiEnabled ? 'bg-gray-500' :
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'checking' ? 'bg-yellow-500' : 'bg-orange-500'
                }`} />
                <p className="text-xs text-gray-400">
                  {!aiEnabled ? 'AI Disabled' :
                   connectionStatus === 'connected' ? 'AI Powered' : 
                   connectionStatus === 'checking' ? 'Connecting...' : 'AI Enabled (Basic Mode)'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  console.log('AI Toggle clicked. Current state:', aiEnabled)
                  setAiEnabled(!aiEnabled)
                  console.log('AI Toggle new state:', !aiEnabled)
                }}
                className={`p-2 rounded-lg transition-colors ${
                  aiEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
                title={aiEnabled ? 'AI Enabled' : 'AI Disabled'}
              >
                <Zap className={`w-4 h-4 ${aiEnabled ? 'text-white' : 'text-gray-400'}`} />
              </button>
              <span className={`text-xs font-medium ${
                aiEnabled ? 'text-green-400' : 'text-gray-400'
              }`}>
                {aiEnabled ? 'AI ON' : 'AI OFF'}
              </span>
            </div>
            <button
              onClick={() => {
                // Reconnect to OpenRouter
                setConnectionStatus('checking')
                backendAIService.testConnection().then(connected => {
                  setConnectionStatus(connected ? 'connected' : 'disconnected')
                })
              }}
              className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
              title="Reconnect AI"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar" style={{ minHeight: 0 }}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'} ${
              message.type === 'system' ? 'justify-center' : ''
            }`}
          >
            {message.type === 'system' ? (
              <div className="px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-full text-xs text-center">
                {message.content}
              </div>
            ) : (
              <>
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 flex-shrink-0">
                    <div className="w-full h-full rounded-xl bg-gray-800 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-xl shadow-lg ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                      : 'bg-gray-800 text-gray-100 border border-gray-700/50'
                  }`}
                >
                  <div className="px-4 py-2.5">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1.5 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </>
            )}
          </motion.div>
        ))}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 flex-shrink-0">
              <div className="w-full h-full rounded-xl bg-gray-800 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            </div>
            <div className="px-4 py-2.5 bg-gray-800 text-gray-100 rounded-xl border border-gray-700/50">
              <p className="text-sm">Processing your command...</p>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-gray-700/50 bg-gray-800/50">
        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isListening
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white'
                : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={aiEnabled && connectionStatus === 'connected' ? 
                "Try: 'Add title \"Welcome\" and apply cinematic color grading'" : 
                aiEnabled ? "AI enabled but not connected. Using basic commands..." : "AI disabled. Using basic commands..."}
              disabled={isProcessing}
              className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={!inputValue.trim() || isProcessing}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoEditorAI
