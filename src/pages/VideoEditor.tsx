import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { logger } from '../utils/logger'

import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Save,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
  Video,
  Scissors,
  Wand2,
  Type,
  Image as ImageIcon,
  Music,
  Filter,
  Plus,
  ZoomIn,
  ZoomOut,
  Upload,
  Eye,
  Grid,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ArrowLeft,
  GripVertical,
  MoreHorizontal,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Sparkles,
  X
} from 'lucide-react'
import { useVideoEditor } from '../contexts/VideoEditorContext'
// @ts-ignore - Vite will handle worker import
import WaveformWorker from '../workers/waveformWorker.ts?worker'
import { useVideoEditorStore } from '../stores/videoEditorStore'
import VideoEditorAI from '../components/VideoEditorAI'
import VideoEditorVAPIAssistant from '../components/VideoEditorVAPIAssistant'
import ExportPanel from '../components/ExportPanel'
import toast from 'react-hot-toast'

// Helper function to convert AudioBuffer to WAV
const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
  const length = buffer.length
  const numberOfChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
  const view = new DataView(arrayBuffer)
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length * numberOfChannels * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * 2, true)
  view.setUint16(32, numberOfChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, length * numberOfChannels * 2, true)
  
  // Convert audio data
  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }
  
  return arrayBuffer
}

