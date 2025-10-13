import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Video, 
  Music, 
  Image as ImageIcon, 
  FileText, 
  Search,
  Grid,
  List,
  Play,
  MoreHorizontal
} from 'lucide-react'
import { useVideoEditor } from '../contexts/VideoEditorContext'
import { Clip } from '../contexts/VideoEditorContext'

const MediaLibrary = () => {
  const { tracks, addClip } = useVideoEditor()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedType, setSelectedType] = useState<'all' | 'video' | 'audio' | 'image' | 'text'>('all')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])

  interface MediaFile {
    id: string
    name: string
    type: 'video' | 'audio' | 'image' | 'text'
    size: number
    duration?: number
    thumbnail?: string
    url: string
    file: File
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: MediaFile[] = acceptedFiles.map(file => ({
      id: `media-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: getFileType(file.type),
      size: file.size,
      url: URL.createObjectURL(file),
      file
    }))
    
    setMediaFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.aac', '.m4a'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'text/*': ['.txt', '.srt', '.vtt']
    },
    multiple: true
  })

  const getFileType = (mimeType: string): 'video' | 'audio' | 'image' | 'text' => {
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('image/')) return 'image'
    return 'text'
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />
      case 'audio':
        return <Music className="w-5 h-5" />
      case 'image':
        return <ImageIcon className="w-5 h-5" />
      case 'text':
        return <FileText className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const addToTimeline = (mediaFile: MediaFile) => {
    const targetTrack = tracks.find(track => track.type === mediaFile.type) || tracks[0]
    
    if (targetTrack) {
      const newClip: Omit<Clip, 'id'> = {
        trackId: targetTrack.id,
        name: mediaFile.name,
        type: mediaFile.type,
        startTime: 0, // Will be calculated based on timeline
        endTime: mediaFile.duration || 10,
        duration: mediaFile.duration || 10,
        file: mediaFile.file,
        url: mediaFile.url
      }
      
      addClip(newClip)
    }
  }

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || file.type === selectedType
    return matchesSearch && matchesType
  })

  const typeFilters = [
    { key: 'all', label: 'All', count: mediaFiles.length },
    { key: 'video', label: 'Video', count: mediaFiles.filter(f => f.type === 'video').length },
    { key: 'audio', label: 'Audio', count: mediaFiles.filter(f => f.type === 'audio').length },
    { key: 'image', label: 'Images', count: mediaFiles.filter(f => f.type === 'image').length },
    { key: 'text', label: 'Text', count: mediaFiles.filter(f => f.type === 'text').length }
  ]

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Media Library</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Type Filters */}
        <div className="flex space-x-1 overflow-x-auto">
          {typeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedType(filter.key as any)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedType === filter.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`mx-4 mb-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-dark-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-dark-700'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Supports video, audio, images, and text files
        </p>
      </div>

      {/* Media Files */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 dark:text-gray-400">No media files yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Upload some files to get started</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
            <AnimatePresence>
              {filteredFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-gray-50 dark:bg-dark-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors ${
                    viewMode === 'list' ? 'flex items-center space-x-3' : ''
                  }`}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Grid View */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file.type)}
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </span>
                        </div>
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {formatFileSize(file.size)}
                        {file.duration && ` • ${Math.floor(file.duration / 60)}:${(file.duration % 60).toString().padStart(2, '0')}`}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => addToTimeline(file)}
                          className="flex-1 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded transition-colors"
                        >
                          Add to Timeline
                        </button>
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded">
                          <Play className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                            {file.duration && ` • ${Math.floor(file.duration / 60)}:${(file.duration % 60).toString().padStart(2, '0')}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded">
                          <Play className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => addToTimeline(file)}
                          className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded transition-colors"
                        >
                          Add
                        </button>
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaLibrary
