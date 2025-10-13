import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Calendar,
  Hash,
  Type,
  Image as ImageIcon,
  Sparkles,
  Youtube,
  Instagram,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { socialMediaService } from '../services/socialMediaAPI'
import { aiContentGenerator } from '../services/aiContentGenerator'
import type { SocialPlatform, PublishingContent } from '../types/publishing'

interface PublishingPanelProps {
  projectId: string
  videoUrl: string
  onClose?: () => void
}

const PublishingPanel = ({ projectId, videoUrl, onClose }: PublishingPanelProps) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([])
  const [connectedPlatforms, setConnectedPlatforms] = useState<SocialPlatform[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishingStatus, setPublishingStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({})
  
  const [content, setContent] = useState<PublishingContent>({
    title: '',
    description: '',
    hashtags: [],
    videoUrl: videoUrl,
    visibility: 'public'
  })

  const [aiSuggestions, setAiSuggestions] = useState<{
    titles: string[]
    captions: string[]
    hashtags: string[]
  }>({
    titles: [],
    captions: [],
    hashtags: []
  })

  const platforms = [
    { id: 'youtube' as SocialPlatform, name: 'YouTube', icon: Youtube, color: 'text-red-500' },
    { id: 'instagram' as SocialPlatform, name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { id: 'tiktok' as SocialPlatform, name: 'TikTok', icon: Send, color: 'text-cyan-500' },
    { id: 'facebook' as SocialPlatform, name: 'Facebook', icon: Send, color: 'text-blue-500' },
    { id: 'twitter' as SocialPlatform, name: 'Twitter', icon: Send, color: 'text-sky-500' }
  ]

  useEffect(() => {
    loadConnectedPlatforms()
  }, [])

  const loadConnectedPlatforms = async () => {
    const connected = await socialMediaService.getConnectedPlatforms()
    setConnectedPlatforms(connected)
  }

  const togglePlatform = (platform: SocialPlatform) => {
    if (!connectedPlatforms.includes(platform)) {
      alert(`Please configure ${platform} API credentials in your .env.local file`)
      return
    }
    
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const generateAIContent = async () => {
    if (!content.description) {
      alert('Please enter a video description first')
      return
    }

    setIsGenerating(true)
    try {
      const platform = selectedPlatforms[0] || 'youtube'
      const generated = await aiContentGenerator.generateCompleteContent(
        content.description,
        platform
      )

      setAiSuggestions({
        titles: generated.titles,
        captions: generated.descriptions,
        hashtags: generated.hashtags
      })
    } catch (error) {
      console.error('AI generation error:', error)
      alert('Failed to generate AI content. Please check your OpenAI API key.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform')
      return
    }

    if (!content.title || !content.description) {
      alert('Please fill in title and description')
      return
    }

    setIsPublishing(true)
    const status: Record<string, 'pending' | 'success' | 'error'> = {}

    for (const platform of selectedPlatforms) {
      status[platform] = 'pending'
      setPublishingStatus({ ...status })

      try {
        const optimized = await aiContentGenerator.optimizeForPlatform(content, platform)
        const result = await socialMediaService.publishToMultiplePlatforms([platform], optimized)

        status[platform] = result[platform].success ? 'success' : 'error'
      } catch (error) {
        status[platform] = 'error'
      }

      setPublishingStatus({ ...status })
    }

    setIsPublishing(false)
  }

  const schedulePublish = () => {
    alert('Scheduling feature coming soon! This will allow you to schedule posts for specific times.')
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-500" />
                Publish & Schedule
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Share your video across multiple platforms
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Select Platforms</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {platforms.map((platform) => {
                const Icon = platform.icon
                const isConnected = connectedPlatforms.includes(platform.id)
                const isSelected = selectedPlatforms.includes(platform.id)

                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    disabled={!isConnected}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : isConnected
                        ? 'border-zinc-700 hover:border-zinc-600'
                        : 'border-zinc-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${platform.color}`} />
                    <p className="text-sm text-white font-medium">{platform.name}</p>
                    {!isConnected && (
                      <p className="text-xs text-red-400 mt-1">Not configured</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Type className="w-4 h-4 inline mr-2" />
                Title
              </label>
              <input
                type="text"
                value={content.title}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Enter video title..."
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {aiSuggestions.titles.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-400">AI Suggestions:</p>
                  {aiSuggestions.titles.slice(0, 3).map((title, i) => (
                    <button
                      key={i}
                      onClick={() => setContent({ ...content, title })}
                      className="block w-full text-left px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700 rounded text-sm text-gray-300 transition-colors"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={content.description}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                placeholder="Enter video description..."
                rows={4}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                Hashtags
              </label>
              <input
                type="text"
                value={content.hashtags.join(', ')}
                onChange={(e) => setContent({ ...content, hashtags: e.target.value.split(',').map(h => h.trim()) })}
                placeholder="Enter hashtags separated by commas..."
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {aiSuggestions.hashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {aiSuggestions.hashtags.slice(0, 10).map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => setContent({ ...content, hashtags: [...content.hashtags, tag] })}
                      className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs text-blue-400 transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Generate Button */}
            <button
              onClick={generateAIContent}
              disabled={isGenerating || !content.description}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating AI Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate AI Content
                </>
              )}
            </button>
          </div>

          {/* Publishing Status */}
          {Object.keys(publishingStatus).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Publishing Status</h3>
              {Object.entries(publishingStatus).map(([platform, status]) => (
                <div key={platform} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <span className="text-white capitalize">{platform}</span>
                  {status === 'pending' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                  {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button
            onClick={schedulePublish}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Schedule
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || selectedPlatforms.length === 0}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Publish Now
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default PublishingPanel

