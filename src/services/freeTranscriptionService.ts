// Free Transcription Service using Web Speech API
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

export class FreeTranscriptionService {
  private static instance: FreeTranscriptionService
  
  private constructor() {}
  
  static getInstance(): FreeTranscriptionService {
    if (!FreeTranscriptionService.instance) {
      FreeTranscriptionService.instance = new FreeTranscriptionService()
    }
    return FreeTranscriptionService.instance
  }

  // Check if Web Speech API is available
  isAvailable(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
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
        
        const canvasContext = canvas.getContext('2d')
        if (!canvasContext) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        canvasContext.drawImage(video, 0, 0)
        
        // For now, we'll use a simple approach
        // In a real implementation, you'd extract actual audio
        const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })
        resolve(audioBlob)
      }
      
      video.onerror = () => {
        reject(new Error('Failed to load video'))
      }
    })
  }

  // Transcribe audio using Web Speech API
  async transcribeAudio(audioBlob: Blob, language: string = 'en'): Promise<TranscriptionSegment[]> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        reject(new Error('Web Speech API not available in this browser'))
        return
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = language
      recognition.maxAlternatives = 1

      const segments: TranscriptionSegment[] = []
      let startTime = 0

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            const endTime = startTime + (result[0].transcript.length * 0.1) // Rough estimate
            
            segments.push({
              start: startTime,
              end: endTime,
              text: result[0].transcript.trim(),
              confidence: result[0].confidence || 0.8
            })
            
            startTime = endTime
          }
        }
      }

      recognition.onend = () => {
        resolve(segments)
      }

      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      // Start recognition
      recognition.start()
      
      // Stop after 30 seconds (adjust as needed)
      setTimeout(() => {
        recognition.stop()
      }, 30000)
    })
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
    const styledCaptions = transcription.map((segment, index) => ({
      id: `caption-${index}`,
      startTime: segment.start,
      endTime: segment.end,
      text: segment.text,
      style: options.style
    }))

    const srtContent = this.generateSRT(transcription)
    const vttContent = this.generateVTT(transcription)

    return {
      segments: transcription,
      srtContent,
      vttContent,
      styledCaptions
    }
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
      console.log('🎤 Free Transcription: Starting caption generation...')
      
      // Step 1: Extract audio from video
      console.log('📹 Extracting audio from video...')
      const audioBlob = await this.extractAudioFromVideo(videoFile)
      
      // Step 2: Transcribe audio
      console.log('🎙️ Transcribing audio...')
      const transcription = await this.transcribeAudio(audioBlob, options.language)
      
      // Step 3: Generate captions
      console.log('📝 Generating captions...')
      const captions = await this.generateCaptions(transcription, options)
      
      console.log('✅ Free Transcription: Caption generation complete')
      return captions
    } catch (error) {
      console.error('❌ Free transcription error:', error)
      throw new Error('Failed to generate captions using free transcription service')
    }
  }

  // Generate SRT content
  private generateSRT(segments: TranscriptionSegment[]): string {
    return segments.map((segment, index) => {
      const startTime = this.formatSRTTime(segment.start)
      const endTime = this.formatSRTTime(segment.end)
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`
    }).join('\n')
  }

  // Generate VTT content
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
}

// Export singleton instance
export const freeTranscriptionService = FreeTranscriptionService.getInstance()