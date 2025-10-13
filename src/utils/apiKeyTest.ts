// API Key Test Utility
export const testApiKey = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  console.log('🔍 API Key Test:')
  console.log('- Environment:', import.meta.env.MODE)
  console.log('- API Key exists:', !!apiKey)
  console.log('- API Key length:', apiKey?.length || 0)
  console.log('- API Key starts with:', apiKey?.substring(0, 10) || 'N/A')
  console.log('- Full API Key:', apiKey)
  
  return {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    startsWith: apiKey?.substring(0, 10) || 'N/A',
    fullKey: apiKey
  }
}

// Test OpenAI API key format
export const validateOpenAIKey = (key: string): boolean => {
  // OpenAI API keys should start with 'sk-' and be around 50+ characters
  return key && key.startsWith('sk-') && key.length > 40
}
