// Environment configuration
export const config = {
  // OpenAI
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo'
  },
  
  
  // Google Cloud (optional)
  googleCloud: {
    apiKey: import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || ''
  },
  
  // ElevenLabs (optional)
  elevenLabs: {
    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || ''
  },
  
  // App
  app: {
    name: import.meta.env.VITE_APP_NAME || 'VEdit AI Video Editor',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:3003'
  }
}

// Validation helper
export const validateConfig = (): { valid: boolean; missing: string[] } => {
  const missing: string[] = []
  
  if (!config.openai.apiKey) {
    missing.push('VITE_OPENAI_API_KEY')
  }
  
  return {
    valid: missing.length === 0,
    missing
  }
}

// API status check
export const checkAPIStatus = async (): Promise<{
  openai: boolean
  supabase: boolean
}> => {
  return {
    openai: !!config.openai.apiKey,
    supabase: false
  }
}


