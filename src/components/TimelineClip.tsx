import React from 'react'
import { motion } from 'framer-motion'
import { Play, Volume2, Type, Image as ImageIcon } from 'lucide-react'
import { Clip } from '../contexts/VideoEditorContext'

interface TimelineClipProps {
  clip: Clip
  pixelsPerSecond: number
  trackHeight: number
  isSelected: boolean
  onSelect: () => void
}

const TimelineClip = ({ 
  clip, 
  pixelsPerSecond, 
  trackHeight, 
  isSelected, 
  onSelect 
}: TimelineClipProps) => {

  const clipWidth = clip.duration * pixelsPerSecond
  const clipLeft = clip.startTime * pixelsPerSecond

  const getClipIcon = () => {
    switch (clip.type) {
      case 'video':
        return <Play className="w-3 h-3" />
      case 'audio':
        return <Volume2 className="w-3 h-3" />
      case 'text':
        return <Type className="w-3 h-3" />
      case 'image':
        return <ImageIcon className="w-3 h-3" />
      default:
        return <Play className="w-3 h-3" />
    }
  }

  const getClipColor = () => {
    switch (clip.type) {
      case 'video':
        return 'bg-blue-500'
      case 'audio':
        return 'bg-green-500'
      case 'text':
        return 'bg-purple-500'
      case 'image':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const handleResizeMouseDown = (e: React.MouseEvent, _side: 'left' | 'right') => {
    e.stopPropagation()
    // Handle resize logic here
  }

  return (
    <motion.div
      className={`absolute top-1 bottom-1 rounded cursor-pointer select-none ${
        getClipColor()
      } ${isSelected ? 'ring-2 ring-white shadow-lg' : ''}`}
      style={{
        left: clipLeft,
        width: clipWidth,
        height: trackHeight - 8
      }}
      onMouseDown={handleMouseDown}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Clip Content */}
      <div className="h-full flex items-center px-2 text-white text-xs font-medium">
        <div className="flex items-center space-x-1 flex-1 min-w-0">
          {getClipIcon()}
          <span className="truncate">{clip.name}</span>
        </div>
      </div>

      {/* Resize Handles */}
      {isSelected && (
        <>
          {/* Left Resize Handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize hover:bg-white/80 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
          />
          
          {/* Right Resize Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize hover:bg-white/80 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
          />
        </>
      )}

      {/* Waveform for audio clips */}
      {clip.type === 'audio' && clip.waveform && (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20">
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${clipWidth} 8`}
            preserveAspectRatio="none"
          >
            {clip.waveform.map((amplitude, index) => {
              const x = (index / clip.waveform!.length) * clipWidth
              const height = Math.abs(amplitude) * 8
              return (
                <rect
                  key={index}
                  x={x}
                  y={4 - height / 2}
                  width={1}
                  height={height}
                  fill="white"
                  opacity={0.6}
                />
              )
            })}
          </svg>
        </div>
      )}
    </motion.div>
  )
}

export default TimelineClip
