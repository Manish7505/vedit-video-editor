import OpenAI from 'openai'

// Initialize OpenAI client
let openaiClient: OpenAI | null = null

export const initOpenAI = (apiKey: string) => {
  openaiClient = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // For demo purposes only
  })
  return openaiClient
}

export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Please set your API key.')
  }
  return openaiClient
}

// AI Chat Completion
export const getChatCompletion = async (
  message: string,
  context?: string
): Promise<string> => {
  try {
    const client = getOpenAIClient()
    
    const systemPrompt = `You are an AI video editing assistant. You help users edit videos through natural language commands.
You can:
- Understand complex editing instructions
- Provide step-by-step editing guidance
- Suggest creative improvements
- Execute video editing commands
- Generate captions and transcriptions
- Analyze video content

Context: ${context || 'User is editing a video in the timeline.'}

Respond concisely and helpfully. If the user gives an editing command, explain what you'll do and provide actionable steps.`

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    return response.choices[0]?.message?.content || 'I apologize, but I could not process that request.'
  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your configuration.')
    }
    throw new Error(`AI processing failed: ${error.message}`)
  }
}

// Analyze video editing command and extract intent
export const analyzeEditingCommand = async (
  command: string,
  videoContext: any
): Promise<{
  intent: string
  action: string
  parameters: any
  confidence: number
}> => {
  try {
    const client = getOpenAIClient()
    
    const analysisPrompt = `Analyze this video editing command and extract the intent, action, and parameters.

Command: "${command}"

Video Context:
- Current time: ${videoContext.currentTime}s
- Duration: ${videoContext.duration}s
- Number of clips: ${videoContext.clipsCount}
- Selected clip: ${videoContext.selectedClip || 'none'}

Return a JSON object with:
- intent: (edit, analyze, create, delete, adjust, navigate)
- action: (specific action like "cut", "add_clip", "change_speed", "add_effect")
- parameters: (object with relevant parameters)
- confidence: (0-1, how confident you are in the interpretation)

Example response:
{
  "intent": "edit",
  "action": "cut_clip",
  "parameters": { "time": 120, "clipId": "clip-1" },
  "confidence": 0.95
}`

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a video editing command parser. Return only valid JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    })

    const content = response.choices[0]?.message?.content || '{}'
    const analysis = JSON.parse(content)
    
    return {
      intent: analysis.intent || 'unknown',
      action: analysis.action || 'none',
      parameters: analysis.parameters || {},
      confidence: analysis.confidence || 0.5
    }
  } catch (error: any) {
    console.error('Command analysis error:', error)
    return {
      intent: 'unknown',
      action: 'none',
      parameters: {},
      confidence: 0
    }
  }
}

// Generate video captions/subtitles
export const generateCaptions = async (
  transcript: string
): Promise<Array<{ start: number; end: number; text: string }>> => {
  try {
    const client = getOpenAIClient()
    
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a caption generator. Break the transcript into timed captions (5-7 words each). Return JSON array with start, end, text.'
        },
        {
          role: 'user',
          content: `Generate captions for this transcript:\n\n${transcript}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const content = response.choices[0]?.message?.content || '[]'
    return JSON.parse(content)
  } catch (error) {
    console.error('Caption generation error:', error)
    return []
  }
}

// Suggest video improvements
export const suggestImprovements = async (
  videoData: any
): Promise<string[]> => {
  try {
    const client = getOpenAIClient()
    
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a video editing expert. Analyze the video and suggest 5 specific improvements.'
        },
        {
          role: 'user',
          content: `Video details:\n${JSON.stringify(videoData, null, 2)}\n\nProvide 5 actionable suggestions.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const content = response.choices[0]?.message?.content || ''
    return content.split('\n').filter(line => line.trim().length > 0)
  } catch (error) {
    console.error('Improvement suggestion error:', error)
    return []
  }
}

// Text-to-Speech (using OpenAI TTS)
export const generateVoiceover = async (
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'
): Promise<Blob | null> => {
  try {
    const client = getOpenAIClient()
    
    const response = await client.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
    })

    const blob = await response.blob()
    return blob
  } catch (error) {
    console.error('Voice generation error:', error)
    return null
  }
}


