import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Type, Settings, Trash2, Edit3, Play, Pause } from 'lucide-react'

export interface CaptionSegment {
  id: string
  startTime: number
  endTime: number
  text: string
  style: {
    font: string
    size: number
    color: string
    backgroundColor: string
    position: 'top' | 'bottom' | 'center'
    animation: 'fade' | 'slide' | 'typewriter' | 'none'
  }
  showTimestamps?: boolean
  confidence?: number
}

interface CaptionTrackProps {
  captions: CaptionSegment[]
  currentTime: number
  duration: number
  onCaptionUpdate?: (caption: CaptionSegment) => void
  onCaptionDelete?: (captionId: string) => void
  onCaptionAdd?: (caption: Omit<CaptionSegment, 'id'>) => void
  isPlaying?: boolean
  onSeek?: (time: number) => void
}

const CaptionTrack: React.FC<CaptionTrackProps> = ({
  captions,
  currentTime,
  duration,
  onCaptionUpdate,
  onCaptionDelete,
  onCaptionAdd,
  isPlaying = false,
  onSeek
}) => {
  const [selectedCaption, setSelectedCaption] = useState<string | null>(null)
  const [editingCaption, setEditingCaption] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [newCaption, setNewCaption] = useState<Partial<CaptionSegment>>({
    startTime: 0,
    endTime: 5,
    text: '',
    style: {
      font: 'Arial',
      size: 24,
      color: '#FFFFFF',
      backgroundColor: '#000000',
      position: 'bottom',
      animation: 'fade'
    }
  })

  const trackRef = useRef<HTMLDivElement>(null)

  // Calculate position for timeline
  const getPositionFromTime = (time: number) => {
    return (time / duration) * 100
  }

  // Calculate time from position
  const getTimeFromPosition = (position: number) => {
    return (position / 100) * duration
  }

  // Handle caption click
  const handleCaptionClick = (caption: CaptionSegment) => {
    setSelectedCaption(caption.id)
    if (onSeek) {
      onSeek(caption.startTime)
    }
  }

  // Handle caption edit
  const handleCaptionEdit = (caption: CaptionSegment) => {
    setEditingCaption(caption.id)
    setEditingText(caption.text)
  }

  // Save caption edit
  const handleSaveEdit = () => {
    if (editingCaption && onCaptionUpdate) {
      const caption = captions.find(c => c.id === editingCaption)
      if (caption) {
        onCaptionUpdate({
          ...caption,
          text: editingText
        })
      }
    }
    setEditingCaption(null)
    setEditingText('')
  }

  // Cancel caption edit
  const handleCancelEdit = () => {
    setEditingCaption(null)
    setEditingText('')
  }

  // Handle caption delete
  const handleCaptionDelete = (captionId: string) => {
    if (onCaptionDelete) {
      onCaptionDelete(captionId)
    }
    setSelectedCaption(null)
  }

  // Add new caption
  const handleAddCaption = () => {
    if (onCaptionAdd && newCaption.text && newCaption.startTime !== undefined && newCaption.endTime !== undefined) {
      onCaptionAdd({
        startTime: newCaption.startTime,
        endTime: newCaption.endTime,
        text: newCaption.text,
        style: newCaption.style!
      })
      setNewCaption({
        startTime: 0,
        endTime: 5,
        text: '',
        style: {
          font: 'Arial',
          size: 24,
          color: '#FFFFFF',
          backgroundColor: '#000000',
          position: 'bottom',
          animation: 'fade'
        }
      })
    }
  }

  // Get current caption
  const getCurrentCaption = () => {
    return captions.find(caption => 
      currentTime >= caption.startTime && currentTime <= caption.endTime
    )
  }

  const currentCaption = getCurrentCaption()

  return (
    <div className="bg-zinc-900 border-t border-zinc-800">
      {/* Caption Preview */}
      <div className="relative h-20 bg-black flex items-center justify-center">
        {currentCaption && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              fontFamily: currentCaption.style.font,
              fontSize: currentCaption.style.size,
              color: currentCaption.style.color,
              backgroundColor: currentCaption.style.backgroundColor,
              padding: '8px 16px',
              borderRadius: '4px',
              textAlign: 'center',
              maxWidth: '80%',
              wordWrap: 'break-word'
            }}
          >
            {currentCaption.text}
            {currentCaption.showTimestamps && (
              <div className="text-xs opacity-70 mt-1">
                {Math.floor(currentCaption.startTime / 60)}:{(currentCaption.startTime % 60).toFixed(1)} - {Math.floor(currentCaption.endTime / 60)}:{(currentCaption.endTime % 60).toFixed(1)}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Caption Timeline */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-medium text-white">Captions</h3>
            <span className="text-xs text-zinc-500">({captions.length} segments)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Timeline Track */}
        <div className="relative h-12 bg-zinc-800 rounded-lg overflow-hidden mb-4">
          <div className="absolute inset-0 flex items-center">
            {/* Time markers */}
            {Array.from({ length: Math.ceil(duration / 10) }, (_, i) => (
              <div
                key={i}
                className="absolute h-full border-l border-zinc-700"
                style={{ left: `${(i * 10 / duration) * 100}%` }}
              >
                <span className="absolute -top-5 left-1 text-xs text-zinc-500">
                  {Math.floor(i * 10 / 60)}:{(i * 10 % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ))}

            {/* Current time indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${getPositionFromTime(currentTime)}%` }}
            />

            {/* Caption segments */}
            {captions.map((caption) => (
              <motion.div
                key={caption.id}
                className={`absolute h-8 rounded cursor-pointer flex items-center justify-center text-xs font-medium transition-all ${
                  selectedCaption === caption.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
                style={{
                  left: `${getPositionFromTime(caption.startTime)}%`,
                  width: `${getPositionFromTime(caption.endTime - caption.startTime)}%`,
                  minWidth: '20px'
                }}
                onClick={() => handleCaptionClick(caption)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="truncate px-2">
                  {caption.text.length > 20 ? `${caption.text.substring(0, 20)}...` : caption.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Caption List */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {captions.map((caption) => (
            <div
              key={caption.id}
              className={`p-3 rounded-lg border transition-colors ${
                selectedCaption === caption.id
                  ? 'bg-blue-900/20 border-blue-500/50'
                  : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {editingCaption === caption.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-1 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-white text-sm"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 text-green-400 hover:text-green-300"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white text-sm">{caption.text}</p>
                      <p className="text-zinc-400 text-xs">
                        {Math.floor(caption.startTime / 60)}:{(caption.startTime % 60).toFixed(1)} - {Math.floor(caption.endTime / 60)}:{(caption.endTime % 60).toFixed(1)}
                        {caption.confidence && (
                          <span className="ml-2">
                            ({(caption.confidence * 100).toFixed(1)}% confidence)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCaptionEdit(caption)}
                    className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-zinc-400" />
                  </button>
                  <button
                    onClick={() => handleCaptionDelete(caption.id)}
                    className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Caption */}
        <div className="mt-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
          <h4 className="text-sm font-medium text-white mb-3">Add New Caption</h4>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Start (seconds)"
                value={newCaption.startTime || ''}
                onChange={(e) => setNewCaption({ ...newCaption, startTime: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white text-sm"
              />
              <input
                type="number"
                placeholder="End (seconds)"
                value={newCaption.endTime || ''}
                onChange={(e) => setNewCaption({ ...newCaption, endTime: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white text-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Caption text"
              value={newCaption.text || ''}
              onChange={(e) => setNewCaption({ ...newCaption, text: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white text-sm"
            />
            <button
              onClick={handleAddCaption}
              disabled={!newCaption.text || !newCaption.startTime || !newCaption.endTime}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium"
            >
              Add Caption
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CaptionTrack
