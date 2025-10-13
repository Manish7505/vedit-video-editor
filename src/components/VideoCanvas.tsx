import { useState } from 'react'
import { 
  Play, 
  Volume2, 
  VolumeX, 
  Maximize2,
  Settings,
  Grid,
  Eye
} from 'lucide-react'
import { useVideoEditor } from '../contexts/VideoEditorContext'

const VideoCanvas = () => {
  const { 
    currentTime, 
    duration, 
    clips
  } = useVideoEditor()
  
  const [showGrid, setShowGrid] = useState(false)
  const [showSafeArea, setShowSafeArea] = useState(false)
  const [volume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Render grid overlay
  const renderGrid = () => {
    if (!showGrid) return null
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    )
  }

  // Render safe area guides
  const renderSafeArea = () => {
    if (!showSafeArea) return null
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Title Safe Area */}
        <div className="absolute inset-0 m-[10%] border border-yellow-400/50 rounded">
          <div className="absolute -top-4 left-0 text-xs text-yellow-400 bg-black/50 px-1 rounded">
            Title Safe
          </div>
        </div>
        
        {/* Action Safe Area */}
        <div className="absolute inset-0 m-[5%] border border-red-400/50 rounded">
          <div className="absolute -top-4 right-0 text-xs text-red-400 bg-black/50 px-1 rounded">
            Action Safe
          </div>
        </div>
      </div>
    )
  }

  // Get current clips at the current time
  const getCurrentClips = () => {
    return clips.filter(clip => 
      currentTime >= clip.startTime && currentTime <= clip.endTime
    )
  }

  const currentClips = getCurrentClips()

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Main Canvas */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(45deg, #333 25%, transparent 25%), 
              linear-gradient(-45deg, #333 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #333 75%), 
              linear-gradient(-45deg, transparent 75%, #333 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }} />
        </div>

        {/* Video Content Area */}
        <div className="relative w-4/5 h-4/5 bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
          {/* Placeholder for video content */}
          {currentClips.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No content at this time</p>
                <p className="text-sm">Add media to the timeline to see it here</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full relative">
              {/* Render current clips */}
              {currentClips.map((clip) => (
                <div
                  key={clip.id}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {clip.type === 'video' && (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Play className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">{clip.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {clip.type === 'image' && (
                    <div className="w-full h-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded flex items-center justify-center">
                          📷
                        </div>
                        <p className="text-sm">{clip.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {clip.type === 'text' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <p className="text-2xl font-bold">{clip.content || clip.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Grid Overlay */}
          {renderGrid()}
          
          {/* Safe Area Guides */}
          {renderSafeArea()}
        </div>
      </div>

      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg transition-colors ${
            showGrid 
              ? 'bg-primary-600 text-white' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setShowSafeArea(!showSafeArea)}
          className={`p-2 rounded-lg transition-colors ${
            showSafeArea 
              ? 'bg-primary-600 text-white' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>
        
        <button className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
        </button>
        
        <button className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-lg transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Audio Level Indicator */}
      <div className="absolute bottom-4 left-4">
        <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center space-x-1">
            <div className="w-16 h-1 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-400 transition-all duration-300"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
            </div>
            <span className="text-xs text-white w-8 text-right">
              {Math.round(volume * 100)}
            </span>
          </div>
        </div>
      </div>

      {/* Time Display */}
      <div className="absolute bottom-4 right-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="text-white text-sm font-mono">
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')} / {Math.floor(duration / 60)}:{(duration % 60).toFixed(1).padStart(4, '0')}
          </div>
        </div>
      </div>

      {/* Clip Information Overlay */}
      {currentClips.length > 0 && (
        <div className="absolute top-4 left-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="text-white text-sm">
              <div className="font-medium">Active Clips:</div>
              {currentClips.map((clip) => (
                <div key={clip.id} className="text-xs text-gray-300">
                  {clip.name} ({clip.type})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoCanvas
