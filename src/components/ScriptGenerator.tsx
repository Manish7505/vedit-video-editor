import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Lightbulb,
  Wand2,
  Copy,
  Download,
  Sparkles,
  Clock,
  Target,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { scriptGenerator } from '../services/scriptGenerator'
import type { VideoScript, BrainstormIdea } from '../services/scriptGenerator'

const ScriptGenerator = () => {
  const [activeTab, setActiveTab] = useState<'titles' | 'outline' | 'script' | 'brainstorm'>('titles')
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(10)
  const [tone, setTone] = useState<'professional' | 'casual' | 'educational' | 'entertaining'>('professional')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [titles, setTitles] = useState<string[]>([])
  const [outline, setOutline] = useState<string[]>([])
  const [script, setScript] = useState<VideoScript | null>(null)
  const [ideas, setIdeas] = useState<BrainstormIdea[]>([])

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

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          VAIA Script Generator
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          AI-powered script writing and brainstorming
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {[
          { id: 'titles', label: 'Titles', icon: FileText },
          { id: 'outline', label: 'Outline', icon: FileText },
          { id: 'script', label: 'Full Script', icon: FileText },
          { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Input Section */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Topic / Niche
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your video topic..."
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {activeTab !== 'brainstorm' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min="1"
                  max="60"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {activeTab === 'script' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="educational">Educational</option>
                    <option value="entertaining">Entertaining</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              if (activeTab === 'titles') generateTitles()
              else if (activeTab === 'outline') generateOutline()
              else if (activeTab === 'script') generateScript()
              else brainstormIdeas()
            }}
            disabled={isGenerating || !topic}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate {activeTab === 'titles' ? 'Titles' : activeTab === 'outline' ? 'Outline' : activeTab === 'script' ? 'Script' : 'Ideas'}
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {/* Titles */}
          {activeTab === 'titles' && titles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Generated Titles</h3>
              {titles.map((title, i) => (
                <div
                  key={i}
                  className="p-3 bg-zinc-800 rounded-lg flex items-start justify-between gap-3 hover:bg-zinc-700 transition-colors"
                >
                  <p className="text-white flex-1">{title}</p>
                  <button
                    onClick={() => copyToClipboard(title)}
                    className="p-2 hover:bg-zinc-600 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Outline */}
          {activeTab === 'outline' && outline.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Video Outline</h3>
              <div className="p-4 bg-zinc-800 rounded-lg space-y-2">
                {outline.map((section, i) => (
                  <div key={i} className="text-gray-300">
                    {section}
                  </div>
                ))}
              </div>
              <button
                onClick={() => copyToClipboard(outline.join('\n'))}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Outline
              </button>
            </div>
          )}

          {/* Full Script */}
          {activeTab === 'script' && script && (
            <div className="space-y-3">
              <div className="p-4 bg-zinc-800 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-2">{script.title}</h3>
                <div className="flex gap-4 text-sm text-gray-400 mb-4">
                  <span><Clock className="w-4 h-4 inline mr-1" />{Math.floor(script.totalDuration / 60)} min</span>
                  <span><Target className="w-4 h-4 inline mr-1" />{script.targetAudience}</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-blue-400 mb-1">Hook</h4>
                    <p className="text-gray-300">{script.hook}</p>
                  </div>

                  {script.sections.map((section, i) => (
                    <div key={i}>
                      <h4 className="text-sm font-semibold text-blue-400 mb-1 capitalize">
                        {section.type} ({section.duration}s)
                      </h4>
                      <p className="text-gray-300 mb-1">{section.content}</p>
                      {section.notes && (
                        <p className="text-xs text-gray-500 italic">Note: {section.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(JSON.stringify(script, null, 2))}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Script
              </button>
            </div>
          )}

          {/* Brainstorm Ideas */}
          {activeTab === 'brainstorm' && ideas.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Video Ideas</h3>
              {ideas.map((idea, i) => (
                <div
                  key={i}
                  className="p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-semibold flex-1">{idea.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      idea.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      idea.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {idea.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{idea.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span><Target className="w-3 h-3 inline mr-1" />{idea.targetAudience}</span>
                    <span><TrendingUp className="w-3 h-3 inline mr-1" />{idea.estimatedViews}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {idea.tags.map((tag, j) => (
                      <span key={j} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScriptGenerator

