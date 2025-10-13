import { getOpenAIClient } from './openai'
import type { AIGeneratedContent, PublishingContent } from '../types/publishing'

// AI Content Generation Service for Vport

export class AIContentGenerator {
  private static instance: AIContentGenerator
  
  private constructor() {}
  
  static getInstance(): AIContentGenerator {
    if (!AIContentGenerator.instance) {
      AIContentGenerator.instance = new AIContentGenerator()
    }
    return AIContentGenerator.instance
  }

  // Generate AI-powered captions
  async generateCaptions(videoDescription: string, platform: string): Promise<string[]> {
    try {
      const client = getOpenAIClient()
      
      const prompt = `Generate 5 engaging captions for a ${platform} video about: "${videoDescription}".
      
Requirements:
- Keep captions concise and engaging
- Include relevant emojis
- Make them platform-appropriate
- Vary the tone (professional, casual, funny, inspiring, informative)

Return as a JSON array of strings.`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a social media content expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      })

      const content = response.choices[0]?.message?.content || '[]'
      return JSON.parse(content)
    } catch (error) {
      console.error('Caption generation error:', error)
      return [
        'Check out this amazing video! 🎬',
        'New content alert! 🚀',
        'You don\'t want to miss this! ✨',
        'Fresh content just dropped! 🔥',
        'Watch till the end! 👀'
      ]
    }
  }

  // Generate AI-powered hashtags
  async generateHashtags(videoDescription: string, platform: string): Promise<string[]> {
    try {
      const client = getOpenAIClient()
      
      const prompt = `Generate 10-15 relevant hashtags for a ${platform} video about: "${videoDescription}".
      
Requirements:
- Mix of popular and niche hashtags
- Platform-appropriate
- Trending when possible
- No spaces in hashtags

Return as a JSON array of strings (without # symbol).`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a social media marketing expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })

      const content = response.choices[0]?.message?.content || '[]'
      const hashtags = JSON.parse(content)
      return hashtags.map((tag: string) => tag.replace('#', ''))
    } catch (error) {
      console.error('Hashtag generation error:', error)
      return ['video', 'content', 'viral', 'trending', 'fyp', 'explore', 'creative', 'amazing']
    }
  }

  // Generate AI-powered titles
  async generateTitles(videoDescription: string, platform: string): Promise<string[]> {
    try {
      const client = getOpenAIClient()
      
      const prompt = `Generate 5 engaging video titles for ${platform} about: "${videoDescription}".
      
Requirements:
- Attention-grabbing and clickable
- SEO-friendly
- Platform-appropriate length
- Vary the style (question, statement, how-to, listicle, emotional)

Return as a JSON array of strings.`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a content strategist and copywriter.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 400
      })

      const content = response.choices[0]?.message?.content || '[]'
      return JSON.parse(content)
    } catch (error) {
      console.error('Title generation error:', error)
      return [
        'Amazing Video You Need to See!',
        'This Changed Everything...',
        'You Won\'t Believe What Happened!',
        'The Ultimate Guide',
        'Watch This Now!'
      ]
    }
  }

  // Generate AI-powered descriptions
  async generateDescriptions(videoDescription: string, platform: string): Promise<string[]> {
    try {
      const client = getOpenAIClient()
      
      const prompt = `Generate 3 engaging video descriptions for ${platform} about: "${videoDescription}".
      
Requirements:
- Compelling and informative
- Include call-to-action
- SEO-friendly
- Platform-appropriate length
- Vary the tone

Return as a JSON array of strings.`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a content marketing specialist.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600
      })

      const content = response.choices[0]?.message?.content || '[]'
      return JSON.parse(content)
    } catch (error) {
      console.error('Description generation error:', error)
      return [
        'Check out this amazing content! Like and subscribe for more.',
        'New video alert! Don\'t forget to hit that notification bell.',
        'Hope you enjoy this video! Share with your friends!'
      ]
    }
  }

  // Generate complete AI content package
  async generateCompleteContent(
    videoDescription: string,
    platform: string
  ): Promise<AIGeneratedContent> {
    const [captions, hashtags, titles, descriptions] = await Promise.all([
      this.generateCaptions(videoDescription, platform),
      this.generateHashtags(videoDescription, platform),
      this.generateTitles(videoDescription, platform),
      this.generateDescriptions(videoDescription, platform)
    ])

    return {
      captions,
      hashtags,
      titles,
      descriptions,
      thumbnails: [] // Thumbnail generation would require image AI
    }
  }

  // Optimize content for specific platform
  async optimizeForPlatform(
    content: Partial<PublishingContent>,
    platform: string
  ): Promise<PublishingContent> {
    const optimized: PublishingContent = {
      title: content.title || '',
      description: content.description || '',
      hashtags: content.hashtags || [],
      videoUrl: content.videoUrl || '',
      visibility: content.visibility || 'public'
    }

    // Platform-specific optimizations
    switch (platform.toLowerCase()) {
      case 'youtube':
        // YouTube allows longer titles and descriptions
        if (!optimized.title) {
          const titles = await this.generateTitles(optimized.description, 'YouTube')
          optimized.title = titles[0]
        }
        break
        
      case 'instagram':
        // Instagram prefers shorter captions with more hashtags
        if (optimized.hashtags.length === 0) {
          optimized.hashtags = await this.generateHashtags(optimized.description, 'Instagram')
        }
        break
        
      case 'tiktok':
        // TikTok prefers short, punchy content
        if (!optimized.title || optimized.title.length > 100) {
          const titles = await this.generateTitles(optimized.description, 'TikTok')
          optimized.title = titles[0].substring(0, 100)
        }
        break
        
      case 'twitter':
        // Twitter has character limits
        if (optimized.description.length > 280) {
          optimized.description = optimized.description.substring(0, 277) + '...'
        }
        break
    }

    return optimized
  }
}

export const aiContentGenerator = AIContentGenerator.getInstance()

