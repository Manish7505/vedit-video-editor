import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Loader2,
  Phone,
  PhoneOff,
  AlertCircle,
  VolumeX,
  User
} from 'lucide-react'
import { useVideoEditor } from '../contexts/VideoEditorContext'
import { vapiSessionManager } from '../services/vapiSessionManager'
import { Message } from '../types/message'
import { logger } from '../utils/logger'
import toast from 'react-hot-toast'

interface VideoEditorVAPIAssistantProps {
  workflowId?: string
  assistantId?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const VideoEditorVAPIAssistant: React.FC<VideoEditorVAPIAssistantProps> = ({
  workflowId,
  assistantId,
  position = 'bottom-left'
}) => {
  logger.debug('🎬 VideoEditorVAPIAssistant rendering...', { workflowId, assistantId, position })
  
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('Ready to help!')
  const [isInitialized, setIsInitialized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  const vapiRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Prevent audio feedback by setting proper audio routing
  const preventAudioFeedback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      })
      stream.getTracks().forEach(track => track.stop())
      logger.debug('✅ [VideoEditor] Audio feedback prevention configured')
    } catch (err) {
      logger.error('Error configuring audio feedback prevention (video editor):', err)
    }
  }

  // Get video editor context (direct subscription)
  const {
    clips,
    updateClip,
    selectedClipId,
    setSelectedClipId,
    setIsPlaying,
    setCurrentTime,
    currentTime,
    addClip,
    removeClip,
    setPlaybackRate,
    setZoom,
    zoom,
    canUndo,
    canRedo,
    undo,
    redo,
    adjustments,
    setAdjustments,
    activeFilters,
    setActiveFilters,
    activeEffects,
    setActiveEffects
  } = useVideoEditor()

  // Ensure a target clip is always selected when clips are present
  useEffect(() => {
    if (!selectedClipId && clips.length > 0) {
      setSelectedClipId(clips[0].id)
    }
  }, [clips, selectedClipId, setSelectedClipId])

  // Debug clips changes
  useEffect(() => {
    logger.debug('🎬 VAPI Assistant - Clips changed:', {
      clipsLength: clips.length,
      clips: clips.map(c => ({ id: c.id, name: c.name, type: c.type, url: c.url })),
      selectedClipId,
      timestamp: new Date().toISOString()
    })
    
    // Force a re-render if clips are available but not detected
    if (clips.length > 0) {
      logger.debug('🎬 VAPI Assistant - Clips are available, should work now!')
    }
  }, [clips, selectedClipId])

  // Debug adjustments changes
  useEffect(() => {
    logger.debug('🎬 VAPI Assistant - Adjustments changed:', {
      adjustments,
      activeFilters,
      activeEffects,
      timestamp: new Date().toISOString()
    })
  }, [adjustments, activeFilters, activeEffects])

  // Get configuration from environment or props
  const publicKey =
    import.meta.env.VITE_VAPI_VIDEO_PUBLIC_KEY ||
    import.meta.env.VITE_VAPI_PUBLIC_KEY ||
    ''
  // Prefer video editor specific workflow/assistant ids with fallbacks
  const configWorkflowId =
    workflowId ||
    import.meta.env.VITE_VAPI_VIDEO_WORKFLOW_ID ||
    import.meta.env.VITE_VAPI_WORKFLOW_ID ||
    ''
  const configAssistantId =
    assistantId ||
    import.meta.env.VITE_VAPI_VIDEO_ASSISTANT_ID ||
    ''

  // Helper function to add messages
  const addMessage = (type: 'user' | 'assistant' | 'system', content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  // Process video editing commands - GUIDANCE ONLY
  const processCommand = async (command: string): Promise<string> => {
    const lowerCommand = command.toLowerCase()
    logger.debug('🎬 Processing command:', command)

    // Check for direct action requests - apologize and guide instead
    const directActionKeywords = [
      'make', 'change', 'adjust', 'set', 'apply', 'add', 'remove', 'delete', 
      'cut', 'split', 'move', 'resize', 'crop', 'rotate', 'flip', 'zoom',
      'increase', 'decrease', 'brighten', 'darken', 'contrast', 'saturation',
      'play', 'pause', 'stop', 'mute', 'unmute', 'export', 'render', 'download'
    ]

    const isDirectAction = directActionKeywords.some(keyword => 
      lowerCommand.includes(keyword) && (
        lowerCommand.includes('brightness') || 
        lowerCommand.includes('contrast') || 
        lowerCommand.includes('saturation') ||
        lowerCommand.includes('volume') ||
        lowerCommand.includes('speed') ||
        lowerCommand.includes('filter') ||
        lowerCommand.includes('effect') ||
        lowerCommand.includes('video') ||
        lowerCommand.includes('clip') ||
        lowerCommand.includes('audio')
      )
    )

    if (isDirectAction) {
      return `I apologize, but I can't make direct changes to your video. I'm here to guide you through the process! 

Here's how you can ${lowerCommand.includes('brightness') ? 'adjust brightness' : 
                    lowerCommand.includes('contrast') ? 'adjust contrast' :
                    lowerCommand.includes('saturation') ? 'adjust saturation' :
                    lowerCommand.includes('volume') ? 'change volume' :
                    lowerCommand.includes('speed') ? 'change playback speed' :
                    lowerCommand.includes('filter') ? 'apply filters' :
                    lowerCommand.includes('play') ? 'control playback' :
                    'make that change'}:

1. Look for the ${lowerCommand.includes('brightness') ? 'brightness slider' : 
                    lowerCommand.includes('contrast') ? 'contrast slider' :
                    lowerCommand.includes('saturation') ? 'saturation slider' :
                    lowerCommand.includes('volume') ? 'volume control' :
                    lowerCommand.includes('speed') ? 'playback speed control' :
                    lowerCommand.includes('filter') ? 'filters panel' :
                    'playback controls'} in the interface
2. Use the controls to make your desired adjustment
3. You can also use keyboard shortcuts for quick access

Would you like me to explain more about any specific editing feature?`
    }

    // BRIGHTNESS GUIDANCE
    if (lowerCommand.includes('brightness') || lowerCommand.includes('brighter') || lowerCommand.includes('darker')) {
      return `I can guide you on adjusting brightness! Here's how:

**To adjust brightness:**
1. Look for the "Adjustments" panel on the right side
2. Find the "Brightness" slider
3. Move it right to make the video brighter, left to make it darker
4. You can also use the keyboard shortcut Ctrl+B to open adjustments

**Pro tip:** Start with small adjustments (10-20%) and see how it looks. Too much brightness can wash out details!

Would you like me to explain contrast or saturation adjustments as well?`
    }

    // CONTRAST GUIDANCE
    if (lowerCommand.includes('contrast')) {
      return `I can help you understand contrast adjustments! Here's how:

**To adjust contrast:**
1. Go to the "Adjustments" panel on the right side
2. Find the "Contrast" slider
3. Move it right to increase contrast (makes darks darker, lights lighter)
4. Move it left to decrease contrast (makes everything more similar)

**When to use contrast:**
- Increase contrast to make your video more dramatic and punchy
- Decrease contrast for a softer, more muted look
- Good contrast makes your subject stand out from the background

**Pro tip:** Adjust contrast after brightness for best results!

Would you like me to explain saturation or other adjustments?`
    }

    // SATURATION GUIDANCE
    if (lowerCommand.includes('saturation') || lowerCommand.includes('colorful') || lowerCommand.includes('vibrant')) {
      return `I can guide you on saturation adjustments! Here's how:

**To adjust saturation:**
1. Open the "Adjustments" panel on the right side
2. Find the "Saturation" slider
3. Move it right to make colors more vibrant and colorful
4. Move it left to make colors more muted or even black & white

**When to use saturation:**
- Increase saturation for vibrant, eye-catching videos
- Decrease saturation for a more professional, muted look
- Set to -100 for black and white effect
- Great for creating mood and atmosphere

**Pro tip:** Saturation works great with contrast - try adjusting both together!

Would you like me to explain filters or effects next?`
    }

    // VOLUME GUIDANCE
    if (lowerCommand.includes('volume')) {
      return `I can guide you on audio controls! Here's how:

**To control volume:**
1. Look for the volume slider in the playback controls (usually at the bottom)
2. Or find the "Audio" panel on the right side
3. Drag the slider to adjust volume (0% = silent, 100% = full volume)
4. Use the mute/unmute button for quick silence

**Keyboard shortcuts:**
- Space bar: Play/Pause
- M key: Mute/Unmute
- Up/Down arrows: Volume up/down

**Pro tip:** Keep your main audio around 80-90% to leave headroom for mixing!

Would you like me to explain playback controls or other features?`
    }

    // SPEED GUIDANCE
    if (lowerCommand.includes('speed') || lowerCommand.includes('slow') || lowerCommand.includes('fast')) {
      return `I can guide you on playback speed! Here's how:

**To change playback speed:**
1. Look for the speed control in the playback bar (usually shows "1x")
2. Click on it to see speed options like 0.5x, 1x, 1.5x, 2x
3. Or find the "Playback" panel on the right side
4. Use the speed slider to set any speed between 0.25x and 4x

**Common speeds:**
- 0.5x: Half speed (great for slow motion effects)
- 1x: Normal speed
- 1.5x: Slightly faster (good for review)
- 2x: Double speed (fast review)

**Pro tip:** Use different speeds for different purposes - slow for detailed work, fast for quick review!

Would you like me to explain other playback controls?`
    }

    // PLAYBACK CONTROL GUIDANCE
    if (lowerCommand.includes('play') && !lowerCommand.includes('playback')) {
      return `I can guide you on playback controls! Here's how:

**To play/pause video:**
1. Click the play/pause button in the center of the playback controls
2. Or press the Space bar on your keyboard
3. The button will show a play icon (▶️) when paused, pause icon (⏸️) when playing

**Other playback controls:**
- Skip backward/forward: Use the skip buttons (⏮️ ⏭️)
- Timeline scrubbing: Click and drag on the timeline to jump to any point
- Loop: Look for the loop button to repeat playback

**Pro tip:** Use keyboard shortcuts for faster editing - Space for play/pause, arrow keys for frame-by-frame!

Would you like me to explain timeline navigation or other features?`
    } else if (lowerCommand.includes('pause') || lowerCommand.includes('stop')) {
      return `I can guide you on pausing the video! Here's how:

**To pause/stop video:**
1. Click the pause button (⏸️) in the playback controls
2. Or press the Space bar on your keyboard
3. The video will stop at the current position

**Pro tip:** Pausing is great for making precise edits at specific moments!

Would you like me to explain other playback features?`
    }

    // EXPORT GUIDANCE
    if (lowerCommand.includes('export') || lowerCommand.includes('download') || lowerCommand.includes('render')) {
      return `I can guide you through exporting your video! Here's how:

**To export your video:**
1. Look for the "Export" button (usually in the top-right corner or toolbar)
2. Click it to open the export panel
3. Choose your export settings:
   - Format: MP4 (recommended for most uses)
   - Quality: 1080p for high quality, 720p for smaller files
   - Frame rate: 30fps for smooth motion
4. Click "Export" or "Render" to start the process

**Export tips:**
- Higher quality = larger file size
- 1080p is great for YouTube and social media
- 720p is good for web sharing
- Check the estimated file size before exporting

**Pro tip:** Export a small test first to check quality before doing the full export!

Would you like me to explain other features?`
    }

    // CLOSE GUIDANCE
    if (lowerCommand.includes('close') || lowerCommand.includes('close this') || lowerCommand.includes('close page')) {
      return `I can guide you on closing panels! Here's how:

**To close panels or modals:**
1. Look for the "X" button in the top-right corner of any open panel
2. Or press the Escape key on your keyboard
3. Click outside the panel to close it (if it's a modal)
4. Use the "Close" button if available

**Common panels to close:**
- Export panel: Look for the X in the export dialog
- Settings panel: Close button in settings
- Help panel: X button in help window

**Pro tip:** The Escape key usually closes most panels quickly!

Would you like me to explain other interface features?`
    }

    // SEEK/JUMP GUIDANCE
    if (lowerCommand.includes('jump') || lowerCommand.includes('go to') || lowerCommand.includes('seek')) {
      return `I can guide you on timeline navigation! Here's how:

**To jump to a specific time:**
1. Click anywhere on the timeline scrubber (the horizontal bar at the bottom)
2. Or drag the playhead (vertical line) to the desired position
3. Use the left/right arrow keys for frame-by-frame navigation
4. Hold Shift + arrow keys for larger jumps

**Timeline features:**
- Click on the timeline to jump to that exact moment
- Drag the playhead for smooth scrubbing
- Use the zoom controls to see more detail
- Timeline shows your video duration and current position

**Pro tip:** You can also type a specific time in the time display to jump there!

Would you like me to explain other navigation features?`
    }

    // ZOOM GUIDANCE
    if (lowerCommand.includes('zoom')) {
      return `I can guide you on zooming! Here's how:

**To zoom in/out:**
1. Look for the zoom controls (usually +/- buttons or a slider)
2. Or use your mouse wheel while holding Ctrl
3. Or find the "View" menu for zoom options
4. Zoom in to see more detail, zoom out to see the bigger picture

**Zoom levels:**
- 50%: See more of the timeline at once
- 100%: Normal view (default)
- 200%: See fine details for precise editing

**Pro tip:** Use zoom to work on specific parts of your video with precision!

Would you like me to explain other view options?`
    }

    // FILTER/EFFECT GUIDANCE
    if (lowerCommand.includes('filter') || lowerCommand.includes('effect') || lowerCommand.includes('blur') || lowerCommand.includes('sepia') || lowerCommand.includes('grayscale') || lowerCommand.includes('vintage') || lowerCommand.includes('warm') || lowerCommand.includes('cool')) {
      return `I can guide you on applying filters and effects! Here's how:

**To apply filters:**
1. Look for the "Filters" or "Effects" panel on the right side
2. Browse through the available filter categories
3. Click on any filter to preview it
4. Adjust the intensity slider if available
5. Click "Apply" to add it to your video

**Popular filter types:**
- **Blur**: Soft focus effect
- **Sepia**: Vintage brown tone
- **Grayscale**: Black and white
- **Vintage**: Old film look
- **Warm**: Orange/yellow tint
- **Cool**: Blue tint
- **Dramatic**: High contrast look

**Pro tip:** Start with subtle effects and adjust the intensity to taste!

Would you like me to explain specific filter effects?`
    }

    // UNDO/REDO GUIDANCE
    if (lowerCommand.includes('undo') || lowerCommand.includes('revert')) {
      return `I can guide you on undoing changes! Here's how:

**To undo your last action:**
1. Click the "Undo" button (↶) in the toolbar
2. Or press Ctrl+Z on your keyboard
3. You can undo multiple actions by pressing Ctrl+Z repeatedly
4. The undo button will be grayed out when there's nothing to undo

**Undo tips:**
- Undo works for most editing actions
- You can undo several steps back
- Some actions like saving can't be undone

**Pro tip:** Use Ctrl+Z frequently while editing to quickly fix mistakes!

Would you like me to explain redo or other editing features?`
    }

    if (lowerCommand.includes('redo')) {
      return `I can guide you on redoing changes! Here's how:

**To redo an undone action:**
1. Click the "Redo" button (↷) in the toolbar
2. Or press Ctrl+Y on your keyboard
3. You can redo multiple actions by pressing Ctrl+Y repeatedly
4. The redo button will be grayed out when there's nothing to redo

**Redo tips:**
- Redo only works after you've undone something
- You can redo back to where you were before undoing
- Redo is great for experimenting with different approaches

**Pro tip:** Use Ctrl+Y to quickly redo actions after undoing!

Would you like me to explain other editing features?`
    }

    // RESET GUIDANCE
    if (lowerCommand.includes('reset') || lowerCommand.includes('remove all filters') || lowerCommand.includes('clear filters') || lowerCommand.includes('resetfilters')) {
      return `I can guide you on resetting your video! Here's how:

**To reset all filters and adjustments:**
1. Look for the "Reset" button in the adjustments panel
2. Or find "Clear All" in the filters panel
3. Or use the "Reset" option in the right-click menu
4. This will remove all applied filters and return to original settings

**What gets reset:**
- All visual filters (blur, sepia, vintage, etc.)
- Brightness, contrast, and saturation adjustments
- Any color grading effects
- Text overlays and effects

**Pro tip:** You can also reset individual adjustments by setting their sliders back to default values!

Would you like me to explain other editing features?`
    }

    // FILTER ADDITION GUIDANCE
    if (lowerCommand.includes('addfilter') || lowerCommand.includes('add filter')) {
      return `I can guide you on adding filters! Here's how:

**To add a filter:**
1. Go to the "Filters" or "Effects" panel on the right side
2. Browse through the available filter categories
3. Click on the filter you want to add
4. Adjust the intensity if there's a slider
5. The filter will be applied to your video

**Filter categories:**
- **Color**: Sepia, grayscale, vintage, warm, cool
- **Blur**: Soft focus, motion blur
- **Stylize**: Dramatic, high contrast, artistic
- **Adjust**: Brightness, contrast, saturation

**Pro tip:** You can apply multiple filters and adjust their order!

Would you like me to explain specific filter types?`
    }

    // STATUS GUIDANCE
    if (lowerCommand.includes('test') || lowerCommand.includes('debug') || lowerCommand.includes('status')) {
      return `I can help you check your video editing status! Here's what to look for:

**Current project status:**
- **Clips loaded**: ${clips.length} video clip${clips.length !== 1 ? 's' : ''} in your timeline
- **Selected clip**: ${selectedClipId ? 'One clip is selected' : 'No clip selected'}
- **Active filters**: ${activeFilters.length} filter${activeFilters.length !== 1 ? 's' : ''} applied
- **Adjustments**: Brightness, contrast, and saturation settings

**To check your project:**
1. Look at the timeline to see all your clips
2. Check the adjustments panel for current settings
3. Review the filters panel for applied effects
4. Use the preview to see your changes

**Pro tip:** Save your project regularly to avoid losing your work!

Would you like me to explain how to check specific aspects of your project?`
    }

    // BRIGHTNESS TEST GUIDANCE
    if (lowerCommand.includes('test brightness') || lowerCommand.includes('test state')) {
      return `I can guide you on testing brightness adjustments! Here's how:

**To test brightness changes:**
1. Go to the "Adjustments" panel on the right side
2. Find the "Brightness" slider
3. Move it slightly to the right to increase brightness
4. Watch the preview to see the change
5. Move it back if you don't like the result

**Testing tips:**
- Make small adjustments first (10-20%)
- Use the preview to see changes in real-time
- You can always undo with Ctrl+Z
- Test different values to find what looks best

**Pro tip:** Test adjustments on a small section first before applying to the whole video!

Would you like me to explain other adjustment testing methods?`
    }

    // FORCE UPDATE GUIDANCE
    if (lowerCommand.includes('force update') || lowerCommand.includes('force test')) {
      return `I can guide you on making sure your changes are applied! Here's how:

**To ensure changes are applied:**
1. Make sure you have a video clip selected
2. Use the adjustment sliders in the right panel
3. Watch the preview to see changes in real-time
4. If changes aren't visible, try refreshing the preview
5. Save your project to preserve changes

**Troubleshooting:**
- Make sure a clip is selected before making adjustments
- Check that the preview is playing or paused at the right moment
- Try adjusting the sliders more dramatically to see the effect
- Use undo/redo to test if changes are being tracked

**Pro tip:** Always preview your changes before finalizing them!

Would you like me to explain other troubleshooting methods?`
    }

    // BRIGHTNESS GUIDANCE
    if (lowerCommand.includes('make brighter') || lowerCommand.includes('brighter')) {
      return `I can guide you on making your video brighter! Here's how:

**To make your video brighter:**
1. Go to the "Adjustments" panel on the right side
2. Find the "Brightness" slider
3. Move it to the right to increase brightness
4. Start with a small increase (10-20%) and adjust as needed
5. Watch the preview to see the change

**Brightness tips:**
- Don't overdo it - too much brightness can wash out details
- Adjust in small increments for best results
- Consider adjusting contrast after brightness
- Use the preview to see changes in real-time

**Pro tip:** Brightness works great with contrast adjustments for better results!

Would you like me to explain contrast or other adjustments?`
    }

    if (lowerCommand.includes('undolast') || lowerCommand.includes('undo last')) {
      return `I can guide you on undoing your last action! Here's how:

**To undo your last action:**
1. Click the "Undo" button (↶) in the toolbar
2. Or press Ctrl+Z on your keyboard
3. This will reverse your most recent change
4. The undo button will be grayed out when there's nothing to undo

**Undo tips:**
- Undo works for most editing actions
- You can undo multiple steps back
- Some actions like saving can't be undone
- Use undo frequently while editing

**Pro tip:** Use Ctrl+Z to quickly fix mistakes while editing!

Would you like me to explain redo or other editing features?`
    }

    // CUT/SPLIT GUIDANCE
    if (lowerCommand.includes('cut') || lowerCommand.includes('split')) {
      return `I can guide you on cutting and splitting your video! Here's how:

**To cut or split a video:**
1. Position the playhead where you want to make the cut
2. Look for the "Cut" or "Split" tool in the toolbar
3. Click the cut tool to split the clip at that point
4. This will create two separate clips from the original

**Cutting tips:**
- Make sure you're at the exact moment you want to cut
- You can cut multiple times to create several clips
- Each cut creates a new clip that you can edit separately
- Use the timeline to see where your cuts are

**Pro tip:** Use the razor tool icon (✂️) for cutting clips!

Would you like me to explain other editing tools?`
    }

    // DELETE/REMOVE GUIDANCE
    if (lowerCommand.includes('delete') || lowerCommand.includes('remove') || lowerCommand.includes('remove this')) {
      return `I can guide you on deleting clips! Here's how:

**To delete a clip:**
1. Select the clip you want to delete in the timeline
2. Right-click on the selected clip
3. Choose "Delete" from the context menu
4. Or press the Delete key on your keyboard
5. Confirm the deletion if prompted

**Deletion tips:**
- Make sure you have the right clip selected
- You can undo deletions with Ctrl+Z
- Deleted clips can't be recovered unless you undo
- Double-check before deleting important content

**Pro tip:** Use the Delete key for quick deletion of selected clips!

Would you like me to explain other editing operations?`
    }

    // RESET/CLEAR GUIDANCE
    if (lowerCommand.includes('reset') || lowerCommand.includes('clear')) {
      return `I can guide you on resetting and clearing your video! Here's how:

**To reset or clear changes:**
1. Go to the "Adjustments" panel on the right side
2. Look for the "Reset" button
3. Click it to clear all adjustments (brightness, contrast, saturation)
4. Or go to the "Filters" panel and click "Clear All"
5. This will return your video to its original state

**What gets reset:**
- All visual filters (blur, sepia, vintage, etc.)
- Brightness, contrast, and saturation adjustments
- Any color grading effects
- Text overlays and effects

**Pro tip:** You can also reset individual adjustments by setting their sliders back to default values!

Would you like me to explain other editing features?`
    }

    // UNDO/REDO GUIDANCE
    if (lowerCommand.includes('undo')) {
      return `I can guide you on undoing changes! Here's how:

**To undo your last action:**
1. Click the "Undo" button (↶) in the toolbar
2. Or press Ctrl+Z on your keyboard
3. You can undo multiple actions by pressing Ctrl+Z repeatedly
4. The undo button will be grayed out when there's nothing to undo

**Undo tips:**
- Undo works for most editing actions
- You can undo several steps back
- Some actions like saving can't be undone
- Use undo frequently while editing

**Pro tip:** Use Ctrl+Z to quickly fix mistakes while editing!

Would you like me to explain redo or other editing features?`
    } else if (lowerCommand.includes('redo')) {
      return `I can guide you on redoing changes! Here's how:

**To redo an undone action:**
1. Click the "Redo" button (↷) in the toolbar
2. Or press Ctrl+Y on your keyboard
3. You can redo multiple actions by pressing Ctrl+Y repeatedly
4. The redo button will be grayed out when there's nothing to redo

**Redo tips:**
- Redo only works after you've undone something
- You can redo back to where you were before undoing
- Redo is great for experimenting with different approaches

**Pro tip:** Use Ctrl+Y to quickly redo actions after undoing!

Would you like me to explain other editing features?`
    }

    // SELECT GUIDANCE
    if (lowerCommand.includes('select all') || lowerCommand.includes('select everything')) {
      return `I can guide you on selecting clips! Here's how:

**To select all clips:**
1. Click and drag across all clips in the timeline
2. Or press Ctrl+A to select all clips
3. Or hold Ctrl and click on each clip you want to select
4. Selected clips will be highlighted

**Selection tips:**
- You can select multiple clips at once
- Selected clips can be moved, deleted, or edited together
- Use Shift+click to select a range of clips
- Click on empty space to deselect all clips

**Pro tip:** Use Ctrl+A to quickly select all clips in your timeline!

Would you like me to explain other selection methods?`
    } else if (lowerCommand.includes('select') || lowerCommand.includes('select this')) {
      return `I can guide you on selecting clips! Here's how:

**To select a clip:**
1. Click on the clip you want to select in the timeline
2. The selected clip will be highlighted
3. You can then edit, move, or delete the selected clip
4. Click on another clip to select it instead

**Selection tips:**
- Only one clip can be selected at a time
- Selected clips show their properties in the right panel
- Use the arrow keys to navigate between clips
- Right-click on a clip for more options

**Pro tip:** Click on a clip to select it, then use the right panel to edit its properties!

Would you like me to explain other editing features?`
    }

    // HELP/COMMANDS LIST
    if (lowerCommand.includes('help') || lowerCommand.includes('commands') || lowerCommand.includes('what can you do')) {
      return `I'm your video editing guide! Here's what I can help you with:

🎬 **VIDEO EDITING GUIDANCE:**
✅ **Brightness**: "How do I make it brighter?", "adjust brightness"
✅ **Contrast**: "How do I add contrast?", "adjust contrast"  
✅ **Saturation**: "How do I make it colorful?", "adjust saturation"
✅ **Effects**: "How do I add blur?", "apply sepia filter", "vintage effect"
✅ **Volume**: "How do I change volume?", "mute audio"
✅ **Playback**: "How do I play/pause?", "change speed"
✅ **Navigation**: "How do I jump to time?", "zoom in/out"
✅ **Export**: "How do I export?", "download video", "render video"
✅ **Editing**: "How do I cut clips?", "delete clip", "reset filters"
✅ **Selection**: "How do I select clips?", "select all"
✅ **History**: "How do I undo?", "redo changes"
✅ **Interface**: "How do I close panels?", "navigate interface"

❌ **WHAT I CAN'T DO:**
• I can't make direct changes to your video
• I can't upload files for you
• I can't save your project
• I can't create new projects

**I'm here to guide you through the process!** Just ask "How do I..." and I'll show you the steps!

What would you like to learn about?`
    }

    // Default response
    return `I understand you want to: "${command}". 

I'm here to guide you through video editing! Here's what I can help you with:

🎬 **VIDEO EDITING GUIDANCE:**
• **Brightness, contrast, saturation** - How to adjust these settings
• **Visual effects** - How to apply blur, sepia, vintage, etc.
• **Playback control** - How to play, pause, change speed
• **Timeline navigation** - How to jump to time, zoom in/out
• **Basic editing** - How to cut, delete, reset, select clips
• **History** - How to undo and redo changes

📤 **EXPORT & NAVIGATION:**
• **Export video** - How to download and render your video
• **Interface** - How to close panels and navigate

❌ **WHAT I CAN'T DO:**
• I can't make direct changes to your video
• I can't upload files for you
• I can't save your project
• I can't create new projects

**I'm here to guide you through the process!** Just ask "How do I..." and I'll show you the steps!

Try saying "help" for a full list of guidance topics!`
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add welcome message when panel opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('assistant', 'Welcome! I\'m your Video Editor Guide. I can help you learn how to edit videos with step-by-step guidance!')
      addMessage('system', 'I can guide you through: "How do I adjust brightness?", "How do I add effects?", "How do I play video?", "How do I export?", or say "help" for all guidance topics!')
    }
  }, [isOpen])

  // Listen for call end events from other assistants and page navigation
  useEffect(() => {
    const handleCallEnded = (event: CustomEvent) => {
      if (event.detail.source !== 'video-editor' && isConnected) {
        logger.info('📞 Call ended by another assistant, cleaning up video editor...')
        // Reset states when another assistant ends the call
        setIsConnected(false)
        setIsLoading(false)
        setIsSpeaking(false)
        setIsListening(false)
        setIsMuted(false)
        setStatusMessage('Call ended by another assistant')
        addMessage('system', 'Call ended by another assistant.')
        
        // Clean up VAPI instance
        if (vapiRef.current) {
          vapiRef.current.removeAllListeners()
          vapiRef.current = null
        }
      }
    }

    const handlePageUnload = () => {
      logger.info('🚪 Video editor page unloading, cleaning up VAPI...')
      if (vapiRef.current && isConnected) {
        try {
          vapiRef.current.stop()
        } catch (err) {
          logger.error('Error stopping VAPI on page unload:', err)
        }
        vapiRef.current.removeAllListeners()
        vapiRef.current = null
      }
      // Clear session storage
      window.sessionStorage.removeItem('vapi-active-call')
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isConnected) {
        handlePageUnload()
        // Optional: Show confirmation dialog
        event.preventDefault()
        event.returnValue = 'You have an active video editing session. Are you sure you want to leave?'
        return 'You have an active video editing session. Are you sure you want to leave?'
      }
    }

    window.addEventListener('vapi-call-ended', handleCallEnded as EventListener)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handlePageUnload)
    
    return () => {
      window.removeEventListener('vapi-call-ended', handleCallEnded as EventListener)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handlePageUnload)
    }
  }, [isConnected, addMessage])

  // Initialize VAPI
  useEffect(() => {
    const initializeVAPI = async () => {
      if (!publicKey) {
        setError('VAPI public key not found. Set VITE_VAPI_VIDEO_PUBLIC_KEY or VITE_VAPI_PUBLIC_KEY in .env')
        return
      }

      if (!configWorkflowId && !configAssistantId) {
        setError('Workflow or Assistant ID not found. Set VITE_VAPI_VIDEO_WORKFLOW_ID (or VITE_VAPI_WORKFLOW_ID) in .env')
        return
      }

      try {
        // Dynamically import VAPI
        const Vapi = (await import('@vapi-ai/web')).default
        logger.info('🔧 Initializing Video Editor VAPI with public key:', publicKey.substring(0, 8) + '...')
        
        // Initialize VAPI with proper audio configuration to prevent feedback
        vapiRef.current = new Vapi(publicKey)
        
        // Note: Audio settings configuration may not be available in all VAPI versions
        // The VAPI SDK handles audio configuration internally
        
        // Set up event listeners
        vapiRef.current.on('call-start', () => {
          logger.info('✅ Video Editor Call started successfully')
          setIsConnected(true)
          setIsLoading(false)
          setError(null)
          setIsListening(true)
          setStatusMessage('Connected - Ready to guide')
          addMessage('system', 'Video editing guide is ready!')
          addMessage('assistant', 'Hello! I\'m your video editing guide. I can help you learn how to adjust brightness, add effects, cut clips, and more. Try asking "How do I increase brightness?" or "How do I add blur effect?"!')
        })

        vapiRef.current.on('call-end', () => {
          logger.info('📞 Video Editor Call ended by VAPI')
          setIsConnected(false)
          setIsLoading(false)
          setIsSpeaking(false)
          setIsListening(false)
          setIsMuted(false)
          setStatusMessage('Call ended')
          addMessage('system', 'Video editing guidance session ended. Click "Start Voice" to continue.')
          // Clean up session manager
          vapiSessionManager.endCall('video-editor')
          // Ensure clean state
          try { vapiRef.current?.removeAllListeners?.() } catch {}
          vapiRef.current = null
        })

        vapiRef.current.on('speech-start', (data: { role: string }) => {
          logger.debug('🎤 Video Editor Speech started:', data)
          if (data.role === 'assistant') {
            setIsSpeaking(true)
            setIsListening(false)
            setStatusMessage('Guide is speaking...')
          } else if (data.role === 'user') {
            setIsListening(false)
            setStatusMessage('You are speaking...')
          }
        })

        vapiRef.current.on('speech-end', (data: { role: string }) => {
          logger.debug('🔇 Video Editor Speech ended:', data)
          if (data.role === 'assistant') {
            setIsSpeaking(false)
            setIsListening(true)
            setStatusMessage('Listening for questions...')
          } else if (data.role === 'user') {
            setIsListening(true)
            setStatusMessage('Listening for questions...')
          }
        })

        // Alternative event listeners for better compatibility
        vapiRef.current.on('user-speech-start', () => {
          logger.debug('🎤 User started speaking (alternative)')
          setIsListening(false)
          setStatusMessage('You are speaking...')
        })

        vapiRef.current.on('user-speech-end', () => {
          logger.debug('🔇 User finished speaking (alternative)')
          setIsListening(true)
          setStatusMessage('Listening for questions...')
        })

        vapiRef.current.on('message', async (message: { type: string; transcriptType?: string; role?: string; transcript?: string; text?: string }) => {
          logger.debug('💬 Video Editor Message received:', message)
          
          // Handle transcript messages
          if (message.type === 'transcript') {
            if (message.transcriptType === 'final') {
              const role = message.role || 'user'
              const text = message.transcript || message.text || ''
              if (text) {
                addMessage(role === 'assistant' ? 'assistant' : 'user', text)
                
                // Process user questions automatically
                if (role === 'user') {
                  try {
                    const response = await processCommand(text)
                    addMessage('assistant', response)
                  } catch (error: unknown) {
                    logger.error('Error processing question:', error)
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    addMessage('system', `Error: ${errorMessage}`)
                  }
                }
              }
            }
          }
          
          // Handle conversation updates
          if (message.type === 'conversation-update') {
            logger.debug('Conversation update:', message)
          }
        })

        vapiRef.current.on('error', (error: { errorMsg?: string; message?: string; error?: { message?: string }; type?: string }) => {
          logger.error('❌ Video Editor VAPI Error:', error)
          logger.error('❌ Video Editor VAPI Error Details:', JSON.stringify(error, null, 2))
          
          let errorMessage = 'Unknown VAPI error'
          if (error.errorMsg) {
            errorMessage = error.errorMsg
          } else if (error.message) {
            errorMessage = error.message
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message
          } else if (typeof error === 'string') {
            errorMessage = error
          } else if (error.type === 'start-method-error') {
            errorMessage = `Start method error: ${error.error?.message || 'Failed to start call'}`
          }
          
          setError(`VAPI Error: ${errorMessage}`)
          setIsConnected(false)
          setIsLoading(false)
          setStatusMessage('Error occurred. Please try again.')
        })

        setIsInitialized(true)
        setStatusMessage('Ready to edit! Click to start.')
        logger.info('✅ Video Editor VAPI initialized successfully')

      } catch (err: unknown) {
        logger.error('Failed to initialize Video Editor VAPI:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(`Failed to initialize VAPI: ${errorMessage}`)
        setStatusMessage('Failed to initialize. Please check your configuration.')
      }
    }

    initializeVAPI()

    // Cleanup function
    return () => {
      if (vapiRef.current) {
        logger.debug('🧹 Cleaning up Video Editor VAPI...')
        try {
          vapiRef.current.stop()
        } catch (err) {
          logger.error('Error during cleanup:', err)
        }
        vapiRef.current.removeAllListeners()
        vapiRef.current = null
      }
    }
  }, [publicKey, configWorkflowId, configAssistantId])

  const startCall = async () => {
    if (!vapiRef.current || !isInitialized) {
      setError('VAPI not initialized')
      return
    }

    if (!configWorkflowId && !configAssistantId) {
      setError('Workflow ID or Assistant ID is missing. Please check your .env file.')
      return
    }

    // Check if another assistant is already in a call
    if (!vapiSessionManager.startCall('video-editor')) {
      setError('Another assistant is already in a call. Please end that call first.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setStatusMessage('Connecting...')
      
      logger.info('🚀 Starting Video Editor VAPI call with:', { workflowId: configWorkflowId, assistantId: configAssistantId })
      
      // Prevent audio feedback before starting call
      await preventAudioFeedback()

      // Try multiple start signatures to support SDK variations
      const tryStartSequence: Array<() => Promise<any>> = []
      if (configAssistantId) {
        tryStartSequence.push(() => vapiRef.current.start(configAssistantId))
        tryStartSequence.push(() => vapiRef.current.start({ assistant: { id: configAssistantId } }))
      }
      if (configWorkflowId) {
        tryStartSequence.push(() => vapiRef.current.start(configWorkflowId))
        tryStartSequence.push(() => vapiRef.current.start({ assistant: { workflow: { id: configWorkflowId } } }))
      }
      if (tryStartSequence.length === 0) throw new Error('Missing workflow/assistant id')

      let started = false
      let lastError: unknown = null
      for (const startAttempt of tryStartSequence) {
        try {
          await startAttempt()
          started = true
          break
        } catch (e) {
          lastError = e
          logger.warn('Start attempt failed in video editor, trying next signature...', e)
        }
      }
      if (!started) throw lastError || new Error('Failed to start VAPI call')
      
    } catch (err: unknown) {
      logger.error('Failed to start call:', err)
      logger.error('Start call error details:', JSON.stringify(err, null, 2))
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to start call: ${errorMessage}`)
      setIsLoading(false)
      setStatusMessage('Failed to start call. Please try again.')
      
      // Clear the session storage on error
      vapiSessionManager.endCall('video-editor')
    }
  }

  const endCall = async () => {
    logger.info('🛑 Attempting to end video editor call...')
    
    if (!vapiRef.current || !isConnected) {
      logger.warn('⚠️ No active VAPI video editor call to stop')
      // Still reset states and clean up session
      setIsConnected(false)
      setIsLoading(false)
      setIsSpeaking(false)
      setIsListening(false)
      setIsMuted(false)
      setStatusMessage('Call ended')
      vapiSessionManager.endCall('video-editor')
      return
    }

    // Add timeout to force cleanup if call doesn't end
    const forceCleanupTimeout = setTimeout(() => {
      logger.warn('⚠️ Force cleanup triggered - call did not end within 3 seconds')
      setIsConnected(false)
      setIsLoading(false)
      setIsSpeaking(false)
      setIsListening(false)
      setIsMuted(false)
      setStatusMessage('Call ended (forced)')
      vapiSessionManager.endCall('video-editor')
      // Force destroy the VAPI instance
      if (vapiRef.current) {
        try {
          vapiRef.current.removeAllListeners()
          vapiRef.current = null
        } catch (e) {
          logger.error('Error during force cleanup:', e)
        }
      }
    }, 3000)

    try {
      setIsLoading(true)
      setStatusMessage('Ending call...')
      
      // Immediately reset connection state to provide better UX
      setIsConnected(false)
      setIsSpeaking(false)
      setIsListening(false)
      
      logger.info('🛑 Stopping VAPI video editor call...')
      
      // Try multiple methods to stop the call
      try {
        await vapiRef.current.stop()
        logger.info('✅ VAPI video editor stop successful')
      } catch (stopError) {
        logger.warn('⚠️ Primary stop failed, trying alternative methods:', stopError)
        
        // Try alternative stop methods
        try {
          if (vapiRef.current && typeof vapiRef.current.destroy === 'function') {
            await vapiRef.current.destroy()
            logger.info('✅ VAPI destroyed successfully')
          }
        } catch (destroyError) {
          logger.warn('⚠️ Destroy failed:', destroyError)
        }
        
        // Force cleanup regardless
        logger.warn('🔄 Forcing cleanup after stop failure')
      }
      
      // Remove event listeners
      if (vapiRef.current) {
        vapiRef.current.removeAllListeners()
      }
      
    } catch (err) {
      logger.error('❌ Error stopping VAPI video editor call:', err)
    } finally {
      // Always perform cleanup
      setIsConnected(false)
      setIsLoading(false)
      setIsSpeaking(false)
      setIsListening(false)
      setIsMuted(false)
      setStatusMessage('Call ended')
      addMessage('system', 'Video editing session ended successfully.')
      
      // Clear session storage and notify other components
      vapiSessionManager.endCall('video-editor')
      
      // Nullify the VAPI reference to ensure clean state
      vapiRef.current = null
      
      // Clear the timeout
      clearTimeout(forceCleanupTimeout)
      
      logger.info('✅ Video editor call cleanup completed successfully')
    }
  }

  const toggleMute = () => {
    if (vapiRef.current && isConnected) {
      try {
        const newMutedState = !isMuted
        logger.debug(`🔇 ${newMutedState ? 'Muting' : 'Unmuting'} microphone...`)
        vapiRef.current.setMuted(newMutedState)
        setIsMuted(newMutedState)
        setStatusMessage(newMutedState ? 'Microphone muted' : 'Microphone active')
        addMessage('system', newMutedState ? 'Microphone muted' : 'Microphone unmuted')
      } catch (err) {
        logger.error('Error toggling mute:', err)
      }
    }
  }


  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right': return 'bottom-6 right-6'
      case 'bottom-left': return 'bottom-6 left-6'
      case 'top-right': return 'top-6 right-6'
      case 'top-left': return 'top-6 left-6'
      default: return 'bottom-6 left-6'
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.div 
        className={`fixed ${getPositionClasses()} z-50`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1,
          scale: 1,
          y: [0, -12, 0]
        }}
        transition={{ 
          opacity: { duration: 0.3 },
          scale: { duration: 0.3 },
          y: { 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <motion.button
          onClick={() => {
            logger.debug('🎬 VideoEditorVAPIAssistant button clicked!', { isOpen })
            setIsOpen(!isOpen)
          }}
          className={`
            relative w-16 h-16 rounded-full
            shadow-2xl overflow-hidden
            border-2 border-white/30
            hover:scale-110 active:scale-95
            transition-all duration-300
            bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500
            ${isConnected ? 'ring-4 ring-purple-400/50 animate-pulse' : ''}
            ${error ? 'ring-4 ring-red-400/50' : ''}
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          disabled={!isInitialized}
        >
          {/* AI Image Background */}
          <div className="absolute inset-0">
            <img
              src="/images/artificial-8587685_1280.jpg"
              alt="Video Editor AI"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" style={{ display: 'none' }}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-orange-500/40"></div>
            
            {/* Status overlays removed to avoid overlapping dot */}
          </div>
          
          {/* Pulse effect when connected */}
          {isConnected && (
            <motion.div
              className="absolute inset-0 rounded-full bg-green-400/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={`
              fixed w-[420px] h-[650px] rounded-3xl shadow-2xl flex flex-col overflow-hidden
              ${position.includes('right') ? 'right-6' : 'left-6'}
              ${position.includes('bottom') ? 'bottom-6' : 'top-6'}
              bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
              border border-gray-700/50 backdrop-blur-xl z-50
            `}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 px-6 py-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden">
                      <img
                        src="/images/artificial-8587685_1280.jpg"
                        alt="Video Editor AI"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isConnected && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white leading-tight mb-0.5">
                      Video Editor AI
                    </h3>
                    <p className="text-gray-400 text-sm leading-tight truncate">
                      {statusMessage}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-all duration-200 flex-shrink-0 ml-3 group"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 py-3 bg-red-500/10 border-b border-red-500/20"
                >
                  <div className="flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-gray-900/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 rounded-3xl overflow-hidden mb-6 shadow-2xl"
                  >
                    <img
                      src="/images/artificial-8587685_1280.jpg"
                      alt="Video Editor AI"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <h4 className="text-xl font-bold text-white mb-2">Ready to Guide!</h4>
                  <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">
                    Click <span className="text-green-400 font-semibold">"Start Call"</span> below to begin voice-guided video editing help
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'} ${
                      message.type === 'system' ? 'justify-center' : ''
                    }`}
                  >
                    {message.type === 'system' ? (
                      <div className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-full text-xs max-w-xs text-center backdrop-blur-sm border border-gray-600/30">
                        {message.content}
                      </div>
                    ) : (
                      <>
                        {message.type === 'assistant' && (
                          <div className="w-9 h-9 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                            <img
                              src="/images/artificial-8587685_1280.jpg"
                              alt="Video Editor AI"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl shadow-xl ${
                            message.type === 'user'
                              ? 'bg-gradient-to-br from-purple-600 to-pink-700 text-white rounded-br-sm'
                              : 'bg-gray-800 text-gray-100 border border-gray-700/50 rounded-bl-sm'
                          }`}
                        >
                          <div className="px-4 py-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {message.type === 'user' && (
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Status Indicator */}
            <AnimatePresence>
              {isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-t border-green-500/20"
                >
                  <div className="flex items-center justify-center gap-3">
                    {isSpeaking ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                        <span className="font-semibold text-green-400 text-sm">AI is speaking...</span>
                      </>
                    ) : isListening ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50" />
                        <span className="font-semibold text-blue-400 text-sm">Listening...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                        <span className="font-semibold text-green-400 text-sm">Connected</span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>



            {/* Voice Controls */}
            <div className="px-6 py-5 border-t border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
              <div className="flex gap-3">
                {!isConnected ? (
                  <motion.button
                    onClick={startCall}
                    disabled={isLoading || !isInitialized}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 font-bold text-base shadow-2xl shadow-green-500/20 hover:shadow-green-500/40 border border-green-500/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-6 h-6" />
                        <span>Start Call</span>
                      </>
                    )}
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      onClick={toggleMute}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-5 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 font-bold shadow-xl border ${
                        isMuted
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-orange-500/20 hover:shadow-orange-500/40 border-orange-500/30'
                          : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white shadow-gray-500/20 hover:shadow-gray-500/40 border-gray-500/30'
                      }`}
                    >
                      {isMuted ? <VolumeX className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full bg-white" />}
                    </motion.button>
                    <motion.button
                      onClick={endCall}
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      className={`flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl hover:from-red-500 hover:to-rose-500 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-base shadow-2xl shadow-red-500/20 hover:shadow-red-500/40 border border-red-500/20 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Ending...</span>
                        </>
                      ) : (
                        <>
                          <PhoneOff className="w-6 h-6" />
                          <span>End Call</span>
                        </>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default VideoEditorVAPIAssistant

