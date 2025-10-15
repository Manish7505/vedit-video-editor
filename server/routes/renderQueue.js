const express = require('express')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const router = express.Router()

// Ensure output directory exists
const videosDir = path.join(__dirname, '..', 'uploads', 'videos')
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true })
}

// In-memory job store (simple process-local queue)
const jobs = new Map()

// Utility to parse ffmpeg stderr for time progress (format: time=00:00:12.34)
function parseFfmpegTime(stderr) {
  const match = /time=(\d+):(\d+):(\d+\.?\d*)/.exec(stderr)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  return hours * 3600 + minutes * 60 + seconds
}

// POST /api/render/start
// Body: { clips: [{ url, startTime?, endTime? }], duration?, preset?, burnInCaptions?, srtContent? }
router.post('/render/start', async (req, res) => {
  try {
    const { clips = [], duration = 0, preset, burnInCaptions = false, srtContent } = req.body || {}
    if (!Array.isArray(clips) || clips.length === 0) {
      return res.status(400).json({ ok: false, error: 'clips[] required' })
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const ts = Date.now()
    const outFile = `render_${ts}.mp4`
    const outPath = path.join(videosDir, outFile)

    // Optional: if we need to write SRT to a temp file for burn-in
    let tempSrtPath = null
    if (burnInCaptions && typeof srtContent === 'string' && srtContent.trim()) {
      const srtFile = `captions_${ts}.srt`
      tempSrtPath = path.join(videosDir, srtFile)
      fs.writeFileSync(tempSrtPath, srtContent, 'utf8')
    }

    // Build args similar to existing render route but concat only
    const args = ['-y']
    clips.forEach((c) => {
      const cStart = Number(c.startTime || 0)
      const cEnd = Number(c.endTime || 0)
      const hasRange = cEnd > 0 && cEnd > cStart
      if (hasRange) args.push('-ss', String(cStart))
      args.push('-i', c.url)
      if (hasRange) args.push('-to', String(cEnd))
    })
    const n = clips.length
    const inputs = Array.from({ length: n }).map((_, i) => `[${i}:v][${i}:a]`).join('')
    const concat = `${inputs}concat=n=${n}:v=1:a=1[v][a]`

    // Build filter_complex with optional scaling/cropping and subtitles
    const vfSegments = ['[v]']
    // Presets
    if (preset === 'tiktok_9_16') {
      // Convert to 1080x1920 with smart scale+pad
      vfSegments.push('scale=w=1080:h=1920:force_original_aspect_ratio=decrease')
      vfSegments.push('pad=1080:1920:(1080-iw)/2:(1920-ih)/2:black')
    } else if (preset === 'instagram_square') {
      // Convert to 1080x1080 square
      vfSegments.push('scale=w=1080:h=1080:force_original_aspect_ratio=decrease')
      vfSegments.push('pad=1080:1080:(1080-iw)/2:(1080-ih)/2:black')
    } else if (preset === 'youtube') {
      // Ensure 1920x1080 canvas
      vfSegments.push('scale=w=1920:h=1080:force_original_aspect_ratio=decrease')
      vfSegments.push('pad=1920:1080:(1920-iw)/2:(1080-ih)/2:black')
    }

    // Subtitles burn-in
    if (tempSrtPath) {
      // Use subtitles filter; escape path if needed
      const subPath = tempSrtPath.replace(/\\/g, '/').replace(/:/g, '\\\:')
      vfSegments.push(`subtitles='${subPath}'`)
    }

    const complex = vfSegments.length > 1
      ? `${concat};${vfSegments.join(',')}[vout]`
      : concat

    args.push('-filter_complex', complex)
    args.push('-map', vfSegments.length > 1 ? '[vout]' : '[v]', '-map', '[a]')

    // Codec/bitrate based on preset
    if (preset === 'lossless') {
      args.push('-c:v', 'libx264', '-crf', '0', '-preset', 'veryslow', '-pix_fmt', 'yuv420p')
    } else if (preset === 'youtube') {
      args.push('-c:v', 'libx264', '-b:v', '8000k', '-pix_fmt', 'yuv420p')
    } else if (preset === 'tiktok_9_16') {
      args.push('-c:v', 'libx264', '-b:v', '5000k', '-pix_fmt', 'yuv420p')
    } else if (preset === 'instagram_square') {
      args.push('-c:v', 'libx264', '-b:v', '5000k', '-pix_fmt', 'yuv420p')
    } else {
      args.push('-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p')
    }

    args.push('-c:a', 'aac', '-movflags', '+faststart', outPath)

    const ff = spawn('ffmpeg', args)

    const job = {
      id: jobId,
      status: 'running',
      progress: 0,
      duration: Number(duration) || null,
      stderr: '',
      url: null,
      startedAt: Date.now(),
      finishedAt: null
    }
    jobs.set(jobId, job)

    ff.stderr.on('data', (d) => {
      const chunk = d.toString()
      job.stderr += chunk
      const current = parseFfmpegTime(chunk)
      if (current && job.duration) {
        const pct = Math.max(0, Math.min(100, Math.round((current / job.duration) * 100)))
        job.progress = pct
      }
    })

    ff.on('close', (code) => {
      job.finishedAt = Date.now()
      if (code === 0 && fs.existsSync(outPath)) {
        job.status = 'completed'
        job.progress = 100
        job.url = `/uploads/videos/${outFile}`
      } else {
        job.status = 'failed'
      }
      // Cleanup temp srt if created
      if (tempSrtPath && fs.existsSync(tempSrtPath)) {
        try { fs.unlinkSync(tempSrtPath) } catch {}
      }
    })

    return res.json({ ok: true, jobId })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// GET /api/render/status/:jobId
router.get('/render/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId)
  if (!job) return res.status(404).json({ ok: false, error: 'job not found' })
  return res.json({ ok: true, job })
})

module.exports = router


