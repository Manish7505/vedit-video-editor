import { useState, useRef, useEffect } from 'react'
import { 
  Plus, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  Trash2
} from 'lucide-react'
import { useVideoEditor } from '../contexts/VideoEditorContext'
import TimelineClip from './TimelineClip'

const Timeline = () => {
  const {
    tracks,
    clips,
    currentTime,
    setCurrentTime,
    duration,
    zoom,
    setZoom,
    addTrack,
    removeTrack,
    updateTrack,
    selectedClipId,
    setSelectedClipId
  } = useVideoEditor()

  const timelineRef = useRef<HTMLDivElement>(null)
  const [playheadPosition, setPlayheadPosition] = useState(0)

  // Calculate timeline dimensions
  const timelineWidth = 1200 // Base width
  const pixelsPerSecond = (timelineWidth * zoom) / duration
  const trackHeight = 60

  // Update playhead position
  useEffect(() => {
    setPlayheadPosition(currentTime * pixelsPerSecond)
  }, [currentTime, pixelsPerSecond])

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const time = x / pixelsPerSecond
      setCurrentTime(Math.max(0, Math.min(time, duration)))
    }
  }

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.1, Math.min(5, zoom + delta * 0.1))
    setZoom(newZoom)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Generate time markers
  const timeMarkers = []
  const markerInterval = zoom > 2 ? 1 : zoom > 1 ? 5 : 10 // seconds
  for (let i = 0; i <= duration; i += markerInterval) {
    timeMarkers.push({
      time: i,
      position: i * pixelsPerSecond,
      label: formatTime(i)
    })
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-800">
      {/* Timeline Header */}
      <div className="h-12 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Timeline</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleZoom(-1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
            >
              -
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
            >
              +
            </button>
          </div>
        </div>
        
        <button
          onClick={() => addTrack({ 
            name: `Track ${tracks.length + 1}`, 
            type: 'video', 
            muted: false, 
            locked: false, 
            volume: 1, 
            color: '#3b82f6' 
          })}
          className="flex items-center space-x-2 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Track</span>
        </button>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Labels */}
        <div className="w-48 border-r border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="h-15 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between px-3"
              style={{ height: trackHeight }}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: track.color }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {track.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => updateTrack(track.id, { muted: !track.muted })}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-dark-700 rounded"
                >
                  {track.muted ? (
                    <VolumeX className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <button
                  onClick={() => updateTrack(track.id, { locked: !track.locked })}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-dark-700 rounded"
                >
                  {track.locked ? (
                    <Lock className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Unlock className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <button
                  onClick={() => removeTrack(track.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-dark-700 rounded"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Area */}
        <div className="flex-1 relative overflow-x-auto">
          <div
            ref={timelineRef}
            className="relative h-full cursor-pointer"
            onClick={handleTimelineClick}
            style={{ width: timelineWidth }}
          >
            {/* Time Markers */}
            <div className="absolute top-0 left-0 w-full h-8 bg-gray-100 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
              {timeMarkers.map((marker) => (
                <div
                  key={marker.time}
                  className="absolute top-0 h-full flex flex-col justify-center"
                  style={{ left: marker.position }}
                >
                  <div className="w-px h-full bg-gray-300 dark:bg-dark-500" />
                  <div className="absolute top-1 left-1 text-xs text-gray-600 dark:text-gray-300">
                    {marker.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Tracks */}
            <div className="pt-8">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="relative border-b border-gray-200 dark:border-dark-700"
                  style={{ height: trackHeight }}
                >
                  {/* Track Background */}
                  <div className="absolute inset-0 bg-gray-50 dark:bg-dark-800" />
                  
                  {/* Clips on this track */}
                  {clips
                    .filter(clip => clip.trackId === track.id)
                    .map((clip) => (
                      <TimelineClip
                        key={clip.id}
                        clip={clip}
                        pixelsPerSecond={pixelsPerSecond}
                        trackHeight={trackHeight}
                        isSelected={selectedClipId === clip.id}
                        onSelect={() => setSelectedClipId(clip.id)}
                      />
                    ))}
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 w-0.5 h-full bg-red-500 pointer-events-none z-10"
              style={{ left: playheadPosition }}
            >
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Timeline
