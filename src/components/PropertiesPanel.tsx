import { useState } from 'react'
import { 
  Settings, 
  Volume2, 
  Type, 
  Play, 
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Zap,
  Sparkles
} from 'lucide-react'
import { useVideoEditor } from '../contexts/VideoEditorContext'

const PropertiesPanel = () => {
  const { 
    selectedClipId, 
    clips, 
    updateClip, 
    tracks, 
    updateTrack 
  } = useVideoEditor()
  
  const [activeTab, setActiveTab] = useState<'clip' | 'track' | 'project'>('clip')
  
  const selectedClip = clips.find(clip => clip.id === selectedClipId)
  const selectedTrack = selectedClip ? tracks.find(track => track.id === selectedClip.trackId) : null

  const tabs = [
    { key: 'clip', label: 'Clip', icon: <Play className="w-4 h-4" /> },
    { key: 'track', label: 'Track', icon: <Volume2 className="w-4 h-4" /> },
    { key: 'project', label: 'Project', icon: <Settings className="w-4 h-4" /> }
  ]

  const renderClipProperties = () => {
    if (!selectedClip) {
      return (
        <div className="text-center py-8">
          <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 dark:text-gray-400">Select a clip to edit properties</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Basic Properties */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Basic Properties</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={selectedClip.name}
                onChange={(e) => updateClip(selectedClip.id, { name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <input
                  type="number"
                  value={selectedClip.startTime}
                  onChange={(e) => updateClip(selectedClip.id, { startTime: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <input
                  type="number"
                  value={selectedClip.duration}
                  onChange={(e) => updateClip(selectedClip.id, { duration: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Video Properties */}
        {selectedClip.type === 'video' && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Video Properties</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Opacity
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="1"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scale
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  defaultValue="1"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button className="p-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors">
                  <RotateCcw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors">
                  <RotateCw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors">
                  <FlipHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors">
                  <FlipVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audio Properties */}
        {selectedClip.type === 'audio' && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Audio Properties</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  defaultValue="1"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fade In
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  defaultValue="0"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fade Out
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  defaultValue="0"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Text Properties */}
        {selectedClip.type === 'text' && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Text Properties</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  value={selectedClip.content || ''}
                  onChange={(e) => updateClip(selectedClip.id, { content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Font Size
                </label>
                <input
                  type="range"
                  min="12"
                  max="72"
                  step="1"
                  defaultValue="24"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  defaultValue="#ffffff"
                  className="w-full h-10 border border-gray-300 dark:border-dark-600 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* AI Enhancements */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-primary-600" />
            AI Enhancements
          </h4>
          <div className="space-y-2">
            <button className="w-full p-2 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors text-left">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-primary-700 dark:text-primary-300">Auto-enhance quality</span>
              </div>
            </button>
            
            <button className="w-full p-2 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors text-left">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-primary-700 dark:text-primary-300">Remove background noise</span>
              </div>
            </button>
            
            <button className="w-full p-2 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors text-left">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-primary-700 dark:text-primary-300">Generate captions</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderTrackProperties = () => {
    if (!selectedTrack) {
      return (
        <div className="text-center py-8">
          <Volume2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 dark:text-gray-400">Select a track to edit properties</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Track Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Track Name
              </label>
              <input
                type="text"
                value={selectedTrack.name}
                onChange={(e) => updateTrack(selectedTrack.id, { name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Volume
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={selectedTrack.volume}
                onChange={(e) => updateTrack(selectedTrack.id, { volume: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTrack.muted}
                  onChange={(e) => updateTrack(selectedTrack.id, { muted: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Muted</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTrack.locked}
                  onChange={(e) => updateTrack(selectedTrack.id, { locked: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Locked</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderProjectProperties = () => {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Project Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resolution
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white">
                <option>1920x1080 (Full HD)</option>
                <option>1280x720 (HD)</option>
                <option>3840x2160 (4K)</option>
                <option>2560x1440 (2K)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frame Rate
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white">
                <option>24 fps</option>
                <option>25 fps</option>
                <option>30 fps</option>
                <option>60 fps</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Audio Sample Rate
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white">
                <option>44.1 kHz</option>
                <option>48 kHz</option>
                <option>96 kHz</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-800">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-dark-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'clip' && renderClipProperties()}
        {activeTab === 'track' && renderTrackProperties()}
        {activeTab === 'project' && renderProjectProperties()}
      </div>
    </div>
  )
}

export default PropertiesPanel
