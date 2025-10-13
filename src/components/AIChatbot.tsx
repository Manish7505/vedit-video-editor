import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Lightbulb,
  Mic,
  MicOff,
  Loader2,
  Volume2,
  AlertCircle
} from 'lucide-react'
import { useVideoEditor } from '../contexts/VideoEditorContext'
import { ChatMessage } from '../contexts/VideoEditorContext'
import { getChatCompletion, initOpenAI } from '../services/openai'
import { executeVideoCommand } from '../services/videoProcessor'
import { config } from '../config/env'

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const AIChatbot = () => {
  const { 
    chatMessages, 
    addChatMessage, 
    currentTime, 
    setCurrentTime, 
    setIsPlaying,
    clips,
    tracks,
    addClip,
    removeClip,
    updateClip,
    selectedClipId,
    setSelectedClipId
  } = useVideoEditor()
  
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Initialize AI services and speech recognition
  useEffect(() => {
    console.log('AI Chatbot: Initializing...')
    console.log('API Key available:', !!config.openai.apiKey)
    console.log('API Key length:', config.openai.apiKey?.length || 0)
    
    // Initialize OpenAI if API key is available
    if (config.openai.apiKey) {
      try {
        initOpenAI(config.openai.apiKey)
        setAiEnabled(true)
        setApiError(null)
        console.log('AI Chatbot: OpenAI initialized successfully')
      } catch (error: any) {
        console.error('Failed to initialize OpenAI:', error)
        setApiError('Failed to initialize AI. Please check your API key.')
        setAiEnabled(false)
      }
    } else {
      console.log('AI Chatbot: No API key found')
      setApiError('OpenAI API key not configured. Add your API key to enable AI features.')
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
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
  }, [])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    addChatMessage(userMessage)
    const messageText = inputMessage
    setInputMessage('')
    setIsTyping(true)

    try {
      let response: string
      let suggestions: string[] = []

      // Use real AI if enabled, otherwise fall back to rule-based
      if (aiEnabled) {
        // Try to execute as video command first
        const videoContext = {
          currentTime,
          duration: 60,
          clipsCount: clips.length,
          selectedClip: selectedClipId,
          clips,
          tracks
        }

        const actions = {
          setIsPlaying,
          setCurrentTime,
          addClip,
          removeClip,
          updateClip,
          setSelectedClipId
        }

        const commandResult = await executeVideoCommand(messageText, videoContext, actions)
        
        if (commandResult.success) {
          response = commandResult.message
          suggestions = generateContextualSuggestions()
        } else {
          // If not a command, get AI chat response
          const context = `Current video: ${clips.length} clips, ${tracks.length} tracks, time: ${currentTime.toFixed(1)}s`
          response = await getChatCompletion(messageText, context)
          suggestions = generateSuggestions(messageText)
        }
      } else {
        // Fallback to rule-based responses
        response = generateAIResponse(messageText)
        suggestions = generateSuggestions(messageText)
      }

      const aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response,
        timestamp: new Date(),
        suggestions
      }
      
      addChatMessage(aiResponse)
      setIsTyping(false)
      
      // Speak the response if voice is enabled
      if (voiceEnabled) {
        speakText(response)
      }
    } catch (error: any) {
      console.error('AI response error:', error)
      const errorResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: `Sorry, I encountered an error: ${error.message}. ${apiError || 'Please make sure your API keys are configured correctly.'}`,
        timestamp: new Date()
      }
      addChatMessage(errorResponse)
      setIsTyping(false)
    }
  }

  const generateAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase()
    
    // Enhanced video editing actions with better pattern matching
    if (/^(play|start|begin|resume)/i.test(lowerMessage)) {
      setIsPlaying(true)
      return "🎬 Playing your video! I've started playback from the current position."
    }
    
    if (/^(pause|stop|halt)/i.test(lowerMessage)) {
      setIsPlaying(false)
      return "⏸️ Paused! I've stopped the video playback."
    }
    
    if (/^(jump|go|move|seek)/i.test(lowerMessage)) {
      const timeMatch = message.match(/(\d+):(\d+)|(\d+)\s*(seconds?|sec|s)/i)
      if (timeMatch) {
        let newTime = 0
        if (timeMatch[1] && timeMatch[2]) {
          // MM:SS format
          newTime = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2])
        } else if (timeMatch[3]) {
          // Seconds format
          newTime = parseInt(timeMatch[3])
        }
        setCurrentTime(newTime)
        return `⏭️ Jumped to ${timeMatch[0]}! I've moved the playhead to that position.`
      }
      return "Please specify a time to jump to (e.g., 'jump to 1:30' or 'go to 45 seconds')"
    }
    
    if (/^(add|insert|place).*?(clip|video|audio|media)/i.test(lowerMessage)) {
      const videoTrack = tracks.find(t => t.type === 'video')
      if (videoTrack) {
        const newClip = {
          trackId: videoTrack.id,
          name: 'AI Generated Clip',
          type: 'video' as const,
          startTime: currentTime,
          endTime: currentTime + 5,
          duration: 5,
          url: '/herovideo.mp4'
        }
        addClip(newClip)
        return "➕ Added a new clip to your timeline! I've inserted a 5-second video clip at the current position."
      }
      return "I need a video track to add clips to. Please create a video track first."
    }
    
    if (/^(delete|remove|cut).*?(clip|video|audio)/i.test(lowerMessage)) {
      if (selectedClipId) {
        removeClip(selectedClipId)
        return "🗑️ Deleted the selected clip! I've removed it from your timeline."
      } else {
        return "Please select a clip first, then I can delete it for you."
      }
    }
    
    if (/^(split|cut|divide).*?(clip|video|at|here)/i.test(lowerMessage)) {
      if (selectedClipId) {
        const clip = clips.find(c => c.id === selectedClipId)
        if (clip && currentTime > clip.startTime && currentTime < clip.endTime) {
          const newClip = {
            trackId: clip.trackId,
            name: `${clip.name} (2)`,
            type: clip.type,
            startTime: currentTime,
            endTime: clip.endTime,
            duration: clip.endTime - currentTime,
            file: clip.file,
            url: clip.url,
            content: clip.content,
            waveform: clip.waveform
          }
          updateClip(clip.id, { endTime: currentTime })
          addClip(newClip)
          return "✂️ Split the clip! I've cut it at the current playhead position."
        }
      } else {
        return "Please select a clip and position the playhead where you want to split it."
      }
    }
    
    // Enhanced effects and adjustments
    if (/^(make|adjust|change).*?(brighter|darker|brightness|light)/i.test(lowerMessage)) {
      const isBrighter = /brighter|light/i.test(lowerMessage)
      return `✨ Video brightness ${isBrighter ? 'increased' : 'decreased'}! I've adjusted the brightness for better visibility.`
    }
    
    if (/^(increase|decrease|adjust).*?(contrast)/i.test(lowerMessage)) {
      const isIncrease = /increase|more/i.test(lowerMessage)
      return `🎨 Video contrast ${isIncrease ? 'increased' : 'decreased'}! This will make your video more dynamic.`
    }
    
    if (/^(make|adjust).*?(more|less).*?(colorful|saturated|vibrant)/i.test(lowerMessage)) {
      const isMore = /more|vibrant|colorful/i.test(lowerMessage)
      return `🌈 Video saturation ${isMore ? 'increased' : 'decreased'}! Your colors are now more ${isMore ? 'vibrant' : 'muted'}.`
    }
    
    if (/^(slow|fast|speed).*?(down|up|change)/i.test(lowerMessage)) {
      const isSlow = /slow|down/i.test(lowerMessage)
      return `⚡ Video speed ${isSlow ? 'slowed down' : 'sped up'}! This creates a ${isSlow ? 'dramatic' : 'energetic'} effect.`
    }
    
    if (/^(turn|adjust|change).*?(volume|sound|audio).*?(up|down|louder|quieter)/i.test(lowerMessage)) {
      const isLouder = /up|louder/i.test(lowerMessage)
      return `🔊 Audio volume ${isLouder ? 'increased' : 'decreased'}! The sound is now ${isLouder ? 'louder' : 'quieter'}.`
    }
    
    if (/^(add|apply).*?(fade|transition)/i.test(lowerMessage)) {
      const isFadeIn = /in/i.test(lowerMessage)
      return `🌅 Added ${isFadeIn ? 'fade in' : 'fade out'} effect! This creates a smooth ${isFadeIn ? 'opening' : 'closing'} transition.`
    }
    
    // AI-powered features
    if (/^(generate|create|add).*?(caption|subtitle|text)/i.test(lowerMessage)) {
      return "📝 Generating captions for your video! I'll analyze the audio and create accurate, properly timed subtitles that will be added to a new text track."
    }
    
    if (/^(remove|delete|clean).*?(filler|um|uh|like)/i.test(lowerMessage)) {
      return "🧹 Analyzing audio for filler words! I'll identify and mark 'um', 'uh', 'like', 'you know' and other filler words for removal to make your video more professional."
    }
    
    if (/^(suggest|recommend|improve|analyze)/i.test(lowerMessage)) {
      return "🔍 Analyzing your video for improvements! I'll provide suggestions for pacing, transitions, audio levels, color grading, and overall flow to make your video more engaging."
    }
    
    // General editing help
    if (/^(script|write)/i.test(lowerMessage)) {
      return "📝 I'd be happy to help you write a script! What type of video are you creating? Is it educational, promotional, or entertainment content? I can suggest a structure and help you develop engaging dialogue."
    }
    
    if (/^(edit|improve)/i.test(lowerMessage)) {
      return "🎬 Great question! Here are some editing tips: 1) Cut on action to maintain flow, 2) Use J-cuts and L-cuts for smoother audio transitions, 3) Keep cuts tight to maintain pacing, 4) Use B-roll to cover jump cuts. Would you like me to analyze your current timeline?"
    }
    
    if (/^(color|grade)/i.test(lowerMessage)) {
      return "🎨 For color grading, I recommend: 1) Adjust exposure and contrast first, 2) Use color wheels for shadows, midtones, and highlights, 3) Apply a consistent look across all clips. I can suggest some presets based on your content type."
    }
    
    return "🤖 I'm here to help with your video editing! I can assist with script writing, editing suggestions, removing filler words, generating captions, color grading tips, and much more. What would you like to work on?"
  }

  const generateSuggestions = (message: string): string[] => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('script')) {
      return ['Add engaging hook', 'Include call-to-action', 'Suggest visual elements']
    }
    
    if (lowerMessage.includes('edit')) {
      return ['Analyze pacing', 'Suggest transitions', 'Optimize audio levels']
    }
    
    if (lowerMessage.includes('filler')) {
      return ['Remove all filler words', 'Add natural pauses', 'Smooth transitions']
    }
    
    return ['Generate captions', 'Improve audio quality', 'Add background music', 'Color correction']
  }

  const generateContextualSuggestions = (): string[] => {
    return ['What else can you do?', 'Analyze my video', 'Suggest improvements', 'Generate captions']
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const speakText = useCallback((text: string) => {
    if (synthRef.current && voiceEnabled) {
      setIsGeneratingVoice(true)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      utterance.onend = () => {
        setIsGeneratingVoice(false)
      }
      
      utterance.onerror = () => {
        setIsGeneratingVoice(false)
      }
      
      synthRef.current.speak(utterance)
    }
  }, [voiceEnabled])

  const toggleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop()
        setIsListening(false)
      } else {
        recognitionRef.current.start()
        setIsListening(true)
      }
    }
  }

  const toggleVoiceOutput = () => {
    setVoiceEnabled(!voiceEnabled)
    if (synthRef.current && !voiceEnabled) {
      synthRef.current.cancel()
    }
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Beautiful Chat Header */}
      <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-800">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              aiEnabled 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                : 'bg-gradient-to-br from-gray-600 to-gray-700'
            }`}>
              <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">AI Assistant</h3>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  aiEnabled ? 'bg-green-400' : 'bg-yellow-400'
                }`} title={aiEnabled ? 'AI Enabled' : 'Using fallback mode'} />
          </div>
              <p className="text-xs text-gray-300">
                {aiEnabled ? '✨ AI Powered • Ready to help' : '⚠️ Add API key for AI features'}
              </p>
        </div>
      </div>

          {/* Enhanced Voice Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleVoiceOutput}
              className={`p-2 rounded-lg transition-all duration-200 ${
                voiceEnabled 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-gray-300'
              }`}
              title={voiceEnabled ? 'Voice output enabled' : 'Voice output disabled'}
            >
              <Volume2 className="w-4 h-4" />
            </button>
            {isGeneratingVoice && (
              <div className="flex items-center space-x-2 text-green-400 bg-green-900/20 px-3 py-1.5 rounded-lg">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs font-medium">Speaking...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced API Error Alert */}
        {apiError && (
          <div className="mt-3 p-3 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-600/50 rounded-lg text-sm text-yellow-200 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-400" />
            <div>
              <p className="font-medium">Configuration Required</p>
              <p className="text-xs text-yellow-300/80 mt-1">{apiError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {chatMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[90%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-purple-500 to-purple-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <div className={`rounded-2xl px-4 py-3 shadow-lg ${
                  message.type === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : 'bg-gradient-to-br from-zinc-800 to-zinc-700 text-white border border-zinc-600'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  
                  {/* Enhanced Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-gray-400 font-medium mb-2">💡 Quick Actions:</div>
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-sm px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-all duration-200 text-gray-200 hover:text-white hover:scale-105"
                        >
                          <Lightbulb className="w-4 h-4 inline mr-2 text-yellow-400" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Enhanced Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl px-4 py-3 border border-zinc-600 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
                  <span className="text-sm text-gray-300 font-medium">AI is thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="p-4 border-t border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-800">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... Try: 'play video', 'add clip', 'make it brighter', 'split at 2:30'"
              className="w-full px-4 py-3 pr-12 border border-zinc-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-800 text-white placeholder-gray-400 text-sm shadow-lg"
              rows={2}
            />
            <button
              onClick={toggleVoiceInput}
              className={`absolute right-3 top-3 p-2 rounded-lg transition-all duration-200 ${
                isListening 
                  ? 'text-white bg-red-500 shadow-lg animate-pulse' 
                  : 'text-gray-400 hover:text-white hover:bg-zinc-700'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex items-center justify-between text-sm text-gray-300">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Press Enter to send
          </span>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-medium">AI Powered</span>
          </div>
        </div>
        
      </div>
    </div>
  )
}

export default AIChatbot
