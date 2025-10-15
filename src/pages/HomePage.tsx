import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUser, SignInButton, UserButton } from '@clerk/clerk-react'
import { 
  Bot, 
  Users, 
  Star, 
  ArrowRight,
  CheckCircle,
  Headphones,
  Sparkles,
  Scissors,
  Music,
  Layers,
  Film,
  Clock,
  Wand2,
  Download,
  MessageCircle
} from 'lucide-react'

const HomePage = () => {
  const navigate = useNavigate()
  const { isSignedIn, user } = useUser()

  // Function to trigger AI assistant
  const openAIAssistant = () => {
    // First, scroll down to make sure the assistant is visible
    window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' })
    
    // Wait a bit for the scroll to complete, then try to click the assistant
    setTimeout(() => {
      const assistantButton = document.querySelector('[data-ai-assistant-button]') as HTMLElement
      if (assistantButton && assistantButton.style.pointerEvents !== 'none') {
        assistantButton.click()
      } else {
        // If assistant is not visible yet, scroll to bottom
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }
    }, 500)
  }

  const features = [
    {
      icon: <Scissors className="w-7 h-7" />,
      title: "Multi-Track Editing",
      description: "Professional timeline with unlimited video, audio, and graphic tracks for complex projects",
      video: "/5092427-hd_1920_1080_30fps.mp4"
    },
    {
      icon: <Bot className="w-7 h-7" />,
      title: "AI Assistant",
      description: "Smart editing suggestions, auto-cuts, and intelligent scene detection powered by AI",
      video: "/ai assistent.mp4"
    },
    {
      icon: <Wand2 className="w-7 h-7" />,
      title: "Auto Effects",
      description: "Apply professional effects, transitions, and color grading with one click",
      video: "/auto effect.mp4"
    },
    {
      icon: <Music className="w-7 h-7" />,
      title: "Audio Enhancement",
      description: "Advanced audio mixing, noise reduction, and voice enhancement tools",
      video: "/8100345-uhd_2160_4096_25fps.mp4"
    },
    {
      icon: <Film className="w-7 h-7" />,
      title: "Video Templates",
      description: "Professionally designed templates for quick video creation and editing",
      video: "/8642053-uhd_4096_2160_25fps.mp4"
    },
    {
      icon: <Layers className="w-7 h-7" />,
      title: "Layer Management",
      description: "Organize and manage multiple layers with precision control and masking",
      video: "/layer managment.mp4"
    }
  ]

  const workflows = [
    {
      title: "Professional Timeline Editing",
      description: "Work with unlimited tracks, precise trimming, and frame-accurate editing. Our timeline interface is designed for professional video editors who need full control over every aspect of their project.",
      features: ["Unlimited Tracks", "Frame-Accurate Editing", "Ripple & Roll Editing", "Magnetic Timeline"],
      video: "/4994156-uhd_2160_3840_25fps.mp4",
      icon: <Clock className="w-6 h-6" />
    },
    {
      title: "AI-Powered Smart Editing",
      description: "Let AI handle the heavy lifting with automatic scene detection, smart cuts, and intelligent transitions. Save hours of editing time while maintaining professional quality.",
      features: ["Auto Scene Detection", "Smart Cuts", "AI Transitions", "Content Analysis"],
      video: "/5092427-hd_1920_1080_30fps.mp4",
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      title: "Advanced Audio Control",
      description: "Professional audio editing with multi-track mixing, real-time effects, and advanced noise reduction. Perfect audio quality for your videos with intuitive controls.",
      features: ["Multi-Track Mixing", "Noise Reduction", "Audio Effects", "Voice Enhancement"],
      video: "/8100345-uhd_2160_4096_25fps.mp4",
      icon: <Headphones className="w-6 h-6" />
    }
  ]

  const stats = [
    { number: "50K+", label: "Active Editors" },
    { number: "1M+", label: "Videos Edited" },
    { number: "99.9%", label: "Uptime" },
    { number: "4.9★", label: "User Rating" }
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-7xl px-6">
        <nav className="bg-black/40 backdrop-blur-xl border border-white/40 rounded-full px-6 py-3.5 shadow-2xl">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img
                src="/images/vedit-logo.png"
                alt="VEdit Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-white">VEdit</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors text-sm">Features</a>
              <a href="#pricing" className="text-white/80 hover:text-white transition-colors text-sm">Pricing</a>
              <button 
                onClick={openAIAssistant}
                className="text-white/80 hover:text-white transition-colors text-sm cursor-pointer"
              >
                Help
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button className="md:hidden text-white/80 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center gap-4">
              <motion.a 
                href="#contact" 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white transition-colors text-sm whitespace-nowrap rounded-full hover:bg-white/10"
                title="Contact Us"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Contact Sales</span>
              </motion.a>
              <button 
                onClick={() => navigate('/editor')}
                className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-300 transition-colors text-sm"
              >
                Free Trial
              </button>
              
              {/* Clerk Authentication */}
              {isSignedIn ? (
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm hidden sm:inline">
                    Welcome, {user?.firstName}
                  </span>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-white font-semibold rounded-full transition-colors text-sm border border-white/20 hover:bg-white/10">
                    Log in
                  </button>
                </SignInButton>
              )}
              {false && (
                <>
                  <motion.button 
                    onClick={() => navigate('/editor')}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm shadow-lg hover:shadow-xl border border-blue-500/20"
                  >
                    <span className="flex items-center gap-2">
                      <Film className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                      Open Editor
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </motion.button>
                  <motion.a 
                    href="#contact" 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-10 h-10 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 border border-white/20 hover:border-white/40"
                    title="Contact Us"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </motion.a>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Profile icon removed with Clerk */}
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Hero Section with Video Background - EXACT SAME AS BEFORE */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/herovideo.mp4" type="video/mp4" />
          </video>
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60" />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center pt-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-5xl mx-auto"
          >
            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight"
            >
              Create Stunning Videos with
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 font-extrabold">
                AI-Powered Editing
              </span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-normal"
            >
              Professional video editing made simple - Multi-track editing, AI chatbot assistance, and voice features in one platform
            </motion.p>
          </motion.div>
        </div>

        {/* Bottom Section - Buttons and Trust Indicators */}
        <div className="absolute bottom-8 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center"
            >
              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
              >
                <motion.button
                  onClick={() => navigate('/editor')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl border-2 border-blue-500/30 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25"
                >
                  <span className="flex items-center gap-3">
                    <Film className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    Start Creating Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-transparent text-white font-medium text-base border-2 border-white/50 hover:border-white hover:bg-white/10 rounded-lg transition-all duration-300 backdrop-blur-sm"
                >
                  Watch Demo
                </motion.button>
              </motion.div>
              
              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-300"
              >
                <div className="flex items-center px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <CheckCircle className="w-3 h-3 mr-1.5 text-green-400" />
                  <span className="font-medium">No credit card required</span>
                </div>
                <div className="flex items-center px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <CheckCircle className="w-3 h-3 mr-1.5 text-green-400" />
                  <span className="font-medium">Free trial available</span>
                </div>
                <div className="flex items-center px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <CheckCircle className="w-3 h-3 mr-1.5 text-green-400" />
                  <span className="font-medium">Cancel anytime</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="absolute bottom-6 left-6 right-6 z-10"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center text-white/70 text-xs">
              <div className="flex items-center space-x-4 mb-2 md:mb-0">
                <span className="font-medium">Trusted by 50K+ creators</span>
                <span className="font-medium">⭐ 4.9/5 User Rating</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs">Professional video editing made simple</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-12 bg-zinc-900 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-black text-white mb-1">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
        
      {/* Features Grid Section */}
      <section id="features" className="relative py-24 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-gray-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Powerful Editing Tools
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Everything You Need to Edit
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Professional video editing tools designed for creators, filmmakers, and content producers
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative h-full bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all duration-500">
                  {/* Video Background */}
                  <div className="relative aspect-video overflow-hidden">
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                    >
                      <source src={feature.video} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
                  </div>

                  <div className="relative p-6 -mt-16">
                    <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-4 group-hover:bg-zinc-700 transition-all duration-300">
                    {feature.icon}
                    </div>
                  
                    <h3 className="text-xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  
                    <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Sections with Large Videos */}
      <section className="relative py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Professional Editing Workflows
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Streamlined workflows designed for professional video production
            </p>
          </motion.div>
          
          <div className="space-y-32">
            {workflows.map((workflow, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className={`grid md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:grid-flow-dense' : ''}`}
              >
                {/* Video Side */}
                <div className={`${index % 2 === 1 ? 'md:col-start-2' : ''}`}>
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      <source src={workflow.video} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                </div>

                {/* Content Side */}
                <div className={`${index % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}`}>
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-6">
                    {workflow.icon}
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    {workflow.title}
                  </h3>
                  
                  <p className="text-gray-400 text-lg leading-relaxed mb-8">
                    {workflow.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {workflow.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features with Videos */}
      <section className="relative py-24 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Advanced Features
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Take your editing to the next level with professional-grade tools
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Real-Time Collaboration",
                description: "Work together with your team in real-time. Share projects, leave comments, and edit simultaneously.",
                icon: <Users className="w-6 h-6" />,
                video: "/8642053-uhd_4096_2160_25fps.mp4"
              },
              {
                title: "Export & Delivery",
                description: "Export in any format, resolution, or codec. Optimized presets for social media, broadcast, and cinema.",
                icon: <Download className="w-6 h-6" />,
                video: "/3936776-hd_1920_1080_25fps.mp4"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group relative"
              >
                <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all duration-500">
                  {/* Video */}
                  <div className="relative aspect-video overflow-hidden">
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500"
                    >
                      <source src={item.video} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent" />
                  </div>
                  
                  <div className="relative p-8 -mt-20">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-4">
                      {item.icon}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Loved by Video Editors
             </h2>
            <p className="text-xl text-gray-400">
              Trusted by professionals worldwide
             </p>
           </motion.div>
           
           <div className="grid md:grid-cols-3 gap-8">
             {[
               {
                name: "Sarah Chen",
                role: "Content Creator",
                content: "VEdit has revolutionized my workflow. The AI assistant helps me edit 3x faster while maintaining professional quality.",
                rating: 5
              },
              {
                name: "Mike Rodriguez",
                role: "Film Producer",
                content: "The multi-track editing and audio tools are incredible. This is now my go-to editor for all projects.",
                rating: 5
              },
              {
                name: "Emma Thompson",
                role: "Marketing Manager",
                content: "Our team's video production became so much more efficient. The collaboration features are game-changing.",
                rating: 5
              }
            ].map((testimonial, index) => (
               <motion.div
                 key={index}
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 hover:border-zinc-700 transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                   </div>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {testimonial.role}
                     </div>
                   </div>
                 </div>
               </motion.div>
             ))}
           </div>
         </div>
       </section>

       {/* CTA Section */}
      <section className="relative py-24 bg-black">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Start Editing Like a Pro
            </h2>
            
            <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
              Join thousands of video editors and creators using VEdit to bring their vision to life
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <motion.button
                onClick={() => navigate('/editor')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-white text-black font-bold text-lg rounded-xl shadow-2xl hover:bg-gray-100 transition-all"
              >
                <span className="flex items-center justify-center">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-zinc-900 text-white font-semibold text-lg border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
              >
                Watch Demo
              </motion.button>
            </div>

            <div className="text-gray-500 text-sm">
              No credit card required • 14-day free trial • Cancel anytime
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-zinc-950">
        {/* Top Border with Gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Main Content */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="/images/vedit-logo.png"
                  alt="VEdit Logo"
                  className="w-8 h-8 object-contain"
                />
                <span className="text-2xl font-black text-white">VEdit</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
                Professional video editing software for creators who demand excellence. 
                Transform your vision into reality.
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">50K+</div>
                  <div className="text-xs text-gray-500">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">1M+</div>
                  <div className="text-xs text-gray-500">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">4.9★</div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                {['Features', 'Pricing', 'Templates', 'API Docs', 'Help Center', 'Contact'].map((link) => (
                  <a key={link} href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                    {link}
                  </a>
                ))}
              </div>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <div className="space-y-2">
                {['Tutorials', 'Blog', 'Community', 'Status', 'Changelog', 'Support'].map((link) => (
                  <a key={link} href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-zinc-900 rounded-2xl p-6 mb-8 border border-zinc-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold mb-1">Stay in the loop</h3>
                <p className="text-gray-400 text-sm">Get updates on new features and tips</p>
              </div>
              <div className="flex w-full md:w-auto gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 md:w-64 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-zinc-600"
                />
                <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-zinc-800">
            <div className="text-gray-500 text-sm">
              © 2024 VEdit. All rights reserved.
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default HomePage