const VideoEditor = () => {
  const navigate = useNavigate()
  const {
    currentTime,
    setCurrentTime,
    duration,
    isPlaying,
    setIsPlaying,
    playbackRate,
    setPlaybackRate,
    projectName,
    setProjectName,
    clips,
    tracks,
    addTrack,
    removeTrack,
    updateTrack,
    addClip,
    removeClip,
    updateClip,
    selectedClipId,
    setSelectedClipId,
    zoom,
    setZoom,
    canUndo,
    canRedo,
    undo,
    redo,
    initializeHistory,
    adjustments,
    setAdjustments,
    activeFilters,
    setActiveFilters,
    activeEffects,
    setActiveEffects,
    videoTools,
    setVideoTools,
    textOverlays,
    setTextOverlays
  } = useVideoEditor()

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // Basic state
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [showSafeArea, setShowSafeArea] = useState(false)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeLeftTab, setActiveLeftTab] = useState<'media' | 'effects' | 'text' | 'audio'>('media')
  const [activeRightTab, setActiveRightTab] = useState<'properties' | 'adjustments' | 'filters' | 'ai-assistant'>('properties')
  const [playheadPosition, setPlayheadPosition] = useState(0)
  const [isPlayheadDragging, setIsPlayheadDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  
  // Enhanced drag & drop state
  const [draggedClip, setDraggedClip] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<'left' | 'right' | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [trackHeights, setTrackHeights] = useState<Record<string, number>>({})
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [cutMode, setCutMode] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  
  // Export state
  const [showExportPanel, setShowExportPanel] = useState(false)
  
  // Listen for VAPI export commands
  useEffect(() => {
    const handleOpenExportPanel = () => {
      setShowExportPanel(true)
    }
    
    window.addEventListener('open-export-panel', handleOpenExportPanel)
    
    return () => {
      window.removeEventListener('open-export-panel', handleOpenExportPanel)
    }
  }, [])
  
  // Media upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const waveformWorkerRef = useRef<Worker | null>(null)

  // All editing states are now managed by the store

  // Calculate timeline dimensions
  const timelineWidth = 2000
  const safeDuration = duration > 0 ? duration : 1
  const pixelsPerSecond = (timelineWidth * zoom) / safeDuration

  // Update playhead position (but not during dragging)
  useEffect(() => {
    if (!isPlayheadDragging) {
      setPlayheadPosition(currentTime * pixelsPerSecond)
    }
  }, [currentTime, pixelsPerSecond, isPlayheadDragging])

  // Initialize history on component mount
  useEffect(() => {
    if (!waveformWorkerRef.current) {
      waveformWorkerRef.current = new WaveformWorker()
    }
    initializeHistory()
  }, [initializeHistory])

  // Load project name from localStorage on mount
  useEffect(() => {
    const savedProjectName = localStorage.getItem('vedit-project-name')
    if (savedProjectName && savedProjectName !== 'Untitled Project') {
      setProjectName(savedProjectName)
    }
  }, [setProjectName])

  // Handle playback
  useEffect(() => {
    let interval: number
    if (isPlaying && currentTime < duration) {
      interval = window.setInterval(() => {
        const newTime = currentTime + 0.1
        if (newTime >= duration) {
          // Loop back to the beginning instead of stopping
          setCurrentTime(0)
          // Keep playing (don't set isPlaying to false)
          // Reset video/audio elements to beginning
          if (videoRef.current) {
            videoRef.current.currentTime = 0
          }
          if (audioRef.current) {
            audioRef.current.currentTime = 0
          }
        } else {
          setCurrentTime(newTime)
        }
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentTime, duration, setCurrentTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * 30)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    togglePlayPause()
  }

  const handleSkip = (direction: 'back' | 'forward') => {
    const skipAmount = 1
    const newTime = direction === 'back' 
      ? Math.max(0, currentTime - skipAmount)
      : Math.min(duration, currentTime + skipAmount)
    seekTo(newTime)
  }

  const handleTimelineClick = (e: React.MouseEvent) => {
    // Don't move playhead if clicking on a clip or if playhead is being dragged
    if (isPlayheadDragging) return
    
    // Check if the click target is a clip or inside a clip
    const target = e.target as HTMLElement
    const isClipClick = target.closest('[data-clip-id]') || target.hasAttribute('data-clip-id')
    
    if (isClipClick) {
      // Don't move playhead when clicking on clips
      return
    }
    
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + timelineRef.current.scrollLeft
      const time = x / pixelsPerSecond
      seekTo(Math.max(0, Math.min(time, duration)))
    }
  }

  // Playhead drag handlers
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsPlayheadDragging(true)
    // Pause playback when dragging playhead
    if (isPlaying) {
      setIsPlaying(false)
      if (videoRef.current) videoRef.current.pause()
      if (audioRef.current) audioRef.current.pause()
    }
  }

  const handlePlayheadMouseMove = useCallback((e: MouseEvent) => {
    if (!isPlayheadDragging || !timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft
    const time = x / pixelsPerSecond
    const clampedTime = Math.max(0, Math.min(time, duration))
    
    // Update playhead position smoothly
    setPlayheadPosition(clampedTime * pixelsPerSecond)
    setCurrentTime(clampedTime)
    setDragTime(clampedTime)
  }, [isPlayheadDragging, pixelsPerSecond, duration, setCurrentTime])

  const handlePlayheadMouseUp = useCallback(() => {
    if (isPlayheadDragging) {
      setIsPlayheadDragging(false)
      // Sync with video/audio elements
      seekTo(currentTime)
    }
  }, [isPlayheadDragging, currentTime])

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.25, Math.min(4, zoom + delta))
    setZoom(newZoom)
  }

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    // Auto-unmute when volume is increased
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }, [isMuted])

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
  }

  // Video control functions
  const togglePlayPause = async () => {
    // Check if there are any media clips
    const hasVideo = currentClips.find(clip => clip.type === 'video')
    const hasAudio = currentClips.find(clip => clip.type === 'audio')
    
    if (!hasVideo && !hasAudio) {
      // No media loaded
      return
    }
    
    // If we have a video, use video controls
    if (hasVideo && videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause()
          if (audioRef.current) audioRef.current.pause()
          setIsPlaying(false)
        } else {
          await videoRef.current.play()
          if (audioRef.current) await audioRef.current.play()
          setIsPlaying(true)
        }
        } catch (error) {
          // Handle specific error types
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              // Media was removed from document - this is normal during cleanup
              // Video playback interrupted
            } else {
              logger.error('Error toggling video playback:', error)
            }
          } else {
            logger.error('Error toggling video playback:', error)
          }
          setIsPlaying(false)
        }
    }
    // If we only have audio, use audio controls
    else if (hasAudio && audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          await audioRef.current.play()
          setIsPlaying(true)
        }
        } catch (error) {
          // Handle specific error types
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              // Media was removed from document - this is normal during cleanup
              // Audio playback interrupted
            } else {
              logger.error('Error toggling audio playback:', error)
            }
          } else {
            logger.error('Error toggling audio playback:', error)
          }
          setIsPlaying(false)
        }
    }
    // Fallback: toggle state for UI feedback
    else {
      setIsPlaying(!isPlaying)
      // Playback state toggled
    }
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
    setCurrentTime(time)
  }

  // Sync video and audio with timeline
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.1) {
      videoRef.current.currentTime = currentTime
    }
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 0.1) {
      audioRef.current.currentTime = currentTime
    }
  }, [currentTime])

  // Sync audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Sync volume with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
    }
  }, [volume])

  // Sync playbackRate with elements when `playbackRate` changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  // Sync mute state with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  // Apply video transformations when videoTools change
  useEffect(() => {
    if (videoRef.current) {
      // Apply speed control
      if (videoTools.speed) {
        videoRef.current.playbackRate = videoTools.speed
      }
      // Apply volume control
      if (videoTools.volume !== undefined) {
        videoRef.current.volume = videoTools.volume
      }
    }
  }, [videoTools.speed, videoTools.volume])

  // Sync track volumes with media elements based on current time
  useEffect(() => {
    tracks.forEach(track => {
      // Find the clip that's currently playing at the current time
      const currentClip = clips.find(clip => 
        clip.trackId === track.id && 
        currentTime >= clip.startTime && 
        currentTime <= clip.endTime
      )
      
      if (currentClip) {
        if (currentClip.type === 'video' && videoRef.current) {
          videoRef.current.volume = track.volume * volume
          videoRef.current.muted = track.muted || isMuted
        } else if (currentClip.type === 'audio' && audioRef.current) {
          audioRef.current.volume = track.volume * volume
          audioRef.current.muted = track.muted || isMuted
        }
      }
    })
  }, [tracks, clips, volume, isMuted, currentTime])

  // Function to update volume for currently playing clips
  const updateCurrentClipVolumes = useCallback(() => {
    tracks.forEach(track => {
      const currentClip = clips.find(clip => 
        clip.trackId === track.id && 
        currentTime >= clip.startTime && 
        currentTime <= clip.endTime
      )
      
      if (currentClip) {
        if (currentClip.type === 'video' && videoRef.current) {
          videoRef.current.volume = track.volume * volume
          videoRef.current.muted = track.muted || isMuted
        } else if (currentClip.type === 'audio' && audioRef.current) {
          audioRef.current.volume = track.volume * volume
          audioRef.current.muted = track.muted || isMuted
        }
      }
    })
  }, [tracks, clips, currentTime, volume, isMuted])

  // Update volumes when current time changes (during playback)
  useEffect(() => {
    if (isPlaying) {
      updateCurrentClipVolumes()
    }
  }, [currentTime, isPlaying, updateCurrentClipVolumes])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case ' ': // Spacebar
          e.preventDefault()
          handlePlayPause()
          break
        case 'arrowleft':
          e.preventDefault()
          if (e.shiftKey) {
            // Fine control: move by 0.1 seconds
            const newTime = Math.max(0, currentTime - 0.1)
            seekTo(newTime)
          } else {
            handleSkip('back')
          }
          break
        case 'arrowright':
          e.preventDefault()
          if (e.shiftKey) {
            // Fine control: move by 0.1 seconds
            const newTime = Math.min(duration, currentTime + 0.1)
            seekTo(newTime)
          } else {
            handleSkip('forward')
          }
          break
        case 'm': // Mute
          e.preventDefault()
          toggleMute()
          break
        case 'g': // Toggle grid
          e.preventDefault()
          setShowGrid(!showGrid)
          break
        case 's': // Save project (Ctrl+S handled below)
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            localStorage.setItem('vedit-project-name', projectName)
            // Project saved
            break
          }
          break
        case 'c': // Toggle cut mode
          e.preventDefault()
          if (activeTool === 'cut') {
            setActiveTool(null)
            setCutMode(false)
          } else {
            setActiveTool('cut')
            setCutMode(true)
          }
          break
        case 'd': // Duplicate selected clip
          e.preventDefault()
          if (selectedClipId) {
            const clip = clips.find(c => c.id === selectedClipId)
            if (clip) {
              const newClip = {
                trackId: clip.trackId,
                name: `${clip.name} (Copy)`,
                type: clip.type,
                startTime: clip.endTime + 0.1,
                endTime: clip.endTime + clip.duration + 0.1,
                duration: clip.duration,
                url: clip.url,
                content: clip.content,
                waveform: clip.waveform,
                filters: clip.filters
              }
              addClip(newClip)
              toast.success('Clip duplicated')
            }
          }
          break
        case 'delete': // Delete selected clip
          e.preventDefault()
          if (selectedClipId) {
            removeClip(selectedClipId)
            setSelectedClipId(null)
            toast.success('Clip deleted')
          }
          break
        case 'x': // Split clip at current time
          e.preventDefault()
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
                url: clip.url,
                content: clip.content,
                waveform: clip.waveform
              }
              updateClip(clip.id, { 
                endTime: currentTime,
                duration: currentTime - clip.startTime
              })
              addClip(newClip)
              toast.success('Clip split')
            }
          }
          break
        default:
          break
      }

      // Handle Ctrl+Z and Ctrl+Y for undo/redo
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              // Ctrl+Shift+Z for redo
              if (canRedo) redo()
            } else {
              // Ctrl+Z for undo
              if (canUndo) undo()
            }
            break
          case 'y':
            e.preventDefault()
            // Ctrl+Y for redo
            if (canRedo) redo()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, showGrid, activeTool, setActiveTool, setCutMode, canUndo, canRedo, undo, redo]) // Dependencies for keyboard shortcuts

  // Enhanced drag & drop functions
  const handleClipMouseDown = useCallback((e: React.MouseEvent, clipId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return
    
    // Handle cut mode
    if (cutMode) {
      const timelineRect = timelineRef.current?.getBoundingClientRect()
      if (!timelineRect) return
      
      const clickX = e.clientX - timelineRect.left
      const clickTime = clickX / pixelsPerSecond
      
      // Only cut if click is within the clip bounds
      if (clickTime > clip.startTime && clickTime < clip.endTime) {
        // Create new clip for the second part
        const newClip = {
          trackId: clip.trackId,
          name: `${clip.name} (2)`,
          type: clip.type,
          startTime: clickTime,
          endTime: clip.endTime,
          duration: clip.endTime - clickTime,
          file: clip.file,
          url: clip.url,
          content: clip.content,
          waveform: clip.waveform
        }
        
        // Update original clip
        updateClip(clip.id, { 
          endTime: clickTime,
          duration: clickTime - clip.startTime
        })
        
        // Add new clip
        addClip(newClip)
        
        // Set current time to the cut point
        setCurrentTime(clickTime)
        
        // Exit cut mode
        setCutMode(false)
        setActiveTool(null)
        
        // Save to history after cut operation
        const store = useVideoEditorStore.getState()
        store.saveToHistory()
        
        return
      }
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const timelineRect = timelineRef.current?.getBoundingClientRect()
    if (!timelineRect) return
    
    setDraggedClip(clipId)
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
    setSelectedClipId(clipId)
  }, [clips, setSelectedClipId, cutMode, updateClip, addClip, pixelsPerSecond, setCurrentTime])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedClip || !timelineRef.current) return
    
    const timelineRect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - timelineRect.left + timelineRef.current.scrollLeft - dragOffset.x
    const newTime = Math.max(0, x / pixelsPerSecond)
    
    const clip = clips.find(c => c.id === draggedClip)
    if (!clip) return
    
    const duration = clip.endTime - clip.startTime
    updateClip(draggedClip, {
      startTime: newTime,
      endTime: newTime + duration
    })
  }, [isDragging, draggedClip, dragOffset, pixelsPerSecond, clips, updateClip])

  const handleMouseUp = useCallback(() => {
    const wasDragging = isDragging
    const wasResizing = isResizing
    
    setIsDragging(false)
    setDraggedClip(null)
    setIsResizing(false)
    setResizeHandle(null)
    
    // Save to history when editing operation completes
    if (wasDragging || wasResizing) {
      const store = useVideoEditorStore.getState()
      store.saveToHistory()
    }
  }, [isDragging, isResizing])

  // Resize functionality
  const handleResizeStart = useCallback((e: React.MouseEvent, clipId: string, handle: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setResizeHandle(handle)
    setDraggedClip(clipId)
    setSelectedClipId(clipId)
  }, [setSelectedClipId])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !draggedClip || !timelineRef.current) return
    
    const timelineRect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - timelineRect.left + timelineRef.current.scrollLeft
    const newTime = Math.max(0, x / pixelsPerSecond)
    
    const clip = clips.find(c => c.id === draggedClip)
    if (!clip) return
    
    if (resizeHandle === 'left') {
      const newStartTime = Math.min(newTime, clip.endTime - 0.1)
      updateClip(draggedClip, { startTime: newStartTime })
    } else if (resizeHandle === 'right') {
      const newEndTime = Math.max(newTime, clip.startTime + 0.1)
      updateClip(draggedClip, { endTime: newEndTime })
    }
  }, [isResizing, draggedClip, resizeHandle, pixelsPerSecond, clips, updateClip])

  // Media upload functions
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    const newFiles = Array.from(files)
    try {
      setUploadedFiles(prev => [...prev, ...newFiles])
      
      // Ensure we have at least one track
      if (tracks.length === 0) {
        addTrack({
          name: 'Video Track 1',
          type: 'video',
          muted: false,
          locked: false,
          color: '#3B82F6',
          volume: 1.0
        })
        addTrack({
          name: 'Audio Track 1',
          type: 'audio',
          muted: false,
          locked: false,
          color: '#10B981',
          volume: 1.0
        })
      }
      
      // Find the end time of the last video clip to place new clips sequentially
      const videoClips = clips.filter(clip => clip.type === 'video')
      const lastVideoEndTime = videoClips.length > 0 
        ? Math.max(...videoClips.map(clip => clip.endTime))
        : 0
      
      let sequentialStartTime = lastVideoEndTime
      
      // Add clips to timeline for each uploaded file
      for (const file of newFiles) {
        const fileType = file.type.startsWith('video/') ? 'video' : 
                        file.type.startsWith('audio/') ? 'audio' : 'image'
        
        const fileUrl = URL.createObjectURL(file)
        
      // For videos, get actual duration
        if (fileType === 'video') {
          const video = document.createElement('video')
          video.preload = 'metadata'
          
        await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => {
              const videoDuration = video.duration || 10
              
              // Get the current tracks after potential creation
              const currentTracks = useVideoEditorStore.getState().tracks
              const videoTrack = currentTracks.find(t => t.type === 'video') || currentTracks[0]
              
              addClip({
                name: file.name,
                type: fileType,
                startTime: sequentialStartTime,
                endTime: sequentialStartTime + videoDuration,
                duration: videoDuration,
                url: fileUrl,
                originalUrl: fileUrl,
                trackId: videoTrack?.id || 'default-video-track'
              })
              
              // Move playhead to the end of this video
              setCurrentTime(sequentialStartTime + videoDuration)
              
              sequentialStartTime += videoDuration // Next video starts after this one
              resolve()
            }
            video.src = fileUrl
          })
        } else {
          // For audio and images, use default durations
          const defaultDuration = fileType === 'audio' ? 30 : 5
          
          // Get the current tracks after potential creation
          const currentTracks = useVideoEditorStore.getState().tracks
          const targetTrack = fileType === 'audio' 
            ? currentTracks.find(t => t.type === 'audio') || currentTracks[1] || currentTracks[0]
            : currentTracks.find(t => t.type === 'video') || currentTracks[0]
          
          const newClip: any = {
            name: file.name,
            type: fileType as 'audio' | 'image',
            startTime: sequentialStartTime,
            endTime: sequentialStartTime + defaultDuration,
            duration: defaultDuration,
            url: fileUrl,
            originalUrl: fileUrl,
            trackId: targetTrack?.id || 'default-track'
          }
          
          // If audio, try to generate a quick waveform using WebAudio + worker
          if (fileType === 'audio' && waveformWorkerRef.current) {
            try {
              const arrayBuffer = await file.arrayBuffer()
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
              const decoded = await audioCtx.decodeAudioData(arrayBuffer)
              const channel = decoded.getChannelData(0)
              const id = `wf-${Date.now()}`
              waveformWorkerRef.current.postMessage({ id, samples: channel, targetLength: 600 })
              const waveform = await new Promise<number[]>((resolve) => {
                const handler = (e: MessageEvent<any>) => {
                  if (e.data?.id === id) {
                    resolve(e.data.waveform || [])
                    waveformWorkerRef.current?.removeEventListener('message', handler as any)
                  }
                }
                waveformWorkerRef.current?.addEventListener('message', handler as any)
              })
              ;(newClip as any).waveform = waveform
            } catch {}
          }
          
          addClip(newClip)
          
          if (fileType === 'audio') {
            // Audio doesn't affect sequential video placement, but move playhead
            setCurrentTime(sequentialStartTime + defaultDuration)
          } else {
            sequentialStartTime += defaultDuration
            setCurrentTime(sequentialStartTime)
          }
        }
      }
    } catch (error) {
      logger.error('Upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setIsUploading(false)
      toast.success(`Successfully added ${newFiles.length} file(s) to timeline`)
    }
  }, [clips, addClip, tracks, setCurrentTime])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Context menu functions
  const handleContextMenu = useCallback((e: React.MouseEvent, clipId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, clipId })
    setSelectedClipId(clipId)
  }, [setSelectedClipId])

  const handleSplitClip = useCallback(() => {
    if (!contextMenu) return
    
    const clip = clips.find(c => c.id === contextMenu.clipId)
    if (!clip || currentTime <= clip.startTime || currentTime >= clip.endTime) return
    
    // Create new clip for the second part
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
    
    // Update original clip
    updateClip(clip.id, { endTime: currentTime })
    
    // Add new clip
    addClip(newClip)
    
    setContextMenu(null)
    
    // Save to history after split operation
    const store = useVideoEditorStore.getState()
    store.saveToHistory()
  }, [contextMenu, clips, currentTime, updateClip, addClip])

  // Clamp context menu within viewport after it mounts
  useEffect(() => {
    if (!contextMenu) {
      setContextMenuPos(null)
      return
    }
    // Defer to next frame to ensure ref has dimensions
    const id = window.requestAnimationFrame(() => {
      const menuEl = contextMenuRef.current
      const width = menuEl?.offsetWidth || 200
      const height = menuEl?.offsetHeight || 160
      const padding = 8
      const maxX = window.innerWidth - width - padding
      const maxY = window.innerHeight - height - padding
      const clampedX = Math.max(padding, Math.min(contextMenu.x, maxX))
      const clampedY = Math.max(padding, Math.min(contextMenu.y, maxY))
      setContextMenuPos({ x: clampedX, y: clampedY })
    })
    return () => window.cancelAnimationFrame(id)
  }, [contextMenu])

  const handleDuplicateClip = useCallback(() => {
    if (!contextMenu) return
    
    const clip = clips.find(c => c.id === contextMenu.clipId)
    if (!clip) return
    
    const newClip = {
      trackId: clip.trackId,
      name: `${clip.name} (Copy)`,
      type: clip.type,
      startTime: clip.endTime + 0.1,
      endTime: clip.endTime + clip.duration + 0.1,
      duration: clip.duration,
      file: clip.file,
      url: clip.url,
      content: clip.content,
      waveform: clip.waveform
    }
    
    addClip(newClip)
    setContextMenu(null)
    
    // Save to history after duplicate operation
    const store = useVideoEditorStore.getState()
    store.saveToHistory()
  }, [contextMenu, clips, addClip])

  const handleDeleteClip = useCallback(() => {
    if (!contextMenu) return
    removeClip(contextMenu.clipId)
    setContextMenu(null)
    
    // Save to history after delete operation
    const store = useVideoEditorStore.getState()
    store.saveToHistory()
  }, [contextMenu, removeClip])

  // Track management functions (for future implementation)
  // const handleTrackReorder = useCallback((dragIndex: number, hoverIndex: number) => {
  //   const newTracks = [...tracks]
  //   const draggedTrack = newTracks[dragIndex]
  //   newTracks.splice(dragIndex, 1)
  //   newTracks.splice(hoverIndex, 0, draggedTrack)
  //   
  //   // Update track order in store (would need to implement this in the store)
  //   logger.debug('Reorder tracks:', newTracks)
  // }, [tracks])

  const handleDeleteTrack = useCallback((trackId: string) => {
    if (tracks.length <= 1) return // Don't delete the last track
    removeTrack(trackId)
  }, [tracks.length, removeTrack])

  const handleTrackVolumeChange = useCallback((trackId: string, value: string) => {
    const newVolume = parseInt(value) / 100
    updateTrack(trackId, { volume: newVolume })
    
    // Apply volume to media elements based on current time
    const track = tracks.find(t => t.id === trackId)
    if (track) {
      // Find the clip that's currently playing at the current time
      const currentClip = clips.find(clip => 
        clip.trackId === trackId && 
        currentTime >= clip.startTime && 
        currentTime <= clip.endTime
      )
      
      if (currentClip) {
        if (currentClip.type === 'video' && videoRef.current) {
          videoRef.current.volume = newVolume * volume
        } else if (currentClip.type === 'audio' && audioRef.current) {
          audioRef.current.volume = newVolume * volume
        }
      }
    }
  }, [updateTrack, tracks, clips, volume, currentTime])

  const handleTrackMute = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (track) {
      const newMuted = !track.muted
      updateTrack(trackId, { muted: newMuted })
      
      // Apply mute to media elements based on current time
      const currentClip = clips.find(clip => 
        clip.trackId === trackId && 
        currentTime >= clip.startTime && 
        currentTime <= clip.endTime
      )
      
      if (currentClip) {
        if (currentClip.type === 'video' && videoRef.current) {
          videoRef.current.muted = newMuted || isMuted
        } else if (currentClip.type === 'audio' && audioRef.current) {
          audioRef.current.muted = newMuted || isMuted
        }
      }
    }
  }, [updateTrack, tracks, clips, currentTime, isMuted])

  // Waveform generation
  const generateWaveform = useCallback((duration: number): number[] => {
    const samples = Math.floor(duration * 10) // 10 samples per second
    return Array.from({ length: samples }, () => Math.random() * 0.8 + 0.1)
  }, [])

  // Initialize track heights
  useEffect(() => {
    const initialHeights: Record<string, number> = {}
    tracks.forEach(track => {
      initialHeights[track.id] = trackHeights[track.id] || 80
    })
    setTrackHeights(initialHeights)
  }, [tracks])

  // Mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing || isPlayheadDragging) {
      const moveHandler = isResizing ? handleResizeMove : isPlayheadDragging ? handlePlayheadMouseMove : handleMouseMove
      const upHandler = isPlayheadDragging ? handlePlayheadMouseUp : handleMouseUp
      
      document.addEventListener('mousemove', moveHandler)
      document.addEventListener('mouseup', upHandler)
      return () => {
        document.removeEventListener('mousemove', moveHandler)
        document.removeEventListener('mouseup', upHandler)
      }
    }
  }, [isDragging, isResizing, isPlayheadDragging, handleMouseMove, handleResizeMove, handleMouseUp, handlePlayheadMouseMove, handlePlayheadMouseUp])

  // Generate time markers
  const timeMarkers = []
  const markerInterval = zoom > 2 ? 1 : zoom > 1 ? 2 : 5
  for (let i = 0; i <= duration; i += markerInterval) {
    timeMarkers.push({
      time: i,
      position: i * pixelsPerSecond,
      label: formatTime(i)
    })
  }

  // Get current clips at the current time
  const getCurrentClips = () => {
    return clips.filter(clip => 
      currentTime >= clip.startTime && currentTime <= clip.endTime
    )
  }

  const currentClips = getCurrentClips()

  const tools = [
    { 
      icon: <Scissors className="w-5 h-5" />, 
      label: 'Cut', 
      active: activeTool === 'cut',
      onClick: () => {
        if (activeTool === 'cut') {
          setActiveTool(null)
          setCutMode(false)
        } else {
          setActiveTool('cut')
          setCutMode(true)
        }
      }
    },
    { 
      icon: <Type className="w-5 h-5" />, 
      label: 'Text', 
      active: activeTool === 'text',
      onClick: () => {
        if (activeTool === 'text') {
          setActiveTool(null)
        } else {
          setActiveTool('text')
          setCutMode(false)
        }
      }
    },
    { 
      icon: <Wand2 className="w-5 h-5" />, 
      label: 'Effects', 
      active: activeTool === 'effects',
      onClick: () => {
        if (activeTool === 'effects') {
          setActiveTool(null)
        } else {
          setActiveTool('effects')
          setCutMode(false)
        }
      }
    },
    { 
      icon: <Filter className="w-5 h-5" />, 
      label: 'Filters', 
      active: activeTool === 'filters',
      onClick: () => {
        if (activeTool === 'filters') {
          setActiveTool(null)
        } else {
          setActiveTool('filters')
          setCutMode(false)
        }
      }
    }
  ]


  // Waveform component
  const Waveform = ({ width, height, waveform }: { width: number; height: number; waveform?: number[] }) => {
    const samples = waveform || generateWaveform(width / pixelsPerSecond)
    const sampleWidth = Math.max(1, width / samples.length)

  return (
      <svg width={width} height={height} className="absolute inset-0 opacity-60">
        {samples.map((amplitude, i) => {
          const barHeight = amplitude * height * 0.8
          const y = (height - barHeight) / 2
          return (
            <rect
              key={i}
              x={i * sampleWidth}
              y={y}
              width={Math.max(1, sampleWidth - 1)}
              height={barHeight}
              fill="currentColor"
              className="text-white"
            />
          )
        })}
      </svg>
    )
  }

  // Clip thumbnail component
  const ClipThumbnail = ({ clip }: { clip: any }) => {
    if (clip.type === 'video') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Video className="w-6 h-6 text-white" />
            </div>
      )
    } else if (clip.type === 'audio') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
          </div>
      )
    } else if (clip.type === 'image') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-white" />
        </div>
      )
    } else {
  return (
        <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
          <Type className="w-6 h-6 text-white" />
            </div>
      )
    }
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src="/images/vedit-logo.png"
              alt="VEdit Logo"
              className="w-7 h-7 object-contain"
            />
            <span className="text-lg font-bold text-white hidden sm:block">VEdit</span>
          </button>
          
          {/* Back to Home */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          {/* Project Name */}
          <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
              className="text-sm font-medium bg-transparent border-none outline-none text-white px-2 py-1 rounded hover:bg-zinc-800 focus:bg-zinc-800 focus:ring-1 focus:ring-blue-500 transition-colors w-32 sm:w-48"
              placeholder="Untitled Project"
              title="Click to edit project name"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={undo}
            disabled={!canUndo}
            className={`p-2 hover:bg-zinc-800 rounded-lg transition-colors active:bg-zinc-700 ${
              !canUndo ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Undo"
          >
            <Undo className={`w-4 h-4 transition-colors ${
              canUndo ? 'text-gray-400 hover:text-white' : 'text-gray-600'
            }`} />
          </button>
          <button 
            onClick={redo}
            disabled={!canRedo}
            className={`p-2 hover:bg-zinc-800 rounded-lg transition-colors active:bg-zinc-700 ${
              !canRedo ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Redo"
          >
            <Redo className={`w-4 h-4 transition-colors ${
              canRedo ? 'text-gray-400 hover:text-white' : 'text-gray-600'
            }`} />
          </button>
          
          <div className="w-px h-6 bg-zinc-700 mx-2" />
          
          <button 
            onClick={() => {
              // Save project name to localStorage
              localStorage.setItem('vedit-project-name', projectName)
              // Project saved
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Save Project (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button 
            id="export-button"
            data-testid="export-button"
            onClick={() => setShowExportPanel(true)}
            className="px-3 py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <AnimatePresence>
          {leftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-950 border-r border-zinc-800 flex flex-col overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex border-b border-zinc-800 bg-zinc-900">
                {[
                  { id: 'media', label: 'Media', icon: <Video className="w-4 h-4" /> },
                  { id: 'effects', label: 'Effects', icon: <Wand2 className="w-4 h-4" /> },
                  { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
                  { id: 'audio', label: 'Audio', icon: <Music className="w-4 h-4" /> }
                ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveLeftTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium transition-colors border-b-2 ${
                      activeLeftTab === tab.id
                        ? 'text-white border-white'
                        : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeLeftTab === 'media' && (
                  <div className="space-y-3">
                    <div
                      className="w-full p-4 border-2 border-dashed border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors text-center group cursor-pointer"
                      onClick={handleUploadClick}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500 group-hover:text-gray-400" />
                      <p className="text-sm text-gray-400 group-hover:text-gray-300">
                        {isUploading ? 'Uploading...' : 'Upload Media'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">or drag & drop</p>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="video/*,audio/*,image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400 font-medium">Uploaded Files:</p>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="p-2 bg-zinc-900 rounded text-xs text-gray-300">
                            {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {uploadedFiles.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-8">
                        No media files yet
                      </div>
                    )}
                  </div>
                )}

                {activeLeftTab === 'effects' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-900 rounded-lg">
                      <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        Transition Effects
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { name: 'Fade In', icon: '🌅', description: 'Smooth fade in' },
                          { name: 'Fade Out', icon: '🌇', description: 'Smooth fade out' },
                          { name: 'Cross Dissolve', icon: '🔄', description: 'Blend transition' },
                          { name: 'Wipe', icon: '➡️', description: 'Slide wipe effect' },
                          { name: 'Zoom', icon: '🔍', description: 'Zoom transition' },
                          { name: 'Pan', icon: '📹', description: 'Pan movement' },
                          { name: 'Slide', icon: '↔️', description: 'Slide transition' }
                        ].map((effect) => (
                <button
                            key={effect.name}
                            onClick={() => {
                              if (activeEffects.includes(effect.name)) {
                                setActiveEffects(activeEffects.filter(e => e !== effect.name))
                                // Removed effect
                              } else {
                                setActiveEffects([...activeEffects, effect.name])
                                // Applied effect
                              }
                            }}
                            className={`w-full p-3 rounded-lg text-left text-sm transition-all duration-200 ${
                              activeEffects.includes(effect.name)
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform scale-105'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white hover:scale-102'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{effect.icon}</span>
                              <div className="flex-1">
                                <div className="font-medium">{effect.name}</div>
                                <div className="text-xs opacity-75">{effect.description}</div>
                              </div>
                              {activeEffects.includes(effect.name) && (
                                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 text-xs font-bold">✓</span>
                                </div>
                              )}
                            </div>
                </button>
                        ))}
                      </div>
                    </div>
                    
                  </div>
                )}

                {activeLeftTab === 'text' && (
                  <div className="space-y-3">
                    <div className="space-y-3 p-3 bg-zinc-900 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium">Add New Text</p>
                      <input
                        type="text"
                        placeholder="Enter text..."
                        id="new-text-input"
                        className="w-full px-3 py-2 bg-zinc-800 text-white rounded text-sm border border-zinc-700 focus:border-blue-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Color</label>
                          <input
                            type="color"
                            id="text-color-input"
                            defaultValue="#ffffff"
                            className="w-full h-10 bg-zinc-800 rounded cursor-pointer"
                          />
              </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Size</label>
                          <input
                            type="number"
                            id="text-size-input"
                            defaultValue="48"
                            min="12"
                            max="200"
                            className="w-full px-2 py-2 bg-zinc-800 text-white rounded text-sm border border-zinc-700 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                <button
                        onClick={() => {
                          const textInput = document.getElementById('new-text-input') as HTMLInputElement
                          const colorInput = document.getElementById('text-color-input') as HTMLInputElement
                          const sizeInput = document.getElementById('text-size-input') as HTMLInputElement
                          
                          const newText = {
                            id: `text-${Date.now()}`,
                            text: textInput.value || 'New Text',
                            x: 50,
                            y: 50,
                            fontSize: parseInt(sizeInput.value) || 48,
                            color: colorInput.value || '#ffffff'
                          }
                          setTextOverlays([...textOverlays, newText])
                          textInput.value = '' // Clear input
                        }}
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-center transition-colors text-sm font-medium text-white"
                      >
                        <Type className="w-4 h-4 inline-block mr-2" />
                        Add Text
                </button>
              </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Title', fontSize: 72, y: 20 },
                        { name: 'Subtitle', fontSize: 48, y: 40 },
                        { name: 'Lower Third', fontSize: 36, y: 85 },
                        { name: 'Credits', fontSize: 32, y: 50 }
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            const newText = {
                              id: `text-${Date.now()}`,
                              text: preset.name,
                              x: 50,
                              y: preset.y,
                              fontSize: preset.fontSize,
                              color: '#ffffff'
                            }
                            setTextOverlays([...textOverlays, newText])
                          }}
                          className="w-full p-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-left text-sm text-gray-300 transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                    
                    {/* Text List */}
                    {textOverlays.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Text Layers:</p>
                        {textOverlays.map((text) => (
                          <div key={text.id} className="p-2 bg-zinc-900 rounded flex items-center justify-between">
                            <span className="text-xs text-gray-300 truncate">{text.text}</span>
                            <button
                              onClick={() => setTextOverlays(textOverlays.filter(t => t.id !== text.id))}
                              className="p-1 hover:bg-zinc-800 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3 text-gray-500" />
                            </button>
              </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeLeftTab === 'audio' && (
                  <div className="space-y-3">
                    <div
                      className="w-full p-4 border-2 border-dashed border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors text-center group cursor-pointer"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'audio/*'
                        input.multiple = true
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files
                          if (files) {
                            handleFileUpload(files)
                          }
                        }
                        input.click()
                      }}
                    >
                      <Music className="w-8 h-8 mx-auto mb-2 text-gray-500 group-hover:text-gray-400" />
                      <p className="text-sm text-gray-400 group-hover:text-gray-300">
                        {isUploading ? 'Uploading...' : 'Add Audio'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">or drag & drop</p>
                    </div>
                    
                    {/* Sample Audio Library */}
                    <div className="p-3 bg-zinc-900 rounded-lg">
                      <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Music className="w-4 h-4 text-green-400" />
                        Sample Audio Library
                      </h3>
                      <div className="space-y-2">
                        {[
                          { name: 'Upbeat Background', duration: '2:30', genre: 'Electronic' },
                          { name: 'Cinematic Score', duration: '3:15', genre: 'Orchestral' },
                          { name: 'Corporate Jingle', duration: '0:15', genre: 'Business' },
                          { name: 'Nature Sounds', duration: '5:00', genre: 'Ambient' },
                          { name: 'Rock Intro', duration: '1:45', genre: 'Rock' }
                        ].map((audio, index) => (
                          <button
                            key={index}
                            onClick={async () => {
                              // Create a real audio file using Web Audio API
                              const duration = audio.duration === '0:15' ? 15 : 
                                             audio.duration === '1:45' ? 105 :
                                             audio.duration === '2:30' ? 150 :
                                             audio.duration === '3:15' ? 195 : 300
                              
                              try {
                                // Create audio context
                                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                                const sampleRate = audioContext.sampleRate
                                const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate)
                                const data = buffer.getChannelData(0)
                                
                                // Generate different tones based on audio type
                                let frequency = 440 // Default A4
                                switch (audio.name) {
                                  case 'Upbeat Background':
                                    frequency = 523.25 // C5
                                    break
                                  case 'Cinematic Score':
                                    frequency = 329.63 // E4
                                    break
                                  case 'Corporate Jingle':
                                    frequency = 659.25 // E5
                                    break
                                  case 'Nature Sounds':
                                    frequency = 220 // A3
                                    break
                                  case 'Rock Intro':
                                    frequency = 392 // G4
                                    break
                                }
                                
                                // Generate audio data
                                for (let i = 0; i < data.length; i++) {
                                  const t = i / sampleRate
                                  // Create a simple sine wave with some variation
                                  data[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3 * Math.exp(-t * 0.1)
                                }
                                
                                // Convert to WAV
                                const wavBuffer = audioBufferToWav(buffer)
                                const blob = new Blob([wavBuffer], { type: 'audio/wav' })
                                const audioUrl = URL.createObjectURL(blob)
                                
                                // Find the end time of the last audio clip
                                const audioClips = clips.filter(clip => clip.type === 'audio')
                                const lastAudioEndTime = audioClips.length > 0 
                                  ? Math.max(...audioClips.map(clip => clip.endTime))
                                  : currentTime
                                
                                const startTime = Math.max(lastAudioEndTime, currentTime)
                                
                                addClip({
                                  name: audio.name,
                                  type: 'audio',
                                  startTime: startTime,
                                  endTime: startTime + duration,
                                  duration: duration,
                                  url: audioUrl,
                                  trackId: tracks[1]?.id || 'track-2'
                                })
                                
                                // Move playhead to the end of this audio
                                setCurrentTime(startTime + duration)
                                
                                // Added sample audio
                              } catch (error) {
                                logger.error('Error creating audio:', error)
                                // Fallback to mock audio
                                const audioUrl = `data:audio/wav;base64,${btoa('sample-audio-' + audio.name)}`
                                const duration = audio.duration === '0:15' ? 15 : 
                                               audio.duration === '1:45' ? 105 :
                                               audio.duration === '2:30' ? 150 :
                                               audio.duration === '3:15' ? 195 : 300
                                
                                const audioClips = clips.filter(clip => clip.type === 'audio')
                                const lastAudioEndTime = audioClips.length > 0 
                                  ? Math.max(...audioClips.map(clip => clip.endTime))
                                  : currentTime
                                
                                const startTime = Math.max(lastAudioEndTime, currentTime)
                                
                                addClip({
                                  name: audio.name,
                                  type: 'audio',
                                  startTime: startTime,
                                  endTime: startTime + duration,
                                  duration: duration,
                                  url: audioUrl,
                                  trackId: tracks[1]?.id || 'track-2'
                                })
                                
                                setCurrentTime(startTime + duration)
                              }
                            }}
                            className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                                <Music className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-white font-medium">{audio.name}</div>
                                <div className="text-xs text-gray-400">{audio.duration} • {audio.genre}</div>
                              </div>
                              <button className="p-1 hover:bg-zinc-600 rounded">
                                <span className="text-green-400 text-sm">+</span>
                              </button>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Show uploaded audio files */}
                    {uploadedFiles.filter(f => f.type.startsWith('audio/')).length > 0 && (
                      <div className="p-3 bg-zinc-900 rounded-lg">
                        <h3 className="text-sm font-medium text-white mb-3">Your Audio Files</h3>
                        <div className="space-y-2">
                          {uploadedFiles.filter(f => f.type.startsWith('audio/')).map((file, index) => (
                            <div key={index} className="p-3 bg-zinc-800 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Music className="w-5 h-5 text-blue-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                </div>
                                <button className="p-1 hover:bg-zinc-600 rounded">
                                  <span className="text-red-400 text-sm">×</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center - Video Preview & Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video Canvas Area */}
          <div className="flex-1 bg-black relative overflow-hidden">
            {/* Toolbar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                  className="p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-lg transition-colors"
                >
                  {leftPanelOpen ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
                </button>
                
                {/* Tools */}
                <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
                  {tools.map((tool) => (
                    <button
                      key={tool.label}
                      onClick={tool.onClick}
                      className={`p-2 rounded transition-colors ${
                        tool.active ? 'bg-white text-black' : 'text-white hover:bg-white/20'
                      }`}
                      title={tool.label}
                    >
                      {tool.icon}
                    </button>
                  ))}
                </div>
                
                {/* Cut Mode Indicator */}
                {cutMode && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <Scissors className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400 font-medium">Cut Mode - Click on a clip to split it</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-2 rounded-lg transition-colors ${
                    showGrid ? 'bg-white text-black' : 'bg-black/50 backdrop-blur-sm text-white hover:bg-black/70'
                  }`}
                  title="Toggle Grid"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSafeArea(!showSafeArea)}
                  className={`p-2 rounded-lg transition-colors ${
                    showSafeArea ? 'bg-white text-black' : 'bg-black/50 backdrop-blur-sm text-white hover:bg-black/70'
                  }`}
                  title="Toggle Safe Area"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-lg transition-colors"
                  title="Keyboard Shortcuts"
                >
                  <span className="text-white text-sm font-mono">?</span>
                </button>
                <button
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className="p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-lg transition-colors"
                >
                  {rightPanelOpen ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>

            {/* Video Preview */}
            <div className="w-full h-full flex items-center justify-center p-6">
              <div className="relative w-full max-w-6xl">
                {/* Video Container */}
                <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                  {currentClips.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-zinc-800 rounded-full flex items-center justify-center">
                          <Video className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Content</h3>
                        <p className="text-sm text-gray-500 mb-4">Add media files to the timeline to see them here</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                          <span>Drag & drop media files or use the upload button</span>
                          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      {/* Render the current video clip */}
                      {currentClips.find(clip => clip.type === 'video') && (
                        <video
                          ref={videoRef}
                          data-clip-id={currentClips.find(clip => clip.type === 'video')?.id}
                          className={`w-full h-full object-contain transition-all duration-500 ${
                            activeEffects.includes('Fade In') ? 'opacity-0 animate-fade-in' :
                            activeEffects.includes('Fade Out') ? 'opacity-100 animate-fade-out' :
                            activeEffects.includes('Zoom') ? 'scale-110' :
                            activeEffects.includes('Pan') ? 'transform-gpu' : ''
                          }`}
                          src={currentClips.find(clip => clip.type === 'video')?.url}
                          loop
                          style={{
                            filter: `
                              brightness(${(adjustments.brightness + 100) / 100})
                              contrast(${(adjustments.contrast + 100) / 100})
                              saturate(${(adjustments.saturation + 100) / 100})
                              brightness(${(adjustments.exposure + 100) / 100})
                              hue-rotate(${adjustments.hue}deg)
                              blur(${adjustments.blur}px)
                              ${activeFilters.map(filterName => {
                                const filter = [
                                  { name: 'Sepia', filter: 'sepia(100%)' },
                                  { name: 'Grayscale', filter: 'grayscale(100%)' },
                                  { name: 'Vintage', filter: 'sepia(50%) contrast(1.2) brightness(0.9)' },
                                  { name: 'Cool', filter: 'hue-rotate(180deg) saturate(1.2)' },
                                  { name: 'Warm', filter: 'hue-rotate(30deg) saturate(1.3)' },
                                  { name: 'Dramatic', filter: 'contrast(1.5) brightness(0.8) saturate(1.2)' },
                                  { name: 'Soft', filter: 'blur(1px) brightness(1.1)' },
                                  { name: 'High Contrast', filter: 'contrast(2) brightness(0.9)' }
                                ].find(f => f.name === filterName)?.filter || ''
                                return filter
                              }).join(' ')}
                            `.trim(),
                            transform: `
                              ${videoTools.rotation ? `rotate(${videoTools.rotation}deg)` : ''}
                              ${videoTools.cropWidth ? `scale(${videoTools.cropWidth / 100})` : ''}
                              ${activeEffects.includes('Pan') ? 'translateX(20px)' : ''}
                            `.trim(),
                            opacity: videoTools.opacity ? videoTools.opacity / 100 : 1,
                            transition: 'all 0.3s ease-in-out'
                          }}
                          onTimeUpdate={(e) => {
                            const video = e.target as HTMLVideoElement
                            setCurrentTime(video.currentTime)
                          }}
                          onLoadedMetadata={() => {
                            // Duration will be set automatically by the video element
                            // Apply speed control
                            if (videoRef.current && videoTools.speed) {
                              videoRef.current.playbackRate = videoTools.speed
                            }
                          }}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onEnded={() => {
                            // Loop back to the beginning instead of stopping
                            setCurrentTime(0)
                            if (videoRef.current) {
                              videoRef.current.currentTime = 0
                              // Keep playing if it was playing
                              if (isPlaying) {
                                videoRef.current.play()
                              }
                            }
                          }}
                          muted={isMuted}
                        />
                      )}

                      {/* Audio element for audio clips */}
                      {currentClips.find(clip => clip.type === 'audio') && (
                        <audio
                          ref={audioRef}
                          src={currentClips.find(clip => clip.type === 'audio')?.url}
                          onTimeUpdate={(e) => {
                            const audio = e.target as HTMLAudioElement
                            setCurrentTime(audio.currentTime)
                          }}
                          onLoadedMetadata={() => {
                            if (audioRef.current) {
                              setCurrentTime(audioRef.current.currentTime)
                            }
                          }}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onEnded={() => {
                            setIsPlaying(false)
                            if (audioRef.current) {
                              // Stay at the end, don't reset to 0
                              setCurrentTime(duration)
                            }
                          }}
                          muted={isMuted}
                        />
                      )}

                      {/* Vignette Effect */}
                      {adjustments.vignette > 0 && (
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at center, transparent ${100 - adjustments.vignette}%, rgba(0,0,0,${adjustments.vignette / 100}) 100%)`
                          }}
                        />
                      )}

                      {/* Film Grain Effect */}
                      {adjustments.filmGrain > 0 && (
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            opacity: adjustments.filmGrain / 100,
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.2'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'repeat',
                            mixBlendMode: 'overlay'
                          }}
                        />
                      )}

                      {/* Video/Image Overlays */}
                      {clips
                        .filter(clip => clip.trackId !== tracks.find(t => t.type === 'video')?.id && 
                                       (clip.type === 'video' || clip.type === 'image') &&
                                       currentTime >= clip.startTime && currentTime <= clip.endTime)
                        .map((overlayClip) => {
                          const x = (overlayClip.filters as any)?.x || 0
                          const y = (overlayClip.filters as any)?.y || 0
                          const opacity = (overlayClip.filters as any)?.opacity || 1
                          
                          return (
                            <div
                              key={overlayClip.id}
                              className="absolute pointer-events-none"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                opacity: opacity,
                                transform: 'translate(-50%, -50%)',
                                maxWidth: '30%',
                                maxHeight: '30%'
                              }}
                            >
                              {overlayClip.type === 'video' ? (
                                <video
                                  data-clip-id={overlayClip.id}
                                  src={overlayClip.url}
                                  className="w-full h-full object-contain rounded-lg shadow-lg"
                                  muted
                                  autoPlay
                                  loop
                                  style={{
                                    filter: `
                                      brightness(${(adjustments.brightness + 100) / 100})
                                      contrast(${(adjustments.contrast + 100) / 100})
                                    `.trim()
                                  }}
                                />
                              ) : (
                                <img
                                  src={overlayClip.url}
                                  alt={overlayClip.name}
                                  className="w-full h-full object-contain rounded-lg shadow-lg"
                                  style={{
                                    filter: `
                                      brightness(${(adjustments.brightness + 100) / 100})
                                      contrast(${(adjustments.contrast + 100) / 100})
                                    `.trim()
                                  }}
                                />
                              )}
                            </div>
                          )
                        })}

                      {/* Text Overlays */}
                      {textOverlays.map((text) => (
                        <div
                          key={text.id}
                          className="absolute pointer-events-none"
                          style={{
                            left: `${text.x}%`,
                            top: `${text.y}%`,
                            fontSize: `${text.fontSize}px`,
                            color: text.color,
                            fontWeight: 'bold',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          {text.text}
                        </div>
                      ))}
                      
                      {/* Show message if no video clips */}
                      {!currentClips.find(clip => clip.type === 'video') && (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600/10 to-purple-600/10 flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
                          <div className="relative z-10 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                              <Play className="w-8 h-8 text-white/60" />
                            </div>
                            <p className="text-sm text-white/60 font-medium">Upload a video to see preview</p>
                            <p className="text-xs text-white/40 mt-1">{currentClips.length} clip{currentClips.length !== 1 ? 's' : ''} active</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grid Overlay */}
                  {showGrid && (
            <div className="absolute inset-0 pointer-events-none">
                      <svg className="w-full h-full">
                        <defs>
                          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>
                  )}

                  {/* Safe Area Guides */}
                  {showSafeArea && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Title Safe Area (90%) */}
                      <div className="absolute inset-0 m-[5%] border border-yellow-400/30 rounded-lg">
                        <div className="absolute -top-5 left-0 text-xs text-yellow-400 bg-black/50 px-2 py-1 rounded">
                          Title Safe
                        </div>
                      </div>
                      {/* Action Safe Area (95%) */}
                      <div className="absolute inset-0 m-[2.5%] border border-red-400/30 rounded-lg">
                        <div className="absolute -top-5 right-0 text-xs text-red-400 bg-black/50 px-2 py-1 rounded">
                          Action Safe
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Center Crosshair */}
            <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10"></div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10"></div>
                  </div>
                </div>

                {/* Video Info Bar */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>1920 × 1080</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>30fps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>16:9</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Zoom: {Math.round(zoom * 100)}%</span>
                    <div className="w-px h-4 bg-zinc-800"></div>
                    <span>Frame: {Math.floor(currentTime * 30)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl">
                  <button
                    onClick={() => handleSkip('back')}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                  title="Skip Back"
                  >
                    <SkipBack className="w-5 h-5 text-white" />
                  </button>
                  
                  <button
                    onClick={handlePlayPause}
                    className="p-3 bg-white hover:bg-gray-100 active:bg-gray-200 rounded-full transition-all duration-150 transform hover:scale-105 active:scale-95"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    disabled={currentClips.length === 0}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-black" />
                    ) : (
                      <Play className="w-6 h-6 text-black ml-0.5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleSkip('forward')}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                  title="Skip Forward"
                  >
                    <SkipForward className="w-5 h-5 text-white" />
                  </button>
                  
                <div className="w-px h-6 bg-zinc-700" />
                
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="p-1 hover:bg-zinc-800 rounded transition-colors">
                    {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-gray-400" />}
              </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20"
                    style={{
                      background: `linear-gradient(to right, #ffffff 0%, #ffffff ${(isMuted ? 0 : volume) * 100}%, #71717a ${(isMuted ? 0 : volume) * 100}%, #71717a 100%)`
                    }}
                  />
                  </div>
              
                <div className="w-px h-6 bg-zinc-700" />
                
                <div className="text-white text-sm font-mono tabular-nums">
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>
          </div>

           {/* Timeline Section */}
           <div className="h-64 bg-zinc-950 border-t border-zinc-800 flex flex-col">
            {/* Timeline Header */}
            <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-white">Timeline</span>
                <div className="flex items-center gap-2">
              <button
                    onClick={() => handleZoom(-0.25)}
                    className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-400" />
              </button>
                  <span className="text-xs text-gray-500 w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
              <button
                    onClick={() => handleZoom(0.25)}
                    className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-400" />
              </button>
              </div>
              
                <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
                  <span className="text-xs text-gray-500">Playback:</span>
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-gray-300 focus:outline-none focus:border-zinc-600"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
            </div>

              <button
                onClick={() => addTrack({ 
                  name: `Track ${tracks.length + 1}`, 
                  type: 'video', 
                  muted: false, 
                  locked: false, 
                  volume: 1, 
                  color: '#6366f1' 
                })}
                className="flex items-center gap-2 px-3 py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Track
              </button>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Track Labels */}
              <div className="w-48 border-r border-zinc-800 bg-zinc-900 overflow-y-auto">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="border-b border-zinc-800 flex items-center justify-between px-3 group relative"
                    style={{ height: `${trackHeights[track.id] || 80}px` }}
                  >
                    {/* Drag Handle */}
                    <div className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-3 h-3 text-gray-500 cursor-move" />
          </div>
                    
                    <div className={`flex items-center gap-2 flex-1 min-w-0 ml-4 ${track.muted ? 'opacity-60' : ''}`}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: track.muted ? '#6b7280' : track.color }} />
                      <span className={`text-xs font-medium truncate ${track.muted ? 'text-gray-500' : 'text-gray-300'}`}>
                        {track.muted ? `${track.name} (Muted)` : track.name}
                      </span>
        </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Track Volume */}
                      <div className="w-16">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={Math.round(track.volume * 100)}
                          onChange={(e) => handleTrackVolumeChange(track.id, e.target.value)}
                          className={`w-full ${track.muted ? 'opacity-50' : ''}`}
                          style={{
                            background: track.muted 
                              ? 'linear-gradient(to right, #ef4444 0%, #ef4444 100%)'
                              : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${Math.round(track.volume * 100)}%, #71717a ${Math.round(track.volume * 100)}%, #71717a 100%)`
                          }}
                          title={track.muted ? 'Muted' : `Volume: ${Math.round(track.volume * 100)}%`}
                        />
                      </div>

                      <button
                        onClick={() => handleTrackMute(track.id)}
                        className="p-1 hover:bg-zinc-800 rounded"
                        title={track.muted ? 'Unmute' : 'Mute'}
                      >
                        {track.muted ? <VolumeX className="w-3 h-3 text-gray-500" /> : <Volume2 className="w-3 h-3 text-gray-400" />}
                      </button>
                      
                      <button
                        onClick={() => updateTrack(track.id, { locked: !track.locked })}
                        className="p-1 hover:bg-zinc-800 rounded"
                        title={track.locked ? 'Unlock' : 'Lock'}
                      >
                        {track.locked ? <Lock className="w-3 h-3 text-gray-500" /> : <Unlock className="w-3 h-3 text-gray-400" />}
                      </button>
                      
                      {/* Track Height Controls */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => setTrackHeights(prev => ({ ...prev, [track.id]: Math.min(200, (prev[track.id] || 80) + 10) }))}
                          className="p-0.5 hover:bg-zinc-800 rounded"
                          title="Increase Height"
                        >
                          <ChevronUp className="w-2 h-2 text-gray-400" />
                        </button>
                        <button
                          onClick={() => setTrackHeights(prev => ({ ...prev, [track.id]: Math.max(40, (prev[track.id] || 80) - 10) }))}
                          className="p-0.5 hover:bg-zinc-800 rounded"
                          title="Decrease Height"
                        >
                          <ChevronDownIcon className="w-2 h-2 text-gray-400" />
              </button>
      </div>
                      
                      {/* Duplicate Track */}
                      <button
                        onClick={() => {
                          const trackClips = clips.filter(clip => clip.trackId === track.id)
                          const newTrack = {
                            name: `${track.name} (Copy)`,
                            type: track.type,
                            muted: track.muted,
                            locked: false,
                            volume: track.volume,
                            color: track.color
                          }
                          addTrack(newTrack)
                          
                          // Get the new track ID from the store after adding
                          const store = useVideoEditorStore.getState()
                          const newTracks = store.tracks
                          const newTrackId = newTracks[newTracks.length - 1].id
                          
                          // Duplicate all clips from this track to the new track
                          trackClips.forEach(clip => {
                            const newClip = {
                              trackId: newTrackId,
                              name: `${clip.name} (Copy)`,
                              type: clip.type,
                              startTime: clip.startTime,
                              endTime: clip.endTime,
                              duration: clip.duration,
                              url: clip.url,
                              waveform: clip.waveform
                            }
                            addClip(newClip)
                          })
                          
                          // Save to history after duplicate track operation
                          store.saveToHistory()
                        }}
                        className="p-1 hover:bg-blue-900/50 rounded"
                        title="Duplicate Track"
                      >
                        <Copy className="w-3 h-3 text-blue-400" />
                      </button>
                      
                      {/* Delete Track */}
                      {tracks.length > 1 && (
                        <button
                          onClick={() => handleDeleteTrack(track.id)}
                          className="p-1 hover:bg-red-900/50 rounded"
                          title="Delete Track"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline Tracks */}
              <div ref={timelineRef} className="flex-1 overflow-auto relative" onClick={handleTimelineClick}>
                <div className="relative" style={{ width: timelineWidth, minHeight: '100%' }}>
                  {/* Time Ruler */}
                  <div className="sticky top-0 h-8 bg-zinc-900 border-b border-zinc-800 z-20">
                    {timeMarkers.map((marker) => (
                      <div
                        key={marker.time}
                        className="absolute top-0 h-full"
                        style={{ left: marker.position }}
                      >
                        <div className="w-px h-full bg-zinc-700" />
                        <div className="absolute top-1 left-1 text-xs text-gray-500 font-mono">
                          {marker.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tracks */}
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className="relative border-b border-zinc-800 bg-zinc-950"
                      style={{ height: `${trackHeights[track.id] || 80}px` }}
                    >
                      {/* Track Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="w-full h-full" style={{
                          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent ${pixelsPerSecond - 1}px, #71717a ${pixelsPerSecond}px)`
                        }} />
                      </div>

                      {/* Clips on track */}
                      {clips
                        .filter(clip => clip.trackId === track.id)
                        .map((clip) => {
                          const clipWidth = (clip.endTime - clip.startTime) * pixelsPerSecond
                          const isSelected = selectedClipId === clip.id
                          const isDraggingThis = draggedClip === clip.id
                          
                          return (
                            <div
                              key={clip.id}
                              data-clip-id={clip.id}
                              className={`absolute top-1 bottom-1 rounded-lg overflow-hidden transition-all ${
                                cutMode 
                                  ? 'cursor-crosshair' 
                                  : 'cursor-move'
                              } ${
                                isSelected
                                  ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/50'
                                  : 'hover:ring-2 hover:ring-gray-400 hover:shadow-md'
                              } ${isDraggingThis ? 'opacity-80 scale-105' : ''} ${
                                cutMode ? 'hover:ring-2 hover:ring-red-500' : ''
                              }`}
                              style={{
                                left: clip.startTime * pixelsPerSecond,
                                width: Math.max(clipWidth, 40),
                                backgroundColor: track.color + 'CC'
                              }}
                              onMouseDown={(e) => handleClipMouseDown(e, clip.id)}
                              onClick={(e) => e.stopPropagation()}
                              onContextMenu={(e) => handleContextMenu(e, clip.id)}
                            >
                              {/* Clip Thumbnail */}
                              <div className="absolute left-0 top-0 w-8 h-full">
                                <ClipThumbnail clip={clip} />
                              </div>
                              
                              {/* Waveform for audio clips */}
                              {track.type === 'audio' && (
                                <Waveform 
                                  width={clipWidth - 8} 
                                  height={trackHeights[track.id] || 80} 
                                  waveform={clip.waveform}
                                />
                              )}
                              
                              {/* Clip Content */}
                              <div className="relative z-10 px-2 py-1 h-full ml-8 flex flex-col justify-center">
                                <p className="text-xs font-semibold text-white truncate">{clip.name}</p>
                                <p className="text-xs text-white/70 capitalize">{clip.type}</p>
                                <p className="text-xs text-white/50">
                                  {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                                </p>
                              </div>

                              {/* Resize Handles */}
                              <div 
                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors"
                                onMouseDown={(e) => handleResizeStart(e, clip.id, 'left')}
                              />
                              <div 
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors"
                                onMouseDown={(e) => handleResizeStart(e, clip.id, 'right')}
                              />

                              {/* Clip Actions (on hover) */}
                              <div className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity flex gap-1">
                                {/* Duplicate Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const clipToDuplicate = clips.find(c => c.id === clip.id)
                                    if (!clipToDuplicate) return
                                    
                                    const newClip = {
                                      trackId: clipToDuplicate.trackId,
                                      name: `${clipToDuplicate.name} (Copy)`,
                                      type: clipToDuplicate.type,
                                      startTime: clipToDuplicate.endTime + 0.1,
                                      endTime: clipToDuplicate.endTime + 0.1 + (clipToDuplicate.endTime - clipToDuplicate.startTime),
                                      duration: clipToDuplicate.duration,
                                      url: clipToDuplicate.url,
                                      waveform: clipToDuplicate.waveform
                                    }
                                    
                                    addClip(newClip)
                                    
                                    // Save to history after duplicate operation
                                    const store = useVideoEditorStore.getState()
                                    store.saveToHistory()
                                  }}
                                  className="p-1 bg-blue-600/80 rounded hover:bg-blue-600 transition-colors"
                                  title="Duplicate Clip"
                                >
                                  <Copy className="w-3 h-3 text-white" />
                                </button>
                                
                                {/* Delete Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeClip(clip.id)
                                    
                                    // Save to history after delete operation
                                    const store = useVideoEditorStore.getState()
                                    store.saveToHistory()
                                  }}
                                  className="p-1 bg-red-600/80 rounded hover:bg-red-600 transition-colors"
                                  title="Delete Clip"
                                >
                                  <Trash2 className="w-3 h-3 text-white" />
                                </button>
                                
                                {/* More Options Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleContextMenu(e, clip.id)
                                  }}
                                  className="p-1 bg-black/50 rounded hover:bg-black/70 transition-colors"
                                  title="More Options"
                                >
                                  <MoreHorizontal className="w-3 h-3 text-white" />
                                </button>
                              </div>
    </div>
  )
                        })}
                    </div>
                  ))}

                  {/* Empty Timeline State */}
                  {clips.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center text-gray-500 space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gray-800 rounded-2xl flex items-center justify-center">
                          <Video className="w-10 h-10 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-400 mb-2">Timeline is empty</p>
                          <p className="text-sm text-gray-600 max-w-xs">
                            Upload video files or drag & drop media here to start editing
                          </p>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={handleUploadClick}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 mx-auto pointer-events-auto"
                          >
                            <Upload className="w-4 h-4" />
                            Upload Media
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Playhead */}
                  <div
                    className={`absolute top-0 w-0.5 h-full bg-red-500 z-30 transition-all duration-100 ${
                      isPlayheadDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    style={{ left: playheadPosition }}
                    onMouseDown={handlePlayheadMouseDown}
                  >
                    <div 
                      className={`absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-sm transition-all duration-100 ${
                        isPlayheadDragging ? 'scale-110 shadow-lg' : 'hover:scale-105'
                      }`}
                    />
                    
                    {/* Time tooltip when dragging */}
                    {isPlayheadDragging && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {formatTime(dragTime)}
                      </div>
                    )}
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>

        {/* Right Sidebar */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex border-b border-zinc-800 bg-zinc-900">
                {[
                  { id: 'properties', label: 'Properties' },
                  { id: 'adjustments', label: 'Adjust' },
                  { id: 'filters', label: 'Filters' },
                  { id: 'ai-assistant', label: 'AI Assistant', icon: <Sparkles className="w-3 h-3" /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRightTab(tab.id as any)}
                    className={`flex-1 px-2 py-3 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-1 ${
                      activeRightTab === tab.id
                        ? 'text-white border-white'
                        : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden p-4">
                {activeRightTab === 'properties' && (
                  <div className="space-y-4">
                    {selectedClipId ? (() => {
                      const selectedClip = clips.find(clip => clip.id === selectedClipId)
                      if (!selectedClip) return null
                      
                      return (
                        <>
                          <div>
                            <label className="text-xs text-gray-500 block mb-2">Clip Name</label>
                            <input 
                              type="text" 
                              value={selectedClip.name}
                              onChange={(e) => updateClip(selectedClipId, { name: e.target.value })}
                              className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-white"
                            />
                          </div>
                          
                          {/* Reset Button */}
                          <div className="pt-3 pb-4 border-t border-zinc-800">
                            <button
                              onClick={() => {
                                setVideoTools({
                                  cropWidth: 100,
                                  cropHeight: 100,
                                  rotation: 0,
                                  opacity: 100,
                                  speed: 1,
                                  volume: 1,
                                  positionX: 0,
                                  positionY: 0
                                })
                              }}
                              className="w-full px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-zinc-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Reset All Properties
                            </button>
                          </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-2">Scale: {videoTools.cropWidth}%</label>
                          <input 
                            type="range" 
                            min="10" 
                            max="200" 
                            value={videoTools.cropWidth}
                            onChange={(e) => setVideoTools({...videoTools, cropWidth: parseInt(e.target.value), cropHeight: parseInt(e.target.value)})}
                            className="w-full accent-white" 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-2">Rotation: {videoTools.rotation || 0}°</label>
                          <input 
                            type="range" 
                            min="-180" 
                            max="180" 
                            value={videoTools.rotation || 0}
                            onChange={(e) => setVideoTools({...videoTools, rotation: parseInt(e.target.value)})}
                            className="w-full accent-white" 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-2">Opacity: {videoTools.opacity || 100}%</label>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={videoTools.opacity || 100}
                            onChange={(e) => setVideoTools({...videoTools, opacity: parseInt(e.target.value)})}
                            className="w-full accent-white" 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-2">Speed: {videoTools.speed}x</label>
                          <input 
                            type="range" 
                            min="0.25" 
                            max="4" 
                            step="0.25" 
                            value={videoTools.speed}
                            onChange={(e) => setVideoTools({...videoTools, speed: parseFloat(e.target.value)})}
                            className="w-full accent-white" 
                          />
                        </div>
                        </>
                      )
                    })() : (
                      <div className="text-center py-8 text-gray-500 text-sm space-y-4">
                        <div className="w-16 h-16 mx-auto bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                          <Video className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="font-medium">No clip selected</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Upload a video file or drag & drop media to the timeline, then click on a clip to edit its properties.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={handleUploadClick}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2 mx-auto"
                          >
                            <Upload className="w-4 h-4" />
                            Upload Media
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeRightTab === 'adjustments' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Video Adjustments</h3>
                      <button
                        onClick={() => setAdjustments({
                          brightness: 0,
                          contrast: 0,
                          saturation: 0,
                          exposure: 0,
                          hue: 0,
                          blur: 0,
                          sharpen: 0,
                          filmGrain: 0,
                          vignette: 0
                        })}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        <Undo className="w-3 h-3" />
                        Reset All
                      </button>
                    </div>

                    {/* Basic Adjustments */}
                    <div className="space-y-5">
                      <div className="border-b border-zinc-800 pb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Basic Adjustments
                        </h4>
                        
                        <div className="space-y-4">
                          {/* Brightness */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-gray-300 flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                Brightness
                              </label>
                              <span className="text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded">
                                {adjustments.brightness > 0 ? '+' : ''}{adjustments.brightness}
                              </span>
                            </div>
                            <div className="relative">
                              <input 
                                type="range" 
                                min="-100" 
                                max="100" 
                                value={adjustments.brightness}
                                onChange={(e) => setAdjustments({...adjustments, brightness: parseInt(e.target.value)})}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #374151 0%, #374151 ${(adjustments.brightness + 100) / 2}%, #6b7280 ${(adjustments.brightness + 100) / 2}%, #6b7280 100%)`
                                }}
                              />
                            </div>
                          </div>

                          {/* Contrast */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-gray-300 flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-br from-gray-600 to-gray-800 rounded flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                Contrast
                              </label>
                              <span className="text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded">
                                {adjustments.contrast > 0 ? '+' : ''}{adjustments.contrast}
                              </span>
                            </div>
                            <div className="relative">
                              <input 
                                type="range" 
                                min="-100" 
                                max="100" 
                                value={adjustments.contrast}
                                onChange={(e) => setAdjustments({...adjustments, contrast: parseInt(e.target.value)})}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #374151 0%, #374151 ${(adjustments.contrast + 100) / 2}%, #6b7280 ${(adjustments.contrast + 100) / 2}%, #6b7280 100%)`
                                }}
                              />
                            </div>
                          </div>

                          {/* Saturation */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-gray-300 flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                Saturation
                              </label>
                              <span className="text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded">
                                {adjustments.saturation > 0 ? '+' : ''}{adjustments.saturation}
                              </span>
                            </div>
                            <div className="relative">
                              <input 
                                type="range" 
                                min="-100" 
                                max="100" 
                                value={adjustments.saturation}
                                onChange={(e) => setAdjustments({...adjustments, saturation: parseInt(e.target.value)})}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #374151 0%, #374151 ${(adjustments.saturation + 100) / 2}%, #6b7280 ${(adjustments.saturation + 100) / 2}%, #6b7280 100%)`
                                }}
                              />
                            </div>
                          </div>

                          {/* Exposure */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-gray-300 flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                Exposure
                              </label>
                              <span className="text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded">
                                {adjustments.exposure > 0 ? '+' : ''}{adjustments.exposure}
                              </span>
                            </div>
                            <div className="relative">
                              <input 
                                type="range" 
                                min="-100" 
                                max="100" 
                                value={adjustments.exposure}
                                onChange={(e) => setAdjustments({...adjustments, exposure: parseInt(e.target.value)})}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #374151 0%, #374151 ${(adjustments.exposure + 100) / 2}%, #6b7280 ${(adjustments.exposure + 100) / 2}%, #6b7280 100%)`
                                }}
                              />
                            </div>
                          </div>

                          {/* Hue */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-gray-300 flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 rounded flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                Hue
                              </label>
                              <span className="text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded">
                                {adjustments.hue > 0 ? '+' : ''}{adjustments.hue}°
                              </span>
                            </div>
                            <div className="relative">
                              <input 
                                type="range" 
                                min="-180" 
                                max="180" 
                                value={adjustments.hue}
                                onChange={(e) => setAdjustments({...adjustments, hue: parseInt(e.target.value)})}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #374151 0%, #374151 ${(adjustments.hue + 180) / 3.6}%, #6b7280 ${(adjustments.hue + 180) / 3.6}%, #6b7280 100%)`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Effects */}
                      <div className="border-b border-zinc-800 pb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Visual Effects
                        </h4>
                        
                        <div className="space-y-4">
                          {/* Blur */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-gray-300 flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                                </div>
                                Blur
                              </label>
                              <span className="text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded">
                                {adjustments.blur}px
                              </span>
                            </div>
                            <div className="relative">
                              <input 
                                type="range" 
                                min="0" 
                                max="20" 
                                value={adjustments.blur}
                                onChange={(e) => setAdjustments({...adjustments, blur: parseInt(e.target.value)})}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #374151 0%, #374151 ${adjustments.blur * 5}%, #6b7280 ${adjustments.blur * 5}%, #6b7280 100%)`
                                }}
                              />
                            </div>
                          </div>

                          {/* Sharpen */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-gray-300 flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                Sharpen
                              </label>
                              <span className="text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded">
                                {adjustments.sharpen}%
                              </span>
                            </div>
                            <div className="relative">
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={adjustments.sharpen}
                                onChange={(e) => setAdjustments({...adjustments, sharpen: parseInt(e.target.value)})}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #374151 0%, #374151 ${adjustments.sharpen}%, #6b7280 ${adjustments.sharpen}%, #6b7280 100%)`
                                }}
                              />
                            </div>
                          </div>

                          {/* Film Grain */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-gray-300 flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-br from-amber-600 to-orange-700 rounded flex items-center justify-center">
                                  <div className="w-1 h-1 bg-white rounded-full"></div>
                                  <div className="w-1 h-1 bg-white rounded-full ml-1"></div>
                                </div>
                                Film Grain
                              </label>
                              <span className="text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded">
                                {adjustments.filmGrain}%
                              </span>
                            </div>
                            <div className="relative">
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={adjustments.filmGrain}
                                onChange={(e) => setAdjustments({...adjustments, filmGrain: parseInt(e.target.value)})}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #374151 0%, #374151 ${adjustments.filmGrain}%, #6b7280 ${adjustments.filmGrain}%, #6b7280 100%)`
                                }}
                              />
                            </div>
                          </div>

                          {/* Vignette */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm text-gray-300 flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full opacity-30"></div>
                                </div>
                                Vignette
                              </label>
                              <span className="text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded">
                                {adjustments.vignette}%
                              </span>
                            </div>
                            <div className="relative">
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={adjustments.vignette}
                                onChange={(e) => setAdjustments({...adjustments, vignette: parseInt(e.target.value)})}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #374151 0%, #374151 ${adjustments.vignette}%, #6b7280 ${adjustments.vignette}%, #6b7280 100%)`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Quick Presets
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setAdjustments({
                              brightness: 10,
                              contrast: 15,
                              saturation: 20,
                              exposure: 5,
                              hue: 0,
                              blur: 0,
                              sharpen: 0,
                              filmGrain: 0,
                              vignette: 0
                            })}
                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Vibrant
                          </button>
                          <button
                            onClick={() => setAdjustments({
                              brightness: -10,
                              contrast: 25,
                              saturation: -20,
                              exposure: -5,
                              hue: 0,
                              blur: 0,
                              sharpen: 10,
                              filmGrain: 0,
                              vignette: 0
                            })}
                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Moody
                          </button>
                          <button
                            onClick={() => setAdjustments({
                              brightness: 20,
                              contrast: 10,
                              saturation: -30,
                              exposure: 10,
                              hue: 0,
                              blur: 0,
                              sharpen: 0,
                              filmGrain: 0,
                              vignette: 0
                            })}
                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Vintage
                          </button>
                          <button
                            onClick={() => setAdjustments({
                              brightness: 0,
                              contrast: 30,
                              saturation: 0,
                              exposure: 0,
                              hue: 0,
                              blur: 0,
                              sharpen: 20,
                              filmGrain: 0,
                              vignette: 0
                            })}
                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Sharp
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {activeRightTab === 'filters' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Video Filters</h3>
                      {activeFilters.length > 0 && (
                        <button
                          onClick={() => setActiveFilters([])}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear All
                        </button>
                      )}
                    </div>

                    {/* Filter Categories */}
                    <div className="space-y-5">
                      {/* Color Filters */}
                      <div className="border-b border-zinc-800 pb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                          Color Filters
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { name: 'Sepia', icon: '🟤', desc: 'Warm brown tone', filter: 'sepia(100%)' },
                            { name: 'Grayscale', icon: '⚫', desc: 'Black & white', filter: 'grayscale(100%)' },
                            { name: 'Vintage', icon: '📷', desc: 'Retro look', filter: 'sepia(50%) contrast(1.2) brightness(0.9)' },
                            { name: 'Cool', icon: '❄️', desc: 'Blue tint', filter: 'hue-rotate(180deg) saturate(1.2)' },
                            { name: 'Warm', icon: '🔥', desc: 'Orange tint', filter: 'hue-rotate(30deg) saturate(1.3)' },
                            { name: 'High Contrast', icon: '⚡', desc: 'Enhanced contrast', filter: 'contrast(2) brightness(0.9)' }
                          ].map((filter) => (
                            <button
                              key={filter.name}
                              onClick={() => {
                                if (activeFilters.includes(filter.name)) {
                                  setActiveFilters(activeFilters.filter(f => f !== filter.name))
                                } else {
                                  setActiveFilters([...activeFilters, filter.name])
                                }
                              }}
                              className={`p-3 rounded-lg text-sm transition-all duration-200 ${
                                activeFilters.includes(filter.name)
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 hover:scale-105'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{filter.icon}</span>
                                <span className="font-medium">{filter.name}</span>
                                {activeFilters.includes(filter.name) && (
                                  <div className="ml-auto w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-xs">✓</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs opacity-75">{filter.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Style Filters */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Style Filters
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { name: 'Dramatic', icon: '🎭', desc: 'Intense mood', filter: 'contrast(1.5) brightness(0.8) saturate(1.2)' },
                            { name: 'Soft', icon: '☁️', desc: 'Gentle blur', filter: 'blur(1px) brightness(1.1)' }
                          ].map((filter) => (
                            <button
                              key={filter.name}
                              onClick={() => {
                                if (activeFilters.includes(filter.name)) {
                                  setActiveFilters(activeFilters.filter(f => f !== filter.name))
                                } else {
                                  setActiveFilters([...activeFilters, filter.name])
                                }
                              }}
                              className={`p-3 rounded-lg text-sm transition-all duration-200 ${
                                activeFilters.includes(filter.name)
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 hover:scale-105'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{filter.icon}</span>
                                <span className="font-medium">{filter.name}</span>
                                {activeFilters.includes(filter.name) && (
                                  <div className="ml-auto w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-xs">✓</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs opacity-75">{filter.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active Filters Summary */}
                      {activeFilters.length > 0 && (
                        <div className="bg-zinc-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-white">Active Filters ({activeFilters.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeFilters.map((filter) => (
                              <div
                                key={filter}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg flex items-center gap-2"
                              >
                                <span>{filter}</span>
                                <button
                                  onClick={() => setActiveFilters(activeFilters.filter(f => f !== filter))}
                                  className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                                >
                                  <span className="text-xs">×</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeRightTab === 'ai-assistant' && (
                  <div className="h-full flex flex-col -m-4">
                    <VideoEditorAI isOpen={true} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50"
              style={{ left: (contextMenuPos?.x ?? contextMenu.x), top: (contextMenuPos?.y ?? contextMenu.y) }}
              ref={contextMenuRef}
            >
              <button
                onClick={handleSplitClip}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-3"
              >
                <Scissors className="w-4 h-4" />
                Split at Playhead
              </button>
              <button
                onClick={handleDuplicateClip}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-3"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <div className="border-t border-zinc-700" />
              <button
                onClick={handleDeleteClip}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VEdit2.0 AI Assistant - Bottom Left */}
      <VideoEditorVAPIAssistant />

      {/* Export Panel */}
      {showExportPanel && (
        <ExportPanel
          projectId={projectName || 'default-project'}
          duration={duration}
          onClose={() => setShowExportPanel(false)}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
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
            className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-zinc-700">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-xl">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Playback</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Space</span>
                    <span className="text-white">Play/Pause</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">← →</span>
                    <span className="text-white">Skip 1s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shift + ← →</span>
                    <span className="text-white">Fine control (0.1s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">M</span>
                    <span className="text-white">Mute/Unmute</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-3">Editing</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">C</span>
                    <span className="text-white">Toggle Cut Mode</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">X</span>
                    <span className="text-white">Split Clip</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">D</span>
                    <span className="text-white">Duplicate Clip</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Delete</span>
                    <span className="text-white">Delete Clip</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-3">General</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">G</span>
                    <span className="text-white">Toggle Grid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">S</span>
                    <span className="text-white">Save Project</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ctrl+Z</span>
                    <span className="text-white">Undo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ctrl+Y</span>
                    <span className="text-white">Redo</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  )
}

export default VideoEditor
