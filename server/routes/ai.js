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
      const systemPrompt = `AI video editor. Be very brief.

Context: ${context}

Short responses only.`;

      const completion = await openrouter.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 50,
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
// @desc    Intelligent AI assistant that handles both conversation and video editing commands
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

    // First, determine if this is a conversation or a video editing command
    const intentAnalysisPrompt = `You are an intent classifier. Analyze the user's message and determine the intent. You MUST respond with ONLY a valid JSON object, no other text.

Rules:
- conversation: greetings, questions, casual chat
- video_command: single video editing action (play, pause, seek, add clip, etc.)
- multi_task: multiple video editing tasks in one request

Examples:
"hi" → {"intent": "conversation", "confidence": 0.9, "reasoning": "greeting"}
"play video" → {"intent": "video_command", "confidence": 0.9, "reasoning": "single video action"}
"make my video engaging and add music" → {"intent": "multi_task", "confidence": 0.8, "reasoning": "multiple video tasks"}

Respond with ONLY the JSON object:`;

    const intentCompletion = await openrouter.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: intentAnalysisPrompt },
        { role: 'user', content: command }
      ],
      temperature: 0.1,
      max_tokens: 150
    });

    let intentResult;
    try {
      const responseText = intentCompletion.choices[0]?.message?.content?.trim();
      console.log('Raw intent response:', responseText);
      
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{.*\}/);
      if (jsonMatch) {
        intentResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Intent parsing failed:', parseError);
      // Smart fallback based on command content
      const lowerCommand = command.toLowerCase();
      if (lowerCommand.includes('play') || lowerCommand.includes('pause') || lowerCommand.includes('seek') || lowerCommand.includes('jump')) {
        intentResult = { intent: 'video_command', confidence: 0.8, reasoning: 'fallback - video action detected' };
      } else if (lowerCommand.includes('and') || lowerCommand.includes('also') || lowerCommand.includes('then')) {
        intentResult = { intent: 'multi_task', confidence: 0.7, reasoning: 'fallback - multiple tasks detected' };
      } else {
        intentResult = { intent: 'conversation', confidence: 0.6, reasoning: 'fallback - default to conversation' };
      }
    }

    console.log('Intent analysis:', intentResult);

    // Route based on intent
    if (intentResult.intent === 'conversation') {
      // Handle as natural conversation
      const conversationPrompt = `AI video editor. Very brief responses.

Context: ${videoContext?.currentTime || 0}s / ${videoContext?.duration || 0}s, ${videoContext?.clipsCount || 0} clips

Short answers only.`;

      const conversationCompletion = await openrouter.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: conversationPrompt },
          { role: 'user', content: command }
        ],
        temperature: 0.7,
        max_tokens: 40
      });

      const conversationResponse = conversationCompletion.choices[0]?.message?.content;
      
      res.json({
        success: true,
        data: {
          action: 'conversation',
          confidence: 0.9,
          message: conversationResponse,
          data: { type: 'conversation' }
        }
      });

    } else if (intentResult.intent === 'video_command') {
      // Handle as single video editing command
      const commandPrompt = `Analyze video command and return ONLY JSON. Be concise.

Actions: play, seek, addFilter, addText, adjustVolume, adjustBrightness, adjustContrast, adjustSaturation, adjustSpeed, applyTransition, applyColorGrading, cropVideo, transformVideo, applyAudioEffect, moveClip, resizeClip, splitClip, duplicateClip, resetFilters, undoLast, navigateTimeline

Context: ${videoContext?.currentTime || 0}s / ${videoContext?.duration || 0}s, ${videoContext?.clipsCount || 0} clips

Examples:
"play" → {"action": "play", "confidence": 0.9, "message": "Playing", "data": {}}
"brighter" → {"action": "adjustBrightness", "confidence": 0.9, "message": "Brightening", "data": {"value": 20}}
"grayscale" → {"action": "addFilter", "confidence": 0.9, "message": "Grayscale filter", "data": {"filter": "grayscale"}}

Return ONLY JSON:`;

      const commandCompletion = await openrouter.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: commandPrompt },
          { role: 'user', content: command }
        ],
        temperature: 0.1,
        max_tokens: 50
      });

      const aiResponse = commandCompletion.choices[0]?.message?.content;
      console.log('Raw command response:', aiResponse);
      let result;

      try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\{.*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
        
        if (typeof result.confidence !== 'number') {
          result.confidence = 0.8;
        }
      } catch (parseError) {
        console.error('Command parsing failed:', parseError);
        // Smart fallback based on command content
        const lowerCommand = command.toLowerCase();
        if (lowerCommand.includes('play')) {
          result = { action: 'play', confidence: 0.8, message: 'Playing the video', data: {} };
        } else if (lowerCommand.includes('pause')) {
          result = { action: 'play', confidence: 0.8, message: 'Pausing the video', data: {} };
        } else if (lowerCommand.includes('jump') || lowerCommand.includes('seek')) {
          result = { action: 'seek', confidence: 0.7, message: 'Seeking to position', data: {} };
        } else {
          result = { 
            action: 'unknown', 
            confidence: 0.1, 
            message: 'I understand you want to do something with the video, but I need more specific instructions. Try: "play video", "add clip", or "jump to 1:30"' 
          };
        }
      }

      res.json({
        success: true,
        data: result
      });

    } else if (intentResult.intent === 'multi_task') {
      // Handle as multi-task request
      const multiTaskPrompt = `Multiple video tasks. Brief steps.

Context: ${videoContext?.currentTime || 0}s / ${videoContext?.duration || 0}s, ${videoContext?.clipsCount || 0} clips

Short steps only.`;

      const multiTaskCompletion = await openrouter.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: multiTaskPrompt },
          { role: 'user', content: command }
        ],
        temperature: 0.7,
        max_tokens: 80
      });

      const multiTaskResponse = multiTaskCompletion.choices[0]?.message?.content;
      
      res.json({
        success: true,
        data: {
          action: 'multi_task',
          confidence: 0.8,
          message: multiTaskResponse,
          data: { type: 'multi_task_guidance' }
        }
      });
    }

  } catch (error) {
    console.error('AI processing error:', error);
    res.status(500).json({
      success: false,
      message: 'AI processing failed',
      code: 'AI_ERROR'
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
            content: 'You are a video editor. Keep responses very brief and actionable.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 150,
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

