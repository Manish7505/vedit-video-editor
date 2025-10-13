import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Send, 
  Bot,
  FileText,
  Lightbulb,
  Wand2,
  Copy,
  Download,
  Sparkles,
  Clock,
  Target,
  TrendingUp,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  User
} from 'lucide-react'
import { useVideoEditor } from '../contexts/VideoEditorContext'
import { ChatMessage } from '../contexts/VideoEditorContext'
import { scriptGenerator } from '../services/scriptGenerator'
import type { VideoScript, BrainstormIdea } from '../services/scriptGenerator'

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const LocalAIAssistant = ({ isOpen, onClose, isInSidebar = false }: { isOpen: boolean; onClose: () => void; isInSidebar?: boolean }) => {
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

  const [activeTab, setActiveTab] = useState<'chat' | 'script'>('chat')
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Script Generator states
  const [scriptActiveTab, setScriptActiveTab] = useState<'titles' | 'outline' | 'script' | 'brainstorm'>('titles')
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(10)
  const [tone, setTone] = useState<'professional' | 'casual' | 'educational' | 'entertaining'>('professional')
  const [isGenerating, setIsGenerating] = useState(false)
  const [titles, setTitles] = useState<string[]>([])
  const [outline, setOutline] = useState<string[]>([])
  const [script, setScript] = useState<VideoScript | null>(null)
  const [ideas, setIdeas] = useState<BrainstormIdea[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Speech Recognition
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputMessage(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    setIsListening(false)
  }, [])

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    addChatMessage(userMessage)
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI response for video editing commands
    setTimeout(() => {
      const responses = [
        "I understand you want to work on video editing. Let me help you with that.",
        "I can assist you with video editing tasks. What would you like to do?",
        "I'm here to help with your video editing needs. What can I do for you?",
        "I can help you edit your video. What specific task would you like to perform?",
        "I'm ready to assist with video editing. What would you like to work on?"
      ]
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `${randomResponse}\n\nI can help you with:\n\n• **Video Editing**: Cut, trim, split, and arrange clips\n• **Audio Control**: Adjust volume, add music, sync audio\n• **Effects**: Apply filters, transitions, and visual effects\n• **Timeline Management**: Organize tracks and manage timing\n• **Export Options**: Choose formats and quality settings\n\nWhat would you like to do with your video?`,
        timestamp: new Date()
      }

      addChatMessage(aiMessage)
      setIsTyping(false)
    }, 1500)
  }

  // Script Generator Functions
  const generateTitles = async () => {
    if (!topic) return
    setIsGenerating(true)
    try {
      const generated = await scriptGenerator.generateTitles(topic, 10)
      setTitles(generated)
    } catch (error) {
      alert('Failed to generate titles. Please check your OpenAI API key.')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateOutline = async () => {
    if (!topic) return
    setIsGenerating(true)
    try {
      const generated = await scriptGenerator.generateOutline(topic, duration)
      setOutline(generated)
    } catch (error) {
      alert('Failed to generate outline. Please check your OpenAI API key.')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateScript = async () => {
    if (!topic) return
    setIsGenerating(true)
    try {
      const generated = await scriptGenerator.generateFullScript(topic, duration, tone)
      setScript(generated)
    } catch (error) {
      alert('Failed to generate script. Please check your OpenAI API key.')
    } finally {
      setIsGenerating(false)
    }
  }

  const brainstormIdeas = async () => {
    if (!topic) return
    setIsGenerating(true)
    try {
      const generated = await scriptGenerator.brainstormIdeas(topic, 10)
      setIdeas(generated)
    } catch (error) {
      alert('Failed to brainstorm ideas. Please check your OpenAI API key.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (!isOpen) return null

  const containerClass = isInSidebar 
    ? "w-full h-full bg-zinc-900 rounded-none shadow-none border-none overflow-hidden ai-assistant-sidebar"
    : "fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"

  return (
    <motion.div
      initial={isInSidebar ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
      animate={isInSidebar ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={isInSidebar ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
      className={containerClass}
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 text-white ai-assistant-header"
      >
        <div className="flex items-center justify-between w-full h-full">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
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
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center" style={{ display: 'none' }}>
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg leading-tight">
                VEdit AI Assistant
              </h3>
              <p className="text-white/80 text-sm leading-tight">
                Your video editing companion
              </p>
            </div>
          </div>
          {!isInSidebar && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className={`p-4 border-b ${isInSidebar ? 'border-zinc-800' : 'border-gray-200'} relative z-10`}>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'chat'
                ? isInSidebar 
                  ? 'bg-zinc-800 text-white' 
                  : 'bg-blue-600 text-white'
                : isInSidebar
                  ? 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Bot className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">AI Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'script'
                ? isInSidebar 
                  ? 'bg-zinc-800 text-white' 
                  : 'bg-blue-600 text-white'
                : isInSidebar
                  ? 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Script Gen</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative z-10" style={{ minHeight: '0' }}>
        {activeTab === 'chat' && (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" style={{ maxHeight: '400px' }}>
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : isInSidebar 
                          ? 'bg-zinc-800 text-white' 
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-lg ${isInSidebar ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className={`text-sm ${isInSidebar ? 'text-white' : 'text-gray-600'}`}>AI is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className={`p-4 border-t ${isInSidebar ? 'border-zinc-800' : 'border-gray-200'}`}>
              {error && (
                <div className="text-red-400 text-xs mb-3 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask me about video editing..."
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      isInSidebar 
                        ? 'border-zinc-700 bg-zinc-800 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-800'
                    }`}
                  />
                </div>
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`px-3 py-2.5 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 ${
                    isListening 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : isInSidebar
                        ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'script' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
            {/* Script Generator Header */}
            <div className="p-4 border-b border-zinc-800">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isInSidebar ? 'text-white' : 'text-gray-900'}`}>
                <Sparkles className="w-5 h-5 text-purple-500" />
                VAIA Script Generator
              </h2>
              <p className={`text-sm mt-1 ${isInSidebar ? 'text-gray-400' : 'text-gray-600'}`}>
                AI-powered script writing and brainstorming
              </p>
            </div>

            {/* Script Generator Tabs */}
            <div className="flex border-b border-zinc-800">
              {[
                { id: 'titles', label: 'Titles', icon: <FileText className="w-4 h-4" /> },
                { id: 'outline', label: 'Outline', icon: <Target className="w-4 h-4" /> },
                { id: 'script', label: 'Script', icon: <FileText className="w-4 h-4" /> },
                { id: 'brainstorm', label: 'Ideas', icon: <Lightbulb className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setScriptActiveTab(tab.id as any)}
                  className={`flex-1 px-2 py-3 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-1 ${
                    scriptActiveTab === tab.id
                      ? 'text-white border-white'
                      : 'text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  <span className="flex-shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Script Generator Content */}
            <div className="p-4">
              {/* Input Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isInSidebar ? 'text-white' : 'text-gray-700'}`}>
                    Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter your video topic..."
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      isInSidebar 
                        ? 'border-zinc-700 bg-zinc-800 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-800'
                    }`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isInSidebar ? 'text-white' : 'text-gray-700'}`}>
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min="1"
                      max="60"
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                        isInSidebar 
                          ? 'border-zinc-700 bg-zinc-800 text-white' 
                          : 'border-gray-300 bg-white text-gray-800'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isInSidebar ? 'text-white' : 'text-gray-700'}`}>
                      Tone
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as any)}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                        isInSidebar 
                          ? 'border-zinc-700 bg-zinc-800 text-white' 
                          : 'border-gray-300 bg-white text-gray-800'
                      }`}
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="educational">Educational</option>
                      <option value="entertaining">Entertaining</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Generate Buttons */}
              <div className="space-y-3">
                {scriptActiveTab === 'titles' && (
                  <button
                    onClick={generateTitles}
                    disabled={!topic || isGenerating}
                    className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <span className="flex-shrink-0">
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    </span>
                    <span className="truncate">Generate Titles</span>
                  </button>
                )}

                {scriptActiveTab === 'outline' && (
                  <button
                    onClick={generateOutline}
                    disabled={!topic || isGenerating}
                    className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <span className="flex-shrink-0">
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                    </span>
                    <span className="truncate">Generate Outline</span>
                  </button>
                )}

                {scriptActiveTab === 'script' && (
                  <button
                    onClick={generateScript}
                    disabled={!topic || isGenerating}
                    className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <span className="flex-shrink-0">
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    </span>
                    <span className="truncate">Generate Full Script</span>
                  </button>
                )}

                {scriptActiveTab === 'brainstorm' && (
                  <button
                    onClick={brainstormIdeas}
                    disabled={!topic || isGenerating}
                    className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <span className="flex-shrink-0">
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                    </span>
                    <span className="truncate">Brainstorm Ideas</span>
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="mt-6 space-y-4">
                {scriptActiveTab === 'titles' && titles.length > 0 && (
                  <div>
                    <h3 className={`font-semibold mb-3 ${isInSidebar ? 'text-white' : 'text-gray-900'}`}>Generated Titles</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {titles.map((title, index) => (
                        <div key={index} className={`p-3 rounded-lg ${isInSidebar ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                          <p className={`text-sm ${isInSidebar ? 'text-white' : 'text-gray-800'}`}>{title}</p>
                          <button
                            onClick={() => copyToClipboard(title)}
                            className="mt-2 text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scriptActiveTab === 'outline' && outline.length > 0 && (
                  <div>
                    <h3 className={`font-semibold mb-3 ${isInSidebar ? 'text-white' : 'text-gray-900'}`}>Generated Outline</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {outline.map((item, index) => (
                        <div key={index} className={`p-3 rounded-lg ${isInSidebar ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                          <p className={`text-sm ${isInSidebar ? 'text-white' : 'text-gray-800'}`}>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scriptActiveTab === 'script' && script && (
                  <div>
                    <h3 className={`font-semibold mb-3 ${isInSidebar ? 'text-white' : 'text-gray-900'}`}>Generated Script</h3>
                    <div className={`p-4 rounded-lg max-h-60 overflow-y-auto custom-scrollbar ${isInSidebar ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                      <h4 className={`font-medium mb-2 ${isInSidebar ? 'text-white' : 'text-gray-900'}`}>{script.title}</h4>
                      <p className={`text-sm mb-4 ${isInSidebar ? 'text-gray-300' : 'text-gray-600'}`}>{script.description}</p>
                      <div className={`text-sm whitespace-pre-wrap ${isInSidebar ? 'text-white' : 'text-gray-800'}`}>
                        {script.content}
                      </div>
                      <button
                        onClick={() => copyToClipboard(script.content)}
                        className="mt-3 text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Script
                      </button>
                    </div>
                  </div>
                )}

                {scriptActiveTab === 'brainstorm' && ideas.length > 0 && (
                  <div>
                    <h3 className={`font-semibold mb-3 ${isInSidebar ? 'text-white' : 'text-gray-900'}`}>Brainstormed Ideas</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                      {ideas.map((idea, index) => (
                        <div key={index} className={`p-3 rounded-lg ${isInSidebar ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                          <h4 className={`font-medium mb-1 ${isInSidebar ? 'text-white' : 'text-gray-900'}`}>{idea.title}</h4>
                          <p className={`text-sm ${isInSidebar ? 'text-gray-300' : 'text-gray-600'}`}>{idea.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${isInSidebar ? 'bg-zinc-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                              {idea.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${isInSidebar ? 'bg-zinc-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                              {idea.difficulty}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default LocalAIAssistant