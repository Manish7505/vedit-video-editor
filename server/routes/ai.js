const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenRouter API client
let openrouter = null;
if (process.env.OPENROUTER_API_KEY) {
  openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });
}

// Available OpenRouter models (free and paid)
const AVAILABLE_MODELS = {
  // Free models (high quality)
  'meta-llama/llama-3.3-70b-instruct': 'Llama 3.3 70B (Free) - Best overall performance, multilingual',
  'qwen/qwen-2.5-72b-instruct': 'Qwen 2.5 72B (Free) - Large context, 29+ languages',
  'qwen/qwen-2.5-coder-32b-instruct': 'Qwen Coder 32B (Free) - Great for coding tasks',
  'deepseek/deepseek-chat': 'DeepSeek Chat (Free) - Excellent for text understanding',
  'moonshot/moonshot-v1-8k': 'Moonshot (Free) - General purpose',
  'meta-llama/llama-3.2-3b-instruct': 'Llama 3.2 3B (Free) - Fast and efficient',
  'mistral/mistral-nemo-12b-instruct': 'Mistral Nemo 12B (Free) - Balanced performance',
  'google/gemma-2-9b-instruct': 'Gemma 2 9B (Free) - Google\'s model',
  'mistral/mistral-7b-instruct': 'Mistral 7B (Free) - Industry standard',
  
  // Paid models (premium)
  'openai/gpt-4o-mini': 'GPT-4o Mini (Paid) - Fast and efficient',
  'openai/gpt-4o': 'GPT-4o (Paid) - Most capable',
  'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet (Paid) - Excellent reasoning'
};

// Default model (can be changed via environment variable)
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';

// Validation rules
const chatValidation = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .trim(),
  body('context')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Context cannot exceed 2000 characters')
];

// @route   POST /api/ai/chat
// @desc    Get AI chat response
// @access  Private
router.post('/chat', chatValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { message, context = '' } = req.body;

    if (!openrouter) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure OpenRouter API key.',
        code: 'AI_SERVICE_UNAVAILABLE'
      });
    }

    try {
      const systemPrompt = `You are an AI video editing assistant for VEdit. You help users with video editing tasks, provide creative suggestions, and execute video editing commands.

Current video context: ${context}

You can help with:
- Video editing commands (play, pause, add clips, split, etc.)
- Creative suggestions for video content
- Technical advice about video editing
- Troubleshooting editing issues
- Best practices for video production

Keep responses concise, helpful, and focused on video editing. If the user asks about non-video editing topics, politely redirect them back to video editing.`;

      const completion = await openrouter.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const aiResponse = completion.choices[0].message.content;

      res.json({
        success: true,
        data: {
          message: aiResponse,
          timestamp: new Date()
        }
      });

    } catch (openrouterError) {
      console.error('OpenRouter API error:', openrouterError);
      
      if (openrouterError.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'Invalid OpenRouter API key',
          code: 'INVALID_API_KEY'
        });
      }

      if (openrouterError.status === 429) {
        return res.status(429).json({
          success: false,
          message: 'OpenRouter API rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      throw openrouterError;
    }

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'AI chat failed',
      code: 'CHAT_ERROR'
    });
  }
});

