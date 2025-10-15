import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Loader2,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useVideoEditor } from '../contexts/VideoEditorContext'
import { startRenderJob, getRenderStatus } from '../services/renderService'

interface ExportPanelProps {
  projectId: string
  duration: number
  onClose?: () => void
}

const ExportPanel = ({ projectId, duration, onClose }: ExportPanelProps) => {
  const { clips } = useVideoEditor()
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [preset, setPreset] = useState<'youtube' | 'tiktok_9_16' | 'instagram_square' | 'lossless'>('youtube')
  const [burnInCaptions, setBurnInCaptions] = useState<boolean>(false)
  const [srtContent, setSrtContent] = useState<string>('')
  const [useFallbackExport, setUseFallbackExport] = useState<boolean>(false)
  // Suppress unused prop warnings while keeping the signature stable
  void projectId
  void duration

  // Fallback export function for when backend is not available
  const handleFallbackExport = async () => {
    setIsExporting(true)
    setProgress(0)
    
    try {
      const renderable = clips
        .filter(c => (c.type === 'video' || c.type === 'audio') && c.url)
        .sort((a, b) => a.startTime - b.startTime)

      if (renderable.length === 0) {
        toast.error('❌ No media to export. Please add video/audio clips to the timeline first.', {
          duration: 5000,
        })
        setIsExporting(false)
        setProgress(null)
        return
      }

      toast.success('📁 Preparing files for download...')
      setProgress(25)

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProgress(50)

      // Create a simple download of the first video file
      const firstVideo = renderable.find(c => c.type === 'video')
      if (firstVideo) {
        const link = document.createElement('a')
        link.href = firstVideo.url as string
        link.download = `vedit-${preset}-${new Date().toISOString().slice(0, 10)}.mp4`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setProgress(100)
        toast.success('📥 Video file downloaded! (Fallback mode - full rendering requires backend server)')
        setIsExporting(false)
        setProgress(null)
        onClose?.()
      } else {
        toast.error('❌ No video files found to download.')
        setIsExporting(false)
        setProgress(null)
      }

    } catch (error) {
      console.error('Fallback export failed:', error)
      toast.error('❌ Fallback export failed. Please try again.')
      setIsExporting(false)
      setProgress(null)
    }
  }

  const handleExport = async () => {
    if (useFallbackExport) {
      return handleFallbackExport()
    }

    setIsExporting(true)
    setProgress(0)
    
    try {
      const renderable = clips
        .filter(c => (c.type === 'video' || c.type === 'audio') && c.url)
        .sort((a, b) => a.startTime - b.startTime)

      if (renderable.length === 0) {
        toast.error('❌ No media to export. Please add video/audio clips to the timeline first.', {
          duration: 5000,
        })
        setIsExporting(false)
        setProgress(null)
        return
      }

      toast.success('🚀 Starting video export...')

      const body = {
        clips: renderable.map(c => ({
          url: (c as any).originalUrl ? (c as any).originalUrl as string : (c.url as string),
          startTime: c.startTime,
          endTime: c.endTime
        }))
      }

      // Start background render
      const start = await startRenderJob({
        clips: body.clips,
        duration,
        preset,
        burnInCaptions,
        srtContent: burnInCaptions && srtContent.trim() ? srtContent : undefined
      })
      
      if (!start.ok || !start.jobId) {
        toast.error(`❌ Backend server not available. Switching to fallback mode...`)
        setUseFallbackExport(true)
        setIsExporting(false)
        setProgress(null)
        return
      }

      toast.success('✅ Render job started! Processing video...')
      setProgress(5)

      // Poll status with timeout
      let pollCount = 0
      const maxPolls = 300 // 5 minutes timeout
      
      const poll = async () => {
        if (!start.jobId || pollCount >= maxPolls) {
          if (pollCount >= maxPolls) {
            toast.error('⏰ Export timeout. Please try again.')
          }
          setIsExporting(false)
          setProgress(null)
          return
        }
        
        pollCount++
        const status = await getRenderStatus(start.jobId)
        
        if (!status.ok || !status.job) {
          toast.error(`❌ Failed to get render status: ${status.error || 'Unknown error'}`)
          setIsExporting(false)
          setProgress(null)
          return
        }
        
        setProgress(Math.max(5, status.job.progress))
        
        if (status.job.status === 'completed' && status.job.url) {
          // Create download link
          const link = document.createElement('a')
          link.href = status.job.url
          link.download = `vedit-${preset}-${new Date().toISOString().slice(0, 10)}.mp4`
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          toast.success('🎉 Video exported successfully! Download started.')
          setIsExporting(false)
          setProgress(null)
          onClose?.()
          return
        }
        
        if (status.job.status === 'failed') {
          toast.error('❌ Video export failed. Please check your media files and try again.')
          setIsExporting(false)
          setProgress(null)
          return
        }
        
        // Continue polling
        setTimeout(poll, 2000) // Poll every 2 seconds
      }
      
      void poll()

    } catch (error) {
      console.error('Export failed:', error)
      toast.error('❌ Backend server not available. Switching to fallback mode...')
      setUseFallbackExport(true)
      setIsExporting(false)
      setProgress(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-700 w-full max-w-md"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-xl">
                <Download className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Export Video</h2>
                <p className="text-gray-400 text-sm">Choose preset and optional captions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center">
            <div className="mb-6">
              <Download className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Render and Download</h3>
              <p className="text-gray-400 text-sm">
                {`Preset: ${
                  preset === 'youtube' ? 'YouTube 1080p 16:9' :
                  preset === 'tiktok_9_16' ? 'TikTok 1080x1920 9:16' :
                  preset === 'instagram_square' ? 'Instagram 1080x1080' :
                  'Lossless'
                }`}
                {burnInCaptions ? ' • Captions: Burn-in SRT' : ' • Captions: None'}
              </p>
              
              {/* Media Status Indicator */}
              {clips.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-sm font-medium mb-1">⚠️ No Media in Timeline</p>
                  <p className="text-yellow-300/80 text-xs">
                    Upload video/audio files using the "Upload Media" button in the left panel first
                  </p>
                </div>
              )}
              
              {clips.length > 0 && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm font-medium">
                    ✅ {clips.length} clip{clips.length > 1 ? 's' : ''} ready for export
                  </p>
                </div>
              )}
            </div>

            {/* Preset Selection */}
            <div className="grid grid-cols-2 gap-3 mb-5 text-left">
              <button
                onClick={() => setPreset('youtube')}
                className={`p-3 rounded-lg border ${preset === 'youtube' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:bg-zinc-800'}`}>
                <div className="text-sm font-semibold text-white">YouTube 1080p 16:9</div>
                <div className="text-xs text-gray-400">H.264, ~8 Mbps</div>
              </button>
              <button
                onClick={() => setPreset('tiktok_9_16')}
                className={`p-3 rounded-lg border ${preset === 'tiktok_9_16' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:bg-zinc-800'}`}>
                <div className="text-sm font-semibold text-white">TikTok 1080x1920 9:16</div>
                <div className="text-xs text-gray-400">H.264, ~4-6 Mbps</div>
              </button>
              <button
                onClick={() => setPreset('instagram_square')}
                className={`p-3 rounded-lg border ${preset === 'instagram_square' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:bg-zinc-800'}`}>
                <div className="text-sm font-semibold text-white">Instagram 1080x1080</div>
                <div className="text-xs text-gray-400">Square, H.264</div>
              </button>
              <button
                onClick={() => setPreset('lossless')}
                className={`p-3 rounded-lg border ${preset === 'lossless' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:bg-zinc-800'}`}>
                <div className="text-sm font-semibold text-white">Lossless</div>
                <div className="text-xs text-gray-400">Visually lossless export</div>
              </button>
            </div>

            {/* Export Mode Toggle */}
            <div className="mb-4 text-left">
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={useFallbackExport}
                  onChange={(e) => setUseFallbackExport(e.target.checked)}
                />
                <span className="flex items-center gap-2">
                  📁 Simple Download Mode
                  <span className="text-xs text-gray-400">(No server required)</span>
                </span>
              </label>
              {useFallbackExport && (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ Downloads original video file without processing. For full rendering, ensure backend server is running.
                </p>
              )}
            </div>

            {/* Captions options - only show if not in fallback mode */}
            {!useFallbackExport && (
              <div className="mb-5 text-left">
                <label className="flex items-center gap-2 text-sm text-white">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={burnInCaptions}
                    onChange={(e) => setBurnInCaptions(e.target.checked)}
                  />
                  Burn-in captions (SRT)
                </label>
                {burnInCaptions && (
                  <textarea
                    className="mt-2 w-full h-28 bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm text-gray-200 placeholder:text-gray-500"
                    placeholder={"Paste .srt content here (optional)"}
                    value={srtContent}
                    onChange={(e) => setSrtContent(e.target.value)}
                  />
                )}
              </div>
            )}
            
            {/* Progress Bar */}
            {isExporting && progress !== null && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Rendering...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={isExporting || clips.length === 0}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {progress !== null ? `Rendering ${
                      preset === 'youtube' ? '(YouTube 1080p)' :
                      preset === 'tiktok_9_16' ? '(TikTok 9:16)' :
                      preset === 'instagram_square' ? '(Instagram 1080x1080)' :
                      '(Lossless)'
                    }${burnInCaptions ? ' + Captions' : ''}... ${progress}%` :
                    `Starting Render ${
                      preset === 'youtube' ? '(YouTube 1080p)' :
                      preset === 'tiktok_9_16' ? '(TikTok 9:16)' :
                      preset === 'instagram_square' ? '(Instagram 1080x1080)' :
                      '(Lossless)'
                    }${burnInCaptions ? ' + Captions' : ''}...`}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>
                    {useFallbackExport ? '📁 Download Video File' : '🎬 Export & Download Video'}
                    {!useFallbackExport && preset === 'youtube' && ' (YouTube 1080p)'}
                    {!useFallbackExport && preset === 'tiktok_9_16' && ' (TikTok 9:16)'}
                    {!useFallbackExport && preset === 'instagram_square' && ' (Instagram 1080x1080)'}
                    {!useFallbackExport && preset === 'lossless' && ' (Lossless)'}
                    {!useFallbackExport && burnInCaptions && ' + Captions'}
                  </span>
                </>
              )}
            </button>

            {/* Additional Download Info */}
            {!isExporting && (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  {useFallbackExport 
                    ? '💡 Downloads the original video file directly to your computer'
                    : '💡 The video will be processed and automatically downloaded when ready'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ExportPanel