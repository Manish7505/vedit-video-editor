import { create } from 'zustand'
import { Track, Clip, ChatMessage } from '../contexts/VideoEditorContext'

interface HistoryState {
  tracks: Track[]
  clips: Clip[]
  adjustments: Record<string, any>
  activeFilters: string[]
  activeEffects: string[]
  videoTools: Record<string, any>
  textOverlays: Array<{
    id: string
    text: string
    x: number
    y: number
    fontSize: number
    color: string
  }>
  timestamp: number
}

interface VideoEditorState {
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
  
  // Editing States
  adjustments: Record<string, any>
  setAdjustments: (adjustments: Record<string, any>) => void
  activeFilters: string[]
  setActiveFilters: (filters: string[]) => void
  activeEffects: string[]
  setActiveEffects: (effects: string[]) => void
  videoTools: Record<string, any>
  setVideoTools: (tools: Record<string, any>) => void
  textOverlays: Array<{
    id: string
    text: string
    x: number
    y: number
    fontSize: number
    color: string
  }>
  setTextOverlays: (overlays: Array<{
    id: string
    text: string
    x: number
    y: number
    fontSize: number
    color: string
  }>) => void
  
  // Undo/Redo
  history: HistoryState[]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
  saveToHistory: () => void
  undo: () => void
  redo: () => void
  initializeHistory: () => void
}

