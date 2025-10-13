import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { 
  X, 
  Mic, 
  MicOff,
  Bot,
  Loader2,
  MessageSquare,
  Send,
  Volume2,
  VolumeX
} from 'lucide-react'
import LocalAIAssistant from './LocalAIAssistant'

interface BeautifulVAPIAssistantProps {
  workflowId: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const BeautifulVAPIAssistant: React.FC<BeautifulVAPIAssistantProps> = ({ workflowId, position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isInitialized, setIsInitialized] = useState(true) // Always initialized for local AI
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()

  // Show/hide based on scroll position (hide on hero section)
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.8 // Hide for first 80% of viewport
      setIsVisible(window.scrollY > heroHeight)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right': return 'bottom-6 right-6'
      case 'bottom-left': return 'bottom-6 left-6'
      case 'top-right': return 'top-6 right-6'
      case 'top-left': return 'top-6 left-6'
      default: return 'bottom-6 right-6'
    }
  }

  return (
    <>
      <motion.div 
        className={`fixed ${getPositionClasses()} z-50`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.8,
          y: [0, -12, 0] // Floating animation
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
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      >
        {/* Main Button with AI Image */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          data-ai-assistant-button
          className={`
            relative w-16 h-16 rounded-full
            shadow-2xl overflow-hidden
            border-2 border-white/30
            hover:scale-110 active:scale-95
            transition-all duration-300
            ${!isInitialized ? 'opacity-50' : ''}
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          disabled={!isInitialized}
        >
          {/* AI Image Background */}
          <div className="absolute inset-0">
            <img
              src="/images/artificial-8587685_1280.jpg"
              alt="AI Assistant"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            {/* Fallback gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" style={{ display: 'none' }}></div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40"></div>
            
            {/* Status Icon Overlay - Only show when needed */}
            {isOpen && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <MessageSquare className="w-7 h-7 text-white drop-shadow-lg" />
              </div>
            )}
          </div>
          
          {/* Pulse effect when open */}
          {isOpen && (
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-400/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Local AI Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <LocalAIAssistant 
            isOpen={isOpen} 
            onClose={() => setIsOpen(false)} 
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default BeautifulVAPIAssistant