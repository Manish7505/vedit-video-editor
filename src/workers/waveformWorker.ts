// Simple waveform worker: receives Float32Array PCM data and returns downsampled amplitudes

export interface WaveformRequest {
  id: string
  samples: Float32Array
  targetLength: number
}

export interface WaveformResponse {
  id: string
  waveform: number[]
}

self.onmessage = (e: MessageEvent<WaveformRequest>) => {
  const { id, samples, targetLength } = e.data
  const length = Math.max(32, targetLength || 512)
  const blockSize = Math.max(1, Math.floor(samples.length / length))
  const result: number[] = []
  for (let i = 0; i < length; i++) {
    const start = i * blockSize
    let sum = 0
    let count = 0
    for (let j = 0; j < blockSize && (start + j) < samples.length; j++) {
      sum += Math.abs(samples[start + j])
      count++
    }
    result.push(count ? Math.min(1, sum / count) : 0)
  }
  const resp: WaveformResponse = { id, waveform: result }
  // @ts-ignore
  self.postMessage(resp)
}


