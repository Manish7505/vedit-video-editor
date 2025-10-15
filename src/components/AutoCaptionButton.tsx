import React, { useState } from 'react'
import { Subtitles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { openRouterService } from '../services/openRouter'
import { freeTranscriptionService } from '../services/freeTranscriptionService'
import { testApiKey } from '../utils/apiKeyTest'

interface AutoCaptionButtonProps {
  videoFile?: File
  onCaptionsGenerated: (captions: any[]) => void
  disabled?: boolean
}

const AutoCaptionButton: React.FC<AutoCaptionButtonProps> = ({
  videoFile,
  onCaptionsGenerated,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleAutoCaptions = async () => {
    if (!videoFile) {
      setStatus('error')
      setMessage('Please upload a video first')
      setTimeout(() => setStatus('idle'), 3000)
      return
    }

    setIsProcessing(true)
    setStatus('idle')
    setMessage('Generating captions...')

    try {
      // Test API key availability and format
      const apiKeyTest = testApiKey()
      console.log('🔍 API Key Test Results:', apiKeyTest)
      
      let result: any
      
      if (apiKeyTest.exists) {
        // Try OpenRouter first (since user has OpenRouter API key)
        console.log('🔄 Trying OpenRouter API...')
        try {
          const connectionTest = await openRouterService.testConnection()
          if (connectionTest) {
            console.log('✅ OpenRouter connection successful')
            // For now, fall back to free transcription since OpenRouter doesn't support audio directly
            console.log('⚠️ OpenRouter doesn\'t support direct audio transcription, using free alternative')
            result = await freeTranscriptionService.autoGenerateCaptions(videoFile, {
              style: {
                font: 'Arial',
                size: 32,
                color: '#FFFFFF',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                position: 'bottom',
                animation: 'fade'
              },
              maxLength: 50,
              showTimestamps: false,
              language: 'en'
            })
          } else {
            throw new Error('OpenRouter connection failed')
          }
        } catch (openRouterError) {
          console.log('⚠️ OpenRouter failed, trying free transcription...')
          result = await freeTranscriptionService.autoGenerateCaptions(videoFile, {
            style: {
              font: 'Arial',
              size: 32,
              color: '#FFFFFF',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              position: 'bottom',
              animation: 'fade'
            },
            maxLength: 50,
            showTimestamps: false,
            language: 'en'
          })
        }
      } else {
        // No API key, use free transcription
        console.log('🆓 No API key found, using free transcription...')
        result = await freeTranscriptionService.autoGenerateCaptions(videoFile, {
          style: {
            font: 'Arial',
            size: 32,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            position: 'bottom',
            animation: 'fade'
          },
          maxLength: 50,
          showTimestamps: false,
          language: 'en'
        })
      }

      // Pass captions to parent
      onCaptionsGenerated(result.styledCaptions)
      
      setStatus('success')
      setMessage(`✓ ${result.segments.length} captions added!`)
      
      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)
    } catch (error) {
      console.error('Auto caption error:', error)
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Failed to generate captions')
      
      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleAutoCaptions}
        disabled={disabled || isProcessing || !videoFile}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
          status === 'success'
            ? 'bg-green-600 text-white'
            : status === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800'
        } disabled:bg-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-500`}
        title="Generate captions using OpenRouter API or free browser transcription"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle className="w-4 h-4" />
        ) : status === 'error' ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Subtitles className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {isProcessing ? 'Processing...' : status === 'success' ? 'Done!' : 'AI Caption'}
        </span>
      </button>

      {/* Status Message Tooltip */}
      {message && (
        <div className={`absolute top-full left-0 mt-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap z-50 ${
          status === 'success'
            ? 'bg-green-600 text-white'
            : status === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-zinc-800 text-white'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default AutoCaptionButton
