import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Settings,
  Film,
  Monitor,
  Smartphone,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Youtube,
  Instagram,
  Send
} from 'lucide-react'
import { cloudRenderer } from '../services/cloudRenderer'
import type { ExportJob, CloudRenderOptions } from '../types/publishing'

interface ExportPanelProps {
  projectId: string
  duration: number
  onClose?: () => void
}

const ExportPanel = ({ projectId, duration, onClose }: ExportPanelProps) => {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [selectedResolution, setSelectedResolution] = useState<'4k' | '1080p' | '720p' | '480p' | 'mobile'>('1080p')
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mov' | 'webm' | 'avi'>('mp4')
  const [selectedQuality, setSelectedQuality] = useState<'high' | 'medium' | 'low'>('high')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    loadExportJobs()
    const interval = setInterval(loadExportJobs, 1000)
    return () => clearInterval(interval)
  }, [projectId])

  const loadExportJobs = () => {
    const jobs = cloudRenderer.getProjectExportJobs(projectId)
    setExportJobs(jobs)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const options: CloudRenderOptions = {
        resolution: selectedResolution,
        format: selectedFormat,
        quality: selectedQuality,
        fps: 30,
        codec: 'h264'
      }

      await cloudRenderer.createExportJob(projectId, options)
      loadExportJobs()
    } catch (error) {
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePlatformExport = async (platform: 'youtube' | 'instagram' | 'tiktok') => {
    setIsExporting(true)
    try {
      await cloudRenderer.exportForPlatform(projectId, platform)
      loadExportJobs()
    } catch (error) {
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleMultiResolutionExport = async () => {
    setIsExporting(true)
    try {
      await cloudRenderer.exportMultipleResolutions(projectId, ['4k', '1080p', '720p', 'mobile'])
      loadExportJobs()
    } catch (error) {
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const estimatedTime = cloudRenderer.estimateRenderTime(duration, selectedResolution, selectedQuality)

  const resolutions = [
    { value: '4k', label: '4K Ultra HD', icon: Monitor, description: '3840x2160' },
    { value: '1080p', label: 'Full HD', icon: Monitor, description: '1920x1080' },
    { value: '720p', label: 'HD', icon: Monitor, description: '1280x720' },
    { value: '480p', label: 'SD', icon: Film, description: '854x480' },
    { value: 'mobile', label: 'Mobile', icon: Smartphone, description: '640x360' }
  ]

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
                <Download className="w-6 h-6 text-green-500" />
                Export & Render
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Cloud-based rendering for multiple resolutions
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
          {/* Quick Platform Export */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Quick Export for Platforms</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handlePlatformExport('youtube')}
                disabled={isExporting}
                className="p-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                <Youtube className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-white font-medium">YouTube</p>
                <p className="text-xs text-gray-400">1080p, MP4</p>
              </button>
              <button
                onClick={() => handlePlatformExport('instagram')}
                disabled={isExporting}
                className="p-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                <Instagram className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                <p className="text-white font-medium">Instagram</p>
                <p className="text-xs text-gray-400">1080p, MP4</p>
              </button>
              <button
                onClick={() => handlePlatformExport('tiktok')}
                disabled={isExporting}
                className="p-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                <Send className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                <p className="text-white font-medium">TikTok</p>
                <p className="text-xs text-gray-400">1080p, MP4</p>
              </button>
            </div>
          </div>

          {/* Custom Export Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Custom Export</h3>
            <div className="space-y-4">
              {/* Resolution */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resolution
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {resolutions.map((res) => {
                    const Icon = res.icon
                    return (
                      <button
                        key={res.value}
                        onClick={() => setSelectedResolution(res.value as any)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedResolution === res.value
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                        <p className="text-xs text-white font-medium">{res.label}</p>
                        <p className="text-xs text-gray-500">{res.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Format & Quality */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Format
                  </label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as any)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="mp4">MP4 (H.264)</option>
                    <option value="mov">MOV (ProRes)</option>
                    <option value="webm">WebM (VP9)</option>
                    <option value="avi">AVI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quality
                  </label>
                  <select
                    value={selectedQuality}
                    onChange={(e) => setSelectedQuality(e.target.value as any)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="high">High (Best Quality)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="low">Low (Smaller File)</option>
                  </select>
                </div>
              </div>

              {/* Estimated Time */}
              <div className="p-3 bg-zinc-800 rounded-lg flex items-center justify-between">
                <span className="text-gray-300">Estimated Render Time:</span>
                <span className="text-white font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {Math.floor(estimatedTime / 60)}m {estimatedTime % 60}s
                </span>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Export
                    </>
                  )}
                </button>
                <button
                  onClick={handleMultiResolutionExport}
                  disabled={isExporting}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  Export All Resolutions
                </button>
              </div>
            </div>
          </div>

          {/* Export Queue */}
          {exportJobs.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Export Queue</h3>
              <div className="space-y-2">
                {exportJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 bg-zinc-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {job.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                        {job.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {job.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                        {job.status === 'queued' && <Clock className="w-5 h-5 text-gray-400" />}
                        <div>
                          <p className="text-white font-medium">{job.resolution} - {job.format.toUpperCase()}</p>
                          <p className="text-xs text-gray-400 capitalize">{job.status}</p>
                        </div>
                      </div>
                      {job.status === 'completed' && (
                        <button
                          onClick={() => cloudRenderer.downloadExport(job.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm flex items-center gap-2 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      )}
                    </div>
                    {job.status === 'processing' && (
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ExportPanel