export const useVideoEditorStore = create<VideoEditorState>((set) => ({
  // Project state
  projectName: 'Untitled Project',
  setProjectName: (name) => set({ projectName: name }),
  
  // Tracks
  tracks: [
    {
      id: 'track-1',
      name: 'Video Track 1',
      type: 'video',
      muted: false,
      locked: false,
      volume: 1,
      color: '#3b82f6'
    },
    {
      id: 'track-2',
      name: 'Audio Track 1',
      type: 'audio',
      muted: false,
      locked: false,
      volume: 1,
      color: '#10b981'
    }
  ],
  addTrack: (track) => {
    const newTrack: Track = {
      ...track,
      id: `track-${Date.now()}`
    }
    set((state) => {
      const newState = { tracks: [...state.tracks, newTrack] }
      return newState
    })
  },
  removeTrack: (id) => {
    set((state) => {
      const newState = {
        tracks: state.tracks.filter(track => track.id !== id),
        clips: state.clips.filter(clip => clip.trackId !== id)
      }
      return newState
    })
  },
  updateTrack: (id, updates) => {
    set((state) => {
      const newState = {
        tracks: state.tracks.map(track =>
          track.id === id ? { ...track, ...updates } : track
        )
      }
      return newState
    })
  },
  
  // Clips
  clips: [],
  addClip: (clip) => {
    const newClip: Clip = {
      ...clip,
      id: `clip-${Date.now()}`
    }
    set((state) => {
      const newState = { clips: [...state.clips, newClip] }
      return newState
    })
  },
  removeClip: (id) => {
    set((state) => {
      const newState = { clips: state.clips.filter(clip => clip.id !== id) }
      return newState
    })
  },
  updateClip: (id, updates) => {
    set((state) => ({
      clips: state.clips.map(clip =>
        clip.id === id ? { ...clip, ...updates } : clip
      )
    }))
  },
  
  // Timeline
  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),
  duration: 60,
  setDuration: (duration) => set({ duration }),
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  
  // Playback
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  playbackRate: 1,
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  
  // AI Chat
  chatMessages: [
    {
      id: 'welcome-1',
      type: 'ai',
      content: "Hello! I'm your AI video editing assistant. I can help you with editing tasks, answer questions, and even control your video editor with voice commands!",
      timestamp: new Date(),
      suggestions: ['How do I add a clip?', 'Show me editing tips', 'Generate captions']
    },
    {
      id: 'welcome-2',
      type: 'ai',
      content: "Try saying 'play video' or 'add clip' to see voice commands in action! You can also ask me about editing techniques, script writing, or any video production questions.",
      timestamp: new Date(),
      suggestions: ['Voice commands help', 'Script writing tips', 'Color grading guide']
    }
  ],
  addChatMessage: (message) => {
    set((state) => ({ chatMessages: [...state.chatMessages, message] }))
  },
  clearChat: () => {
    set({ chatMessages: [] })
  },
  
  // UI State
  selectedClipId: null,
  setSelectedClipId: (id) => set({ selectedClipId: id }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Editing States
  adjustments: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    hue: 0,
    blur: 0,
    sharpen: 0,
    filmGrain: 0,
    vignette: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0,
    vintage: 0,
    warm: 0,
    cool: 0
  },
  setAdjustments: (adjustments) => {
    set({ adjustments })
  },
  activeFilters: [],
  setActiveFilters: (filters) => {
    set({ activeFilters: filters })
  },
  activeEffects: [],
  setActiveEffects: (effects) => {
    set({ activeEffects: effects })
  },
  videoTools: {
    trimStart: 0,
    trimEnd: 0,
    cropX: 0,
    cropY: 0,
    cropWidth: 100,
    cropHeight: 100,
    speed: 1,
    volume: 1,
    rotation: 0,
    opacity: 100
  },
  setVideoTools: (tools) => {
    set({ videoTools: tools })
  },
  textOverlays: [],
  setTextOverlays: (overlays) => {
    set({ textOverlays: overlays })
  },
  
  // Undo/Redo
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  saveToHistory: () => {
    set((state) => {
      const newHistoryState: HistoryState = {
        tracks: JSON.parse(JSON.stringify(state.tracks)),
        clips: JSON.parse(JSON.stringify(state.clips)),
        adjustments: JSON.parse(JSON.stringify(state.adjustments)),
        activeFilters: JSON.parse(JSON.stringify(state.activeFilters)),
        activeEffects: JSON.parse(JSON.stringify(state.activeEffects)),
        videoTools: JSON.parse(JSON.stringify(state.videoTools)),
        textOverlays: JSON.parse(JSON.stringify(state.textOverlays)),
        timestamp: Date.now()
      }
      
      // Remove any history after current index (handle initial state)
      const newHistory = state.historyIndex >= 0 
        ? state.history.slice(0, state.historyIndex + 1)
        : []
      newHistory.push(newHistoryState)
      
      // Limit history to 50 states
      const limitedHistory = newHistory.slice(-50)
      
      return {
        history: limitedHistory,
        historyIndex: limitedHistory.length - 1,
        canUndo: limitedHistory.length > 1,
        canRedo: false
      }
    })
  },
  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1
        const historyState = state.history[newIndex]
        
        return {
          tracks: JSON.parse(JSON.stringify(historyState.tracks)),
          clips: JSON.parse(JSON.stringify(historyState.clips)),
          adjustments: JSON.parse(JSON.stringify(historyState.adjustments)),
          activeFilters: JSON.parse(JSON.stringify(historyState.activeFilters)),
          activeEffects: JSON.parse(JSON.stringify(historyState.activeEffects)),
          videoTools: JSON.parse(JSON.stringify(historyState.videoTools)),
          textOverlays: JSON.parse(JSON.stringify(historyState.textOverlays)),
          historyIndex: newIndex,
          canUndo: newIndex > 0,
          canRedo: true
        }
      }
      return state
    })
  },
  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1
        const historyState = state.history[newIndex]
        
        return {
          tracks: JSON.parse(JSON.stringify(historyState.tracks)),
          clips: JSON.parse(JSON.stringify(historyState.clips)),
          adjustments: JSON.parse(JSON.stringify(historyState.adjustments)),
          activeFilters: JSON.parse(JSON.stringify(historyState.activeFilters)),
          activeEffects: JSON.parse(JSON.stringify(historyState.activeEffects)),
          videoTools: JSON.parse(JSON.stringify(historyState.videoTools)),
          textOverlays: JSON.parse(JSON.stringify(historyState.textOverlays)),
          historyIndex: newIndex,
          canUndo: true,
          canRedo: newIndex < state.history.length - 1
        }
      }
      return state
    })
  },
  initializeHistory: () => {
    set((state) => {
      if (state.history.length === 0) {
        const initialHistoryState: HistoryState = {
          tracks: JSON.parse(JSON.stringify(state.tracks)),
          clips: JSON.parse(JSON.stringify(state.clips)),
          adjustments: JSON.parse(JSON.stringify(state.adjustments)),
          activeFilters: JSON.parse(JSON.stringify(state.activeFilters)),
          activeEffects: JSON.parse(JSON.stringify(state.activeEffects)),
          videoTools: JSON.parse(JSON.stringify(state.videoTools)),
          textOverlays: JSON.parse(JSON.stringify(state.textOverlays)),
          timestamp: Date.now()
        }
        
        return {
          history: [initialHistoryState],
          historyIndex: 0,
          canUndo: false,
          canRedo: false
        }
      }
      return state
    })
  }
}))