// @route   POST /api/ai/execute-command
// @desc    Execute AI video editing command
// @access  Private
router.post('/execute-command', async (req, res) => {
  try {
    const { command, videoContext } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required',
        code: 'COMMAND_REQUIRED'
      });
    }

    if (!openrouter) {
      return res.status(503).json({
        success: false,
        message: 'AI service not available',
        code: 'AI_UNAVAILABLE'
      });
    }

    // Use AI to analyze and execute the command
    const systemPrompt = `You are an AI video editing assistant. Analyze the user's command and determine the appropriate action to take.

Available actions:
- play: Control video playback (play/pause)
- seek: Jump to specific time
- addClip: Add new video/audio clip
- deleteClip: Remove selected clip
- splitClip: Split clip at current position
- addFilter: Apply visual effects
- addText: Add text overlay
- adjustVolume: Change audio volume
- trimClip: Trim clip duration

Current video context:
- Current time: ${videoContext?.currentTime || 0}s
- Duration: ${videoContext?.duration || 0}s
- Clips count: ${videoContext?.clipsCount || 0}
- Selected clip: ${videoContext?.selectedClip || 'none'}
- Playback state: ${videoContext?.playbackState || 'paused'}

Respond with a JSON object containing:
{
  "action": "action_name",
  "confidence": 0.0-1.0,
  "message": "Description of what will happen",
  "data": { /* action-specific data */ }
}

Be confident (0.8+) for clear commands, lower confidence for ambiguous requests.`;

    const completion = await openrouter.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: command }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const aiResponse = completion.choices[0]?.message?.content;
    let result;

    try {
      result = JSON.parse(aiResponse);
      // Ensure confidence is set
      if (typeof result.confidence !== 'number') {
        result.confidence = 0.8;
      }
    } catch (parseError) {
      console.error('AI response parsing failed:', parseError);
      console.error('AI response:', aiResponse);
      
      // Fallback to basic command parsing if AI response is not valid JSON
      const lowerCommand = command.toLowerCase();
      result = { 
        action: 'unknown', 
        confidence: 0.1, 
        message: 'Command not recognized. Try: "play video", "add clip", or "jump to 1:30"' 
      };
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Execute command error:', error);
    res.status(500).json({
      success: false,
      message: 'Command execution failed',
      code: 'COMMAND_ERROR'
    });
  }
});

// @route   GET /api/ai/status
// @desc    Get AI service status
// @access  Private
router.get('/status', async (req, res) => {
  try {
    const status = {
      available: !!openrouter,
      service: 'OpenRouter',
      model: DEFAULT_MODEL,
      modelDescription: AVAILABLE_MODELS[DEFAULT_MODEL] || 'Custom model',
      availableModels: AVAILABLE_MODELS,
      features: [
        'Chat assistance',
        'Command execution',
        'Video editing suggestions',
        'Creative advice'
      ]
    };

    if (openrouter) {
      try {
        // Test API connection
        await openrouter.models.list();
        status.connected = true;
        status.message = 'AI service is ready';
      } catch (error) {
        status.connected = false;
        status.message = 'AI service connection failed';
        status.error = error.message;
      }
    } else {
      status.connected = false;
      status.message = 'AI service not configured';
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI status',
      code: 'STATUS_ERROR'
    });
  }
});

// @route   POST /api/ai/suggestions
// @desc    Get AI-powered editing suggestions
// @access  Private
router.post('/suggestions', async (req, res) => {
  try {
    const { projectData, type = 'general' } = req.body;

    if (!openrouter) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available',
        code: 'AI_SERVICE_UNAVAILABLE'
      });
    }

    let prompt = '';
    
    switch (type) {
      case 'transitions':
        prompt = 'Suggest creative video transitions for a professional video editor. Provide 5 specific transition ideas with brief descriptions.';
        break;
      case 'effects':
        prompt = 'Suggest video effects that would enhance a video editor. Provide 5 specific effect ideas with brief descriptions.';
        break;
      case 'music':
        prompt = 'Suggest background music styles and moods for different types of videos (corporate, creative, educational, etc.). Provide 5 suggestions.';
        break;
      case 'color':
        prompt = 'Suggest color grading styles and moods for video editing. Provide 5 specific color grading ideas with brief descriptions.';
        break;
      default:
        prompt = 'Provide 5 general video editing tips and suggestions for improving video content.';
    }

    try {
      const completion = await openrouter.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional video editor providing creative suggestions. Keep responses concise and actionable.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300,
      });

      const suggestions = completion.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          type,
          suggestions,
          timestamp: new Date()
        }
      });

    } catch (openrouterError) {
      console.error('OpenRouter suggestions error:', openrouterError);
      throw openrouterError;
    }

  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI suggestions',
      code: 'SUGGESTIONS_ERROR'
    });
  }
});

module.exports = router;

