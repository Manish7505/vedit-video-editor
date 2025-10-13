// Publishing and Social Media Types

export type SocialPlatform = 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'twitter'

export interface SocialMediaAccount {
  id: string
  platform: SocialPlatform
  username: string
  connected: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
}

export interface PublishingSchedule {
  id: string
  projectId: string
  platform: SocialPlatform
  scheduledTime: Date
  status: 'pending' | 'processing' | 'published' | 'failed'
  content: PublishingContent
  createdAt: Date
  publishedAt?: Date
  error?: string
}

export interface PublishingContent {
  title: string
  description: string
  hashtags: string[]
  thumbnail?: string
  videoUrl: string
  visibility: 'public' | 'private' | 'unlisted'
  category?: string
  tags?: string[]
}

export interface AIGeneratedContent {
  captions: string[]
  hashtags: string[]
  titles: string[]
  descriptions: string[]
  thumbnails: string[]
}

export interface ExportJob {
  id: string
  projectId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  resolution: '4k' | '1080p' | '720p' | '480p' | 'mobile'
  format: 'mp4' | 'mov' | 'webm' | 'avi'
  outputUrl?: string
  error?: string
  createdAt: Date
  completedAt?: Date
}

export interface CloudRenderOptions {
  resolution: string
  format: string
  quality: 'high' | 'medium' | 'low'
  fps: number
  codec: string
  bitrate?: string
}

