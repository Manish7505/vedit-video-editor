const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');

const router = express.Router();

// Validation rules
const projectValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// @route   GET /api/projects
// @desc    Get user's projects
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'lastModified', sortOrder = 'desc' } = req.query;
    
    const query = {
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ],
      isArchived: false
    };

    // Add search functionality
    if (search) {
      query.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const projects = await Project.find(query)
      .populate('owner', 'username email avatar')
      .populate('collaborators.user', 'username email avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-clips -chatMessages'); // Exclude heavy data for list view

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      code: 'FETCH_ERROR'
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email avatar')
      .populate('collaborators.user', 'username email avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Check if user has access
    if (!project.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      data: { project }
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      code: 'FETCH_ERROR'
    });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', projectValidation, async (req, res) => {
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

    const { name, description, isPublic = false, settings } = req.body;

    // Create new project
    const project = new Project({
      name,
      description,
      owner: req.user._id,
      isPublic,
      settings: settings || {
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        duration: 0,
        currentTime: 0,
        zoom: 1,
        playbackRate: 1
      },
      tracks: [
        {
          id: 'track-1',
          name: 'Video Track',
          type: 'video',
          color: '#3B82F6',
          height: 60,
          isMuted: false,
          isLocked: false,
          volume: 1
        },
        {
          id: 'track-2',
          name: 'Audio Track',
          type: 'audio',
          color: '#10B981',
          height: 60,
          isMuted: false,
          isLocked: false,
          volume: 1
        }
      ],
      chatMessages: [
        {
          id: 'msg-1',
          type: 'ai',
          content: 'Welcome to your new project! I\'m here to help you edit your video. Try saying "play video" or "add a clip" to get started.',
          timestamp: new Date()
        }
      ]
    });

    await project.save();

    // Populate the project data
    await project.populate('owner', 'username email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      code: 'CREATE_ERROR'
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', projectValidation, async (req, res) => {
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

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Check if user has edit access
    const userRole = project.getUserRole(req.user._id);
    if (!userRole || (userRole !== 'owner' && userRole !== 'admin' && userRole !== 'editor')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { name, description, isPublic, settings, tracks, clips, chatMessages, selectedClipId, sidebarOpen } = req.body;

    // Update project fields
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (isPublic !== undefined) project.isPublic = isPublic;
    if (settings !== undefined) project.settings = { ...project.settings, ...settings };
    if (tracks !== undefined) project.tracks = tracks;
    if (clips !== undefined) project.clips = clips;
    if (chatMessages !== undefined) project.chatMessages = chatMessages;
    if (selectedClipId !== undefined) project.selectedClipId = selectedClipId;
    if (sidebarOpen !== undefined) project.sidebarOpen = sidebarOpen;

    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      code: 'UPDATE_ERROR'
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Only owner can delete project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete the project',
        code: 'OWNER_ONLY'
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      code: 'DELETE_ERROR'
    });
  }
});

// @route   POST /api/projects/:id/collaborators
// @desc    Add collaborator to project
// @access  Private
router.post('/:id/collaborators', async (req, res) => {
  try {
    const { email, role = 'editor' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Only owner and admin can add collaborators
    const userRole = project.getUserRole(req.user._id);
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is already a collaborator
    const existingCollaborator = project.collaborators.find(
      collab => collab.user.toString() === user._id.toString()
    );

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'User is already a collaborator',
        code: 'ALREADY_COLLABORATOR'
      });
    }

    // Add collaborator
    project.collaborators.push({
      user: user._id,
      role,
      addedAt: new Date()
    });

    await project.save();

    // Populate the collaborator data
    await project.populate('collaborators.user', 'username email avatar');

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add collaborator',
      code: 'ADD_ERROR'
    });
  }
});

// @route   DELETE /api/projects/:id/collaborators/:userId
// @desc    Remove collaborator from project
// @access  Private
router.delete('/:id/collaborators/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Only owner and admin can remove collaborators
    const userRole = project.getUserRole(req.user._id);
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Remove collaborator
    project.collaborators = project.collaborators.filter(
      collab => collab.user.toString() !== req.params.userId
    );

    await project.save();

    res.json({
      success: true,
      message: 'Collaborator removed successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove collaborator',
      code: 'REMOVE_ERROR'
    });
  }
});

// @route   GET /api/projects/public
// @desc    Get public projects
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const query = { isPublic: true, isArchived: false };

    if (search) {
      query.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-clips -chatMessages -collaborators');

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get public projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public projects',
      code: 'FETCH_ERROR'
    });
  }
});

module.exports = router;

