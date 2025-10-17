// Shared Video Context Interface
export interface VideoContext {
  currentTime: number
  duration: number
  clipsCount: number
  selectedClip: string | null
  clips: any[]
  tracks: any[]
  playbackState: 'playing' | 'paused'
  currentEffects: any
}
