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
  'deepseek/deepseek-chat': 'DeepSeek Chat (Free) - Excellent for text understanding',
  'qwen/qwen-2.5-coder-7b-instruct': 'Qwen Coder (Free) - Great for coding tasks',
  'moonshot/moonshot-v1-8k': 'Moonshot (Free) - General purpose',
  'meta-llama/llama-3.1-8b-instruct': 'Llama 3.1 (Free) - Meta\'s model',
  
  // Paid models (premium)
  'openai/gpt-4o-mini': 'GPT-4o Mini (Paid) - Fast and efficient',
  'openai/gpt-4o': 'GPT-4o (Paid) - Most capable',
  'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet (Paid) - Excellent reasoning'
};

// Default model (can be changed via environment variable)
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

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
    const { command, projectData } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required',
        code: 'COMMAND_REQUIRED'
      });
    }

    // Parse the command and execute appropriate action
    const lowerCommand = command.toLowerCase();
    let result = { success: false, message: 'Command not recognized' };

    // Basic command parsing
    if (lowerCommand.includes('play') || lowerCommand.includes('start')) {
      result = {
        success: true,
        message: 'Playing video...',
        action: 'play',
        data: { isPlaying: true }
      };
    } else if (lowerCommand.includes('pause') || lowerCommand.includes('stop')) {
      result = {
        success: true,
        message: 'Paused video...',
        action: 'pause',
        data: { isPlaying: false }
      };
    } else if (lowerCommand.includes('jump to') || lowerCommand.includes('go to')) {
      const timeMatch = lowerCommand.match(/(\d+):(\d+)/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1]);
        const seconds = parseInt(timeMatch[2]);
        const newTime = minutes * 60 + seconds;
        result = {
          success: true,
          message: `Jumped to ${timeMatch[0]}`,
          action: 'seek',
          data: { currentTime: newTime }
        };
      } else {
        result = {
          success: false,
          message: 'Please specify time in MM:SS format (e.g., "jump to 1:30")'
        };
      }
    } else if (lowerCommand.includes('add clip') || lowerCommand.includes('insert clip')) {
      result = {
        success: true,
        message: 'Added new clip to timeline',
        action: 'addClip',
        data: {
          clip: {
            id: `clip-${Date.now()}`,
            name: 'AI Generated Clip',
            type: 'video',
            startTime: projectData?.currentTime || 0,
            endTime: (projectData?.currentTime || 0) + 5,
            duration: 5,
            url: '/herovideo.mp4'
          }
        }
      };
    } else if (lowerCommand.includes('delete clip') || lowerCommand.includes('remove clip')) {
      if (projectData?.selectedClipId) {
        result = {
          success: true,
          message: 'Deleted selected clip',
          action: 'deleteClip',
          data: { clipId: projectData.selectedClipId }
        };
      } else {
        result = {
          success: false,
          message: 'Please select a clip first'
        };
      }
    } else if (lowerCommand.includes('split clip')) {
      if (projectData?.selectedClipId) {
        result = {
          success: true,
          message: 'Split clip at current position',
          action: 'splitClip',
          data: {
            clipId: projectData.selectedClipId,
            splitTime: projectData?.currentTime || 0
          }
        };
      } else {
        result = {
          success: false,
          message: 'Please select a clip and position the playhead where you want to split'
        };
      }
    } else if (lowerCommand.includes('remove filler words')) {
      result = {
        success: true,
        message: 'Analyzing audio for filler words... (Feature coming soon)',
        action: 'removeFillerWords',
        data: {}
      };
    } else if (lowerCommand.includes('auto cut') || lowerCommand.includes('remove silence')) {
      result = {
        success: true,
        message: 'Auto-cutting silences... (Feature coming soon)',
        action: 'autoCutSilence',
        data: {}
      };
    } else if (lowerCommand.includes('generate captions') || lowerCommand.includes('add subtitles')) {
      result = {
        success: true,
        message: 'Generating captions... (Feature coming soon)',
        action: 'generateCaptions',
        data: {}
      };
    } else if (lowerCommand.includes('make it more engaging') || lowerCommand.includes('improve pacing')) {
      result = {
        success: true,
        message: 'Applying AI-driven pacing improvements... (Feature coming soon)',
        action: 'improvePacing',
        data: {}
      };
    } else {
      // Try to get AI response for unrecognized commands
      if (openrouter) {
        try {
          const completion = await openrouter.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are a video editing assistant. Help users with video editing commands and provide helpful suggestions.'
              },
              {
                role: 'user',
                content: `I said: "${command}". How can I achieve this in video editing?`
              }
            ],
            temperature: 0.7,
            max_tokens: 200,
          });

          result = {
            success: true,
            message: completion.choices[0].message.content,
            action: 'suggestion',
            data: {}
          };
        } catch (aiError) {
          result = {
            success: false,
            message: 'I don\'t understand that command. Try saying "play video", "add clip", or "jump to 1:30"'
          };
        }
      }
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

