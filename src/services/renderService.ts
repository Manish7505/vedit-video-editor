import axios from 'axios'

export interface RenderClipInput {
  url: string
  startTime?: number
  endTime?: number
}

export interface RenderRequestBody {
  inputUrl?: string
  clips?: RenderClipInput[]
  start?: number
  end?: number
  brightness?: number
  contrast?: number
  rotate?: number
  text?: string
}

export interface RenderResponse {
  ok: boolean
  url?: string
  file?: string
  error?: string
  details?: string
}

export async function renderClips(body: RenderRequestBody): Promise<RenderResponse> {
  try {
    const res = await axios.post('/api/render', body)
    return res.data as RenderResponse
  } catch (err: any) {
    const data = err?.response?.data
    return {
      ok: false,
      error: data?.error || 'Render request failed',
      details: data?.details
    }
  }
}

export interface StartRenderResponse {
  ok: boolean
  jobId?: string
  error?: string
}

export interface RenderJob {
  id: string
  status: 'running' | 'completed' | 'failed'
  progress: number
  duration: number | null
  url: string | null
  startedAt: number
  finishedAt: number | null
}

export type ExportPreset = 'youtube' | 'tiktok_9_16' | 'instagram_square' | 'lossless'

export interface StartRenderJobBody {
  clips: RenderClipInput[]
  duration?: number
  preset?: ExportPreset
  burnInCaptions?: boolean
  srtContent?: string
}

export async function startRenderJob(body: StartRenderJobBody): Promise<StartRenderResponse> {
  try {
    const res = await axios.post('/api/render/start', body)
    return res.data as StartRenderResponse
  } catch (err: any) {
    const data = err?.response?.data
    return { ok: false, error: data?.error || 'Failed to start render job' }
  }
}

export async function getRenderStatus(jobId: string): Promise<{ ok: boolean; job?: RenderJob; error?: string }> {
  try {
    const res = await axios.get(`/api/render/status/${jobId}`)
    return res.data as { ok: boolean; job?: RenderJob; error?: string }
  } catch (err: any) {
    const data = err?.response?.data
    return { ok: false, error: data?.error || 'Failed to get render status' }
  }
}


