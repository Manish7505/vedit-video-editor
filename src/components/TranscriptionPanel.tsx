import React, { useState, useRef } from 'react'
import { 
  Mic, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  FileText,
  Languages,
  Palette,
  Clock
} from 'lucide-react'
import { transcriptionService, TranscriptionSegment, CaptionOptions } from '../services/transcriptionService'

interface TranscriptionPanelProps {
  onClose: () => void
  videoFile?: File
  onCaptionsGenerated?: (captions: any[]) => void
}

const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({ 
  onClose, 
  videoFile,
  onCaptionsGenerated 
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([])
  const [captions, setCaptions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(videoFile || null)
  const [captionOptions, setCaptionOptions] = useState<CaptionOptions>({
    style: {
      font: 'Arial',
      size: 24,
      color: '#FFFFFF',
      backgroundColor: '#000000',
      position: 'bottom',
      animation: 'fade'
    },
    maxLength: 50,
    showTimestamps: false,
    language: 'en'
  })
  const [showSettings, setShowSettings] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      setError(null)
      setSuccess(null)
    } else {
      setError('Please select a valid video file')
    }
  }

  const handleTranscribe = async () => {
    if (!selectedFile) {
      setError('Please select a video file first')
      return
    }

    setIsTranscribing(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await transcriptionService.autoGenerateCaptions(selectedFile, captionOptions)
      
      setTranscription(result.segments)
      setCaptions(result.styledCaptions)
      setSuccess(`Successfully transcribed ${result.segments.length} segments`)
      
      // Notify parent component
      if (onCaptionsGenerated) {
        onCaptionsGenerated(result.styledCaptions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed')
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleImproveTranscription = async () => {
    if (transcription.length === 0) {
      setError('No transcription to improve')
      return
    }

    setIsImproving(true)
    setError(null)

    try {
      const improvedTranscription = await transcriptionService.improveTranscription(transcription)
      setTranscription(improvedTranscription)
      setSuccess('Transcription improved successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve transcription')
    } finally {
      setIsImproving(false)
    }
  }

  const handleExportSRT = () => {
    if (transcription.length === 0) {
      setError('No transcription to export')
      return
    }

    const srtContent = transcription.map((segment, index) => {
      const startTime = formatSRTTime(segment.start)
      const endTime = formatSRTTime(segment.end)
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`
    }).join('\n')

    transcriptionService.exportCaptions(srtContent, 'srt', 'captions')
    setSuccess('SRT file exported successfully')
  }

  const handleExportVTT = () => {
    if (transcription.length === 0) {
      setError('No transcription to export')
      return
    }

    const vttContent = 'WEBVTT\n\n' + transcription.map(segment => {
      const startTime = formatVTTTime(segment.start)
      const endTime = formatVTTTime(segment.end)
      return `${startTime} --> ${endTime}\n${segment.text}\n`
    }).join('\n')

    transcriptionService.exportCaptions(vttContent, 'vtt', 'captions')
    setSuccess('VTT file exported successfully')
  }

  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  const formatVTTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Video Transcription</h2>
              <p className="text-sm text-zinc-400">Generate captions from your video audio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <span className="text-zinc-400 hover:text-white">✕</span>
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 flex flex-col p-6">
            {/* File Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Select Video File
              </label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Choose Video
                </button>
                {selectedFile && (
                  <span className="text-sm text-zinc-400">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={handleTranscribe}
                disabled={!selectedFile || isTranscribing}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                {isTranscribing ? 'Transcribing...' : 'Start Transcription'}
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>

              {transcription.length > 0 && (
                <button
                  onClick={handleImproveTranscription}
                  disabled={isImproving}
                  className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isImproving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Improve Text
                </button>
              )}
            </div>

            {/* Status Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/20 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/20 rounded-lg mb-4">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            )}

            {/* Transcription Results */}
            <div className="flex-1 overflow-y-auto">
              {transcription.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">
                      Transcription Results ({transcription.length} segments)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportSRT}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm"
                      >
                        <Download className="w-3 h-3" />
                        Export SRT
                      </button>
                      <button
                        onClick={handleExportVTT}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm"
                      >
                        <Download className="w-3 h-3" />
                        Export VTT
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {transcription.map((segment, index) => (
                      <div
                        key={index}
                        className="p-3 bg-zinc-800 rounded-lg border border-zinc-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-zinc-400 font-mono">
                            {formatTime(segment.start)} - {formatTime(segment.end)}
                          </span>
                          {segment.confidence && (
                            <span className="text-xs text-zinc-500">
                              Confidence: {(segment.confidence * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-white text-sm leading-relaxed">
                          {segment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="w-16 h-16 text-zinc-600 mb-4" />
                  <h3 className="text-lg font-medium text-zinc-300 mb-2">
                    No Transcription Yet
                  </h3>
                  <p className="text-zinc-500 text-sm max-w-md">
                    Select a video file and click "Start Transcription" to generate captions from your video's audio.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="w-80 border-l border-zinc-800 p-6 overflow-y-auto">
              <h3 className="text-lg font-medium text-white mb-4">Caption Settings</h3>
              
              <div className="space-y-6">
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    <Languages className="w-4 h-4 inline mr-2" />
                    Language
                  </label>
                  <select
                    value={captionOptions.language}
                    onChange={(e) => setCaptionOptions({
                      ...captionOptions,
                      language: e.target.value
                    })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>

                {/* Font Settings */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    <Palette className="w-4 h-4 inline mr-2" />
                    Font
                  </label>
                  <select
                    value={captionOptions.style.font}
                    onChange={(e) => setCaptionOptions({
                      ...captionOptions,
                      style: { ...captionOptions.style, font: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white mb-2"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={captionOptions.style.size}
                      onChange={(e) => setCaptionOptions({
                        ...captionOptions,
                        style: { ...captionOptions.style, size: parseInt(e.target.value) }
                      })}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                      placeholder="Size"
                    />
                    <input
                      type="color"
                      value={captionOptions.style.color}
                      onChange={(e) => setCaptionOptions({
                        ...captionOptions,
                        style: { ...captionOptions.style, color: e.target.value }
                      })}
                      className="w-12 h-10 bg-zinc-800 border border-zinc-700 rounded-lg"
                    />
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Position
                  </label>
                  <select
                    value={captionOptions.style.position}
                    onChange={(e) => setCaptionOptions({
                      ...captionOptions,
                      style: { ...captionOptions.style, position: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                  </select>
                </div>

                {/* Animation */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Animation
                  </label>
                  <select
                    value={captionOptions.style.animation}
                    onChange={(e) => setCaptionOptions({
                      ...captionOptions,
                      style: { ...captionOptions.style, animation: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="none">None</option>
                    <option value="fade">Fade</option>
                    <option value="slide">Slide</option>
                    <option value="typewriter">Typewriter</option>
                  </select>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={captionOptions.showTimestamps}
                      onChange={(e) => setCaptionOptions({
                        ...captionOptions,
                        showTimestamps: e.target.checked
                      })}
                      className="rounded border-zinc-600 bg-zinc-800 text-blue-600"
                    />
                    <span className="text-sm text-zinc-300">Show timestamps</span>
                  </label>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Max characters per line
                    </label>
                    <input
                      type="number"
                      value={captionOptions.maxLength}
                      onChange={(e) => setCaptionOptions({
                        ...captionOptions,
                        maxLength: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TranscriptionPanel
