import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVideoEditor } from '../contexts/VideoEditorContext'
import toast from 'react-hot-toast'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

const TestVideoEditorAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get video editor context
  let clips: any[] = []
  let updateClip: any = () => {}
  let selectedClipId: string | null = null
  let setIsPlaying: any = () => {}
  let setCurrentTime: any = () => {}
  let currentTime = 0
  let addClip: any = () => {}
  let removeClip: any = () => {}
  let setPlaybackRate: any = () => {}
  let setZoom: any = () => {}
  let zoom = 100

  try {
    const context = useVideoEditor()
    clips = context.clips
    updateClip = context.updateClip
    selectedClipId = context.selectedClipId
    setIsPlaying = context.setIsPlaying
    setCurrentTime = context.setCurrentTime
    currentTime = context.currentTime
    addClip = context.addClip
    removeClip = context.removeClip
    setPlaybackRate = context.setPlaybackRate
    setZoom = context.setZoom
    zoom = context.zoom
  } catch (error) {
    console.log('VideoEditor context not available, using defaults')
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

  // Add welcome message when panel opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('assistant', 'Welcome! I\'m your Video Editor AI Assistant. I can help you edit videos with voice and text commands!')
      addMessage('system', 'Try: "increase brightness", "add blur effect", "play video", or "set volume to 80"')
    }
  }, [isOpen])

  // Process video editing commands
  const processCommand = async (command: string): Promise<string> => {
    const lowerCommand = command.toLowerCase()

    // Get selected clip or first clip
    const targetClip = selectedClipId 
      ? clips.find(c => c.id === selectedClipId)
      : clips[0]

    if (!targetClip && !lowerCommand.includes('play') && !lowerCommand.includes('pause') && !lowerCommand.includes('zoom')) {
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
        
        // Apply filter to the main video element
        const videoElement = document.querySelector('video') as HTMLVideoElement
        if (videoElement) {
          const currentFilter = videoElement.style.filter || ''
          const newFilter = currentFilter.replace(/brightness\([^)]*\)/g, '') + ` brightness(${newBrightness}%)`
          videoElement.style.filter = newFilter.trim()
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
        
        // Apply filter to the main video element
        const videoElement = document.querySelector('video') as HTMLVideoElement
        if (videoElement) {
          const currentFilter = videoElement.style.filter || ''
          const newFilter = currentFilter.replace(/brightness\([^)]*\)/g, '') + ` brightness(${newBrightness}%)`
          videoElement.style.filter = newFilter.trim()
        }
        
        toast.success(`✅ Brightness decreased to ${newBrightness}%`)
        return `✅ Decreased brightness to ${newBrightness}% for "${targetClip.name}"`
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

    // VOLUME COMMANDS
    if (lowerCommand.includes('volume')) {
      const match = lowerCommand.match(/(\d+)/)
      const value = match ? parseInt(match[0]) : 50
      
      const mediaElements = document.querySelectorAll('video, audio')
      mediaElements.forEach((element: any) => {
        element.volume = Math.min(1, value / 100)
      })
      toast.success(`✅ Volume set to ${value}%`)
      return `✅ Set volume to ${value}%`
    }

    // EFFECTS COMMANDS
    if (lowerCommand.includes('blur')) {
      if (!targetClip) return 'No clip selected to apply effects'
      
      const videoElement = document.querySelector('video') as HTMLVideoElement
      if (!videoElement) return 'No video element found'
      
      const currentFilters = (targetClip as any).filters || {}
      currentFilters.blur = true
      
      // Apply blur filter while preserving existing filters
      const currentFilter = videoElement.style.filter || ''
      const newFilter = currentFilter.replace(/blur\([^)]*\)/g, '') + ` blur(5px)`
      videoElement.style.filter = newFilter.trim()
      
      updateClip(targetClip.id, {
        ...targetClip,
        filters: currentFilters
      } as any)
      
      toast.success('✅ Applied blur effect')
      return `✅ Applied blur effect to "${targetClip.name}"`
    }

    // Default response
    return `I understand you want to: "${command}". Try these commands:

✅ Brightness: "increase brightness by 20", "make it darker"
✅ Effects: "add blur effect"
✅ Volume: "set volume to 80"
✅ Playback: "play", "pause"`
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

  return (
    <>
      {/* AI Assistant Button */}
      <motion.div 
        className="fixed bottom-6 left-6 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1,
          scale: 1,
          y: [0, -8, 0]
        }}
        transition={{ 
          opacity: { duration: 0.3 },
          scale: { duration: 0.3 },
          y: { 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <motion.button
          onClick={() => {
            console.log('AI Assistant button clicked!', { isOpen })
            setIsOpen(!isOpen)
          }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 shadow-2xl border-2 border-white/30 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center relative overflow-hidden"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" style={{ display: 'none' }}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-orange-500/40"></div>
          </div>
          
          {/* AI Text Overlay */}
          <span className="relative text-white font-bold text-lg drop-shadow-lg">AI</span>
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
            className="fixed bottom-6 left-6 w-[420px] h-[650px] rounded-3xl shadow-2xl flex flex-col overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 backdrop-blur-xl z-50"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 px-6 py-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-0.5">
                      <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-900">
                        <img
                          src="/images/artificial-8587685_1280.jpg"
                          alt="Video Editor AI"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white leading-tight mb-0.5">
                      Video Editor AI
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <p className="text-gray-400 text-sm leading-tight truncate">
                        Ready to help you edit!
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-all duration-200 flex-shrink-0 ml-3 group"
                >
                  <span className="text-gray-400 group-hover:text-white transition-colors text-lg">✕</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-gray-900/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1 mb-6 shadow-2xl"
                  >
                    <div className="w-full h-full rounded-3xl bg-gray-800 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">AI</span>
                    </div>
                  </motion.div>
                  <h4 className="text-xl font-bold text-white mb-2">Ready to Edit!</h4>
                  <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">
                    Type commands below to edit your video
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
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-0.5 flex-shrink-0 shadow-lg">
                            <div className="w-full h-full rounded-2xl bg-gray-800 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">AI</span>
                            </div>
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl shadow-xl ${
                            message.type === 'user'
                              ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-sm'
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
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-white font-bold text-sm">U</span>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Text Input */}
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
                  <span className="text-lg">➤</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default TestVideoEditorAssistant
