import { getOpenAIClient, initOpenAI } from './openai'

// Video Transcription and Caption Generation Service

export interface TranscriptionSegment {
  start: number
  end: number
  text: string
  confidence?: number
}

export interface CaptionStyle {
  font: string
  size: number
  color: string
  backgroundColor: string
  position: 'top' | 'bottom' | 'center'
  animation: 'fade' | 'slide' | 'typewriter' | 'none'
}

export interface CaptionOptions {
  style: CaptionStyle
  maxLength: number
  showTimestamps: boolean
  language: string
}

export class TranscriptionService {
  private static instance: TranscriptionService
  
  private constructor() {
    // Initialize OpenAI client with API key from environment
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    console.log('🔧 TranscriptionService: Initializing with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND')
    
    if (apiKey) {
      try {
        initOpenAI(apiKey)
        console.log('✅ OpenAI client initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize OpenAI client:', error)
      }
    } else {
      console.error('❌ No API key found in environment variables')
    }
  }
  
  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService()
    }
    return TranscriptionService.instance
  }

  // Check if API key is available
  isApiKeyAvailable(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY
  }

  // Extract audio from video file
  async extractAudioFromVideo(videoFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      video.src = URL.createObjectURL(videoFile)
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Create audio context and extract audio
        const source = audioContext.createMediaElementSource(video)
        const destination = audioContext.createMediaStreamDestination()
        source.connect(destination)
        
        // Convert to blob
        const mediaRecorder = new MediaRecorder(destination.stream)
        const chunks: BlobPart[] = []
        
        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data)
        }
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' })
          resolve(audioBlob)
        }
        
        mediaRecorder.start()
        video.play()
        
        video.onended = () => {
          mediaRecorder.stop()
        }
      }
      
      video.onerror = () => {
        reject(new Error('Failed to load video'))
      }
    })
  }

  // Transcribe audio using OpenAI Whisper
  async transcribeAudio(audioBlob: Blob, language: string = 'en'): Promise<TranscriptionSegment[]> {
    try {
      console.log('🎤 Starting audio transcription...')
      console.log('🔑 Checking OpenAI client...')
      
      const client = getOpenAIClient()
      console.log('✅ OpenAI client retrieved successfully')
      
      // Convert blob to file
      const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' })
      console.log('📁 Audio file created:', audioFile.name, audioFile.size, 'bytes')
      
      // Use OpenAI Whisper API for transcription
      console.log('🚀 Calling OpenAI Whisper API...')
      const transcription = await client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: language,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      })

      // Parse the response and create segments
      const segments = (transcription as any).segments?.map((segment: any) => ({
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
        confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : undefined
      })) || []

      return segments
    } catch (error: any) {
      console.error('❌ Transcription error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type
      })
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key in .env.local file.')
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.')
      } else if (error.status === 400) {
        throw new Error('Invalid request to OpenAI API. Please check your audio file format.')
      } else {
        throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`)
      }
    }
  }

  // Generate captions with styling
  async generateCaptions(
    transcription: TranscriptionSegment[],
    options: CaptionOptions
  ): Promise<{
    segments: TranscriptionSegment[]
    srtContent: string
    vttContent: string
    styledCaptions: any[]
  }> {
    try {
      // Generate SRT format
      const srtContent = this.generateSRT(transcription)
      
      // Generate VTT format
      const vttContent = this.generateVTT(transcription)
      
      // Generate styled captions for video editor
      const styledCaptions = transcription.map((segment, index) => ({
        id: `caption-${index}`,
        startTime: segment.start,
        endTime: segment.end,
        text: segment.text,
        style: options.style,
        showTimestamps: options.showTimestamps,
        confidence: segment.confidence
      }))

      return {
        segments: transcription,
        srtContent,
        vttContent,
        styledCaptions
      }
    } catch (error) {
      console.error('Caption generation error:', error)
      throw new Error('Failed to generate captions')
    }
  }

  // Generate SRT subtitle format
  private generateSRT(segments: TranscriptionSegment[]): string {
    return segments.map((segment, index) => {
      const startTime = this.formatSRTTime(segment.start)
      const endTime = this.formatSRTTime(segment.end)
      
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`
    }).join('\n')
  }

  // Generate VTT subtitle format
  private generateVTT(segments: TranscriptionSegment[]): string {
    const header = 'WEBVTT\n\n'
    const content = segments.map(segment => {
      const startTime = this.formatVTTTime(segment.start)
      const endTime = this.formatVTTTime(segment.end)
      
      return `${startTime} --> ${endTime}\n${segment.text}\n`
    }).join('\n')
    
    return header + content
  }

  // Format time for SRT (00:00:00,000)
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  // Format time for VTT (00:00:00.000)
  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }

  // Auto-generate captions from video file
  async autoGenerateCaptions(
    videoFile: File,
    options: CaptionOptions = {
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
    }
  ): Promise<{
    segments: TranscriptionSegment[]
    srtContent: string
    vttContent: string
    styledCaptions: any[]
  }> {
    try {
      // Step 1: Extract audio from video
      console.log('Extracting audio from video...')
      const audioBlob = await this.extractAudioFromVideo(videoFile)
      
      // Step 2: Transcribe audio
      console.log('Transcribing audio...')
      const transcription = await this.transcribeAudio(audioBlob, options.language)
      
      // Step 3: Generate captions
      console.log('Generating captions...')
      const captions = await this.generateCaptions(transcription, options)
      
      return captions
    } catch (error) {
      console.error('Auto caption generation error:', error)
      throw new Error('Failed to generate captions automatically')
    }
  }

  // Improve transcription with AI
  async improveTranscription(transcription: TranscriptionSegment[]): Promise<TranscriptionSegment[]> {
    try {
      const client = getOpenAIClient()
      
      // Combine all text
      const fullText = transcription.map(segment => segment.text).join(' ')
      
      const prompt = `Improve this transcription by fixing grammar, punctuation, and clarity while keeping the same timing. Return the improved text in the same format.

Original transcription: "${fullText}"

Return only the improved text without any additional formatting.`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional transcription editor. Improve the text while maintaining the original meaning and timing.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })

      const improvedText = response.choices[0]?.message?.content || fullText
      
      // Split improved text back into segments (simple approach)
      const words = improvedText.split(' ')
      const wordsPerSegment = Math.ceil(words.length / transcription.length)
      
      return transcription.map((segment, index) => {
        const startWord = index * wordsPerSegment
        const endWord = Math.min((index + 1) * wordsPerSegment, words.length)
        const segmentText = words.slice(startWord, endWord).join(' ')
        
        return {
          ...segment,
          text: segmentText
        }
      })
    } catch (error) {
      console.error('Transcription improvement error:', error)
      return transcription // Return original if improvement fails
    }
  }

  // Export captions to file
  exportCaptions(captions: string, format: 'srt' | 'vtt', filename: string): void {
    const blob = new Blob([captions], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

export const transcriptionService = TranscriptionService.getInstance()
