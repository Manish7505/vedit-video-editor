import { getOpenAIClient } from './openai'

// Advanced Script Generation Service for VAIA Brain

export interface ScriptSection {
  type: 'intro' | 'main' | 'conclusion' | 'cta'
  content: string
  duration: number
  notes?: string
}

export interface VideoScript {
  title: string
  hook: string
  sections: ScriptSection[]
  totalDuration: number
  targetAudience: string
  tone: string
}

export interface BrainstormIdea {
  title: string
  description: string
  targetAudience: string
  estimatedViews: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
}

export class ScriptGeneratorService {
  private static instance: ScriptGeneratorService
  
  private constructor() {}
  
  static getInstance(): ScriptGeneratorService {
    if (!ScriptGeneratorService.instance) {
      ScriptGeneratorService.instance = new ScriptGeneratorService()
    }
    return ScriptGeneratorService.instance
  }

  // Generate video titles
  async generateTitles(topic: string, count: number = 10): Promise<string[]> {
    try {
      const client = getOpenAIClient()
      
      const prompt = `Generate ${count} engaging, click-worthy video titles about: "${topic}".

Requirements:
- Attention-grabbing and SEO-friendly
- Mix of different styles (how-to, listicle, question, emotional)
- 50-70 characters each
- Include power words
- Make them shareable

Return as a JSON array of strings.`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert content strategist and YouTube consultant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 800
      })

      const content = response.choices[0]?.message?.content || '[]'
      return JSON.parse(content)
    } catch (error) {
      console.error('Title generation error:', error)
      return [
        `The Ultimate Guide to ${topic}`,
        `${topic}: Everything You Need to Know`,
        `How to Master ${topic} in 2024`,
        `${topic} Secrets Revealed`,
        `Why ${topic} Matters More Than Ever`
      ]
    }
  }

  // Generate video outline
  async generateOutline(topic: string, duration: number = 10): Promise<string[]> {
    try {
      const client = getOpenAIClient()
      
      const prompt = `Create a detailed video outline for a ${duration}-minute video about: "${topic}".

Requirements:
- Clear structure with timestamps
- Engaging flow
- Include hook, main points, and conclusion
- Add CTA (call-to-action)
- Make it actionable

Return as a JSON array of strings (each item is a section with timestamp).`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional video producer and content strategist.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600
      })

      const content = response.choices[0]?.message?.content || '[]'
      return JSON.parse(content)
    } catch (error) {
      console.error('Outline generation error:', error)
      return [
        '0:00 - Hook: Grab attention',
        '0:30 - Introduction',
        '1:00 - Main Point 1',
        '3:00 - Main Point 2',
        '5:00 - Main Point 3',
        '8:00 - Conclusion',
        '9:00 - Call to Action'
      ]
    }
  }

  // Generate complete video script
  async generateFullScript(
    topic: string,
    duration: number = 10,
    tone: 'professional' | 'casual' | 'educational' | 'entertaining' = 'professional'
  ): Promise<VideoScript> {
    try {
      const client = getOpenAIClient()
      
      const prompt = `Create a complete ${duration}-minute video script about: "${topic}".

Tone: ${tone}
Requirements:
- Engaging hook (first 15 seconds)
- Clear structure with sections
- Natural, conversational language
- Include timestamps
- Add presenter notes
- Strong call-to-action

Return as JSON with this structure:
{
  "title": "string",
  "hook": "string",
  "sections": [
    {
      "type": "intro|main|conclusion|cta",
      "content": "string",
      "duration": number,
      "notes": "string"
    }
  ],
  "totalDuration": number,
  "targetAudience": "string",
  "tone": "string"
}`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional scriptwriter for video content.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })

      const content = response.choices[0]?.message?.content || '{}'
      return JSON.parse(content)
    } catch (error) {
      console.error('Script generation error:', error)
      return {
        title: `${topic} - Complete Guide`,
        hook: `Have you ever wondered about ${topic}? In this video, I'll show you everything you need to know!`,
        sections: [
          {
            type: 'intro',
            content: `Welcome back to the channel! Today we're diving deep into ${topic}.`,
            duration: 30,
            notes: 'Smile and be enthusiastic'
          },
          {
            type: 'main',
            content: `Let's start with the basics of ${topic}...`,
            duration: 480,
            notes: 'Show examples and visuals'
          },
          {
            type: 'conclusion',
            content: `So that's everything you need to know about ${topic}!`,
            duration: 60,
            notes: 'Recap key points'
          },
          {
            type: 'cta',
            content: 'If you found this helpful, don\'t forget to like and subscribe!',
            duration: 30,
            notes: 'Point to subscribe button'
          }
        ],
        totalDuration: duration * 60,
        targetAudience: 'General audience',
        tone: tone
      }
    }
  }

  // Generate voiceover script
  async generateVoiceover(visualDescription: string): Promise<string> {
    try {
      const client = getOpenAIClient()
      
      const prompt = `Create a natural, engaging voiceover script for this visual: "${visualDescription}".

Requirements:
- Conversational and natural
- Match the visual timing
- Include pauses [PAUSE]
- Add emphasis markers *word*
- Keep it concise

Return just the voiceover text.`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional voiceover artist and scriptwriter.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      })

      return response.choices[0]?.message?.content || 'Voiceover script here...'
    } catch (error) {
      console.error('Voiceover generation error:', error)
      return 'This is an amazing moment... [PAUSE] Let me show you what happens next.'
    }
  }

  // Brainstorm video ideas
  async brainstormIdeas(niche: string, count: number = 10): Promise<BrainstormIdea[]> {
    try {
      const client = getOpenAIClient()
      
      const prompt = `Brainstorm ${count} viral video ideas for the "${niche}" niche.

Requirements:
- Trending and relevant
- Unique angles
- High engagement potential
- Varied difficulty levels
- Include target audience
- Estimate viral potential

Return as JSON array with this structure:
[{
  "title": "string",
  "description": "string",
  "targetAudience": "string",
  "estimatedViews": "string (e.g., '10K-50K')",
  "difficulty": "easy|medium|hard",
  "tags": ["string"]
}]`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a viral content strategist and trend analyst.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 1200
      })

      const content = response.choices[0]?.message?.content || '[]'
      return JSON.parse(content)
    } catch (error) {
      console.error('Brainstorming error:', error)
      return [
        {
          title: `${niche} Beginner's Guide`,
          description: `A comprehensive introduction to ${niche} for newcomers`,
          targetAudience: 'Beginners',
          estimatedViews: '10K-50K',
          difficulty: 'easy',
          tags: [niche, 'tutorial', 'guide']
        }
      ]
    }
  }

  // Analyze and improve existing script
  async improveScript(existingScript: string): Promise<{ improved: string; suggestions: string[] }> {
    try {
      const client = getOpenAIClient()
      
      const prompt = `Analyze and improve this video script:

"${existingScript}"

Provide:
1. Improved version of the script
2. List of specific suggestions for enhancement

Return as JSON:
{
  "improved": "string",
  "suggestions": ["string"]
}`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional script editor and content consultant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })

      const content = response.choices[0]?.message?.content || '{}'
      return JSON.parse(content)
    } catch (error) {
      console.error('Script improvement error:', error)
      return {
        improved: existingScript,
        suggestions: [
          'Add a stronger hook in the first 15 seconds',
          'Include more specific examples',
          'Strengthen the call-to-action',
          'Add emotional elements'
        ]
      }
    }
  }
}

export const scriptGenerator = ScriptGeneratorService.getInstance()

