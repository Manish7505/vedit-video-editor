import { createContext, useContext, ReactNode } from 'react'
import { useVideoEditorStore } from '../stores/videoEditorStore'

interface VideoEditorContextType {
  // Project state
  projectName: string
  setProjectName: (name: string) => void
  
  // Tracks
  tracks: Track[]
  addTrack: (track: Omit<Track, 'id'>) => void
  removeTrack: (id: string) => void
  updateTrack: (id: string, updates: Partial<Track>) => void
  
  // Clips
  clips: Clip[]
  addClip: (clip: Omit<Clip, 'id'>) => void
  removeClip: (id: string) => void
  updateClip: (id: string, updates: Partial<Clip>) => void
  
  // Timeline
  currentTime: number
  setCurrentTime: (time: number) => void
  duration: number
  setDuration: (duration: number) => void
  zoom: number
  setZoom: (zoom: number) => void
  
  // Playback
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  playbackRate: number
  setPlaybackRate: (rate: number) => void
  
  // AI Chat
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
  
  // UI State
  selectedClipId: string | null
  setSelectedClipId: (id: string | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const VideoEditorContext = createContext<VideoEditorContextType | undefined>(undefined)

export const useVideoEditor = () => {
  const context = useContext(VideoEditorContext)
  if (!context) {
    throw new Error('useVideoEditor must be used within a VideoEditorProvider')
  }
  return context
}

interface VideoEditorProviderProps {
  children: ReactNode
}

export const VideoEditorProvider = ({ children }: VideoEditorProviderProps) => {
  const store = useVideoEditorStore()

  const contextValue: VideoEditorContextType = {
    // Project state
    projectName: store.projectName,
    setProjectName: store.setProjectName,
    
    // Tracks
    tracks: store.tracks,
    addTrack: store.addTrack,
    removeTrack: store.removeTrack,
    updateTrack: store.updateTrack,
    
    // Clips
    clips: store.clips,
    addClip: store.addClip,
    removeClip: store.removeClip,
    updateClip: store.updateClip,
    
    // Timeline
    currentTime: store.currentTime,
    setCurrentTime: store.setCurrentTime,
    duration: store.duration,
    setDuration: store.setDuration,
    zoom: store.zoom,
    setZoom: store.setZoom,
    
    // Playback
    isPlaying: store.isPlaying,
    setIsPlaying: store.setIsPlaying,
    playbackRate: store.playbackRate,
    setPlaybackRate: store.setPlaybackRate,
    
    // AI Chat
    chatMessages: store.chatMessages,
    addChatMessage: store.addChatMessage,
    clearChat: store.clearChat,
    
    // UI State
    selectedClipId: store.selectedClipId,
    setSelectedClipId: store.setSelectedClipId,
    sidebarOpen: store.sidebarOpen,
    setSidebarOpen: store.setSidebarOpen,
  }

  return (
    <VideoEditorContext.Provider value={contextValue}>
      {children}
    </VideoEditorContext.Provider>
  )
}

// Types
export interface Track {
  id: string
  name: string
  type: 'video' | 'audio' | 'text' | 'image'
  muted: boolean
  locked: boolean
  volume: number
  color: string
}

export interface Clip {
  id: string
  trackId: string
  name: string
  type: 'video' | 'audio' | 'text' | 'image'
  startTime: number
  endTime: number
  duration: number
  file?: File
  url?: string
  content?: string
  waveform?: number[]
}

export interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  suggestions?: string[]
}
