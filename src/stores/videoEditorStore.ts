import { create } from 'zustand'
import { Track, Clip, ChatMessage } from '../contexts/VideoEditorContext'

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
    set((state) => ({ tracks: [...state.tracks, newTrack] }))
  },
  removeTrack: (id) => {
    set((state) => ({
      tracks: state.tracks.filter(track => track.id !== id),
      clips: state.clips.filter(clip => clip.trackId !== id)
    }))
  },
  updateTrack: (id, updates) => {
    set((state) => ({
      tracks: state.tracks.map(track =>
        track.id === id ? { ...track, ...updates } : track
      )
    }))
  },
  
  // Clips
  clips: [],
  addClip: (clip) => {
    const newClip: Clip = {
      ...clip,
      id: `clip-${Date.now()}`
    }
    set((state) => ({ clips: [...state.clips, newClip] }))
  },
  removeClip: (id) => {
    set((state) => ({ clips: state.clips.filter(clip => clip.id !== id) }))
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
}))
