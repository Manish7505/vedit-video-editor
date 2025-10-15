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

// POST /api/render
// Body: { inputUrl, start, end, brightness, contrast, rotate, text }
router.post('/render', async (req, res) => {
  try {
    const {
      inputUrl,
      start = 0,
      end = 0,
      brightness = 0,
      contrast = 1,
      rotate = 0,
      text,
      clips
    } = req.body || {}

    // Support single inputUrl or multi-clip concat via clips[]
    if (!inputUrl && (!Array.isArray(clips) || clips.length === 0)) {
      return res.status(400).json({ ok: false, error: 'inputUrl or clips[] is required' })
    }

    const duration = end > start ? (end - start) : 0
    const ts = Date.now()
    const outFile = `render_${ts}.mp4`
    const outPath = path.join(videosDir, outFile)

    // Build filter chain
    const vf = []
    if (rotate) {
      // transpose for multiples of 90; otherwise generic rotate
      const r = Number(rotate)
      if (r % 90 === 0 && (r % 360) !== 0) {
        const map = { 90: '1', 180: '2', 270: '3', '-90': '3' }
        const key = String(((r % 360) + 360) % 360 || 180)
        if (map[key]) vf.push(`transpose=${map[key]}`)
      } else {
        vf.push(`rotate=${(Number(rotate) * Math.PI) / 180}`)
      }
    }
    // eq filter expects brightness in -1..1, contrast >=0
    const b = Math.max(-1, Math.min(1, Number(brightness) / 100))
    const c = Math.max(0, Number(contrast))
    if (b !== 0 || c !== 1) vf.push(`eq=brightness=${b}:contrast=${c}`)
    if (text && String(text).trim()) {
      // drawtext requires fonts on server; use default if available
      vf.push(`drawtext=text='${String(text).replace(/:/g, '\\:').replace(/'/g, "\\'")}':fontcolor=white:fontsize=36:x=(w-tw)/2:y=50`)
    }
    const vfArg = vf.length ? ['-vf', vf.join(',')] : []

    let args = ['-y']

    if (Array.isArray(clips) && clips.length > 0) {
      // Multi-clip concat. Require all clip URLs to be server-accessible (e.g., /uploads/videos/xyz.mp4)
      // Map each clip to an ffmpeg input with optional trim via -ss/-to per input.
      clips.forEach((c) => {
        const cStart = Number(c.startTime || 0)
        const cEnd = Number(c.endTime || 0)
        const hasRange = cEnd > 0 && cEnd > cStart
        if (hasRange) {
          args.push('-ss', String(cStart))
        }
        args.push('-i', c.url)
        if (hasRange) {
          args.push('-to', String(cEnd))
        }
      })

      // Build concat filter graph for video+audio
      const n = clips.length
      const inputs = Array.from({ length: n }).map((_, i) => `[${i}:v][${i}:a]`).join('')
      const concat = `${inputs}concat=n=${n}:v=1:a=1[v][a]`

      // Optional global filters after concat
      const eqFilter = (() => {
        const b = Math.max(-1, Math.min(1, Number(brightness) / 100))
        const c = Math.max(0, Number(contrast))
        return (b !== 0 || c !== 1) ? `,eq=brightness=${b}:contrast=${c}` : ''
      })()
      const rotateFilter = rotate ? `,rotate=${(Number(rotate) * Math.PI) / 180}` : ''
      const textFilter = (text && String(text).trim()) ? `,drawtext=text='${String(text).replace(/:/g, '\\:').replace(/'/g, "\\'")}':fontcolor=white:fontsize=36:x=(w-tw)/2:y=50` : ''

      args.push('-filter_complex', `${concat}${eqFilter}${rotateFilter}${textFilter}`)
      args.push('-map', '[v]', '-map', '[a]')
      args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', outPath)
    } else {
      // Single input path
      args = [
        '-y',
        ...(start ? ['-ss', String(start)] : []),
        '-i', inputUrl,
        ...(duration ? ['-t', String(duration)] : []),
        ...vfArg,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        outPath
      ]
    }

    const ff = spawn('ffmpeg', args)

    let stderr = ''
    ff.stderr.on('data', (d) => { stderr += d.toString() })

    ff.on('close', (code) => {
      if (code === 0 && fs.existsSync(outPath)) {
        const url = `/uploads/videos/${outFile}`
        return res.json({ ok: true, file: outFile, url })
      }
      return res.status(500).json({ ok: false, error: 'FFmpeg failed', details: stderr })
    })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
})

module.exports = router


