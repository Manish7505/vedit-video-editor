const mongoose = require('mongoose');

const clipSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  trackId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'audio', 'image', 'text'],
    required: true
  },
  startTime: {
    type: Number,
    required: true,
    min: 0
  },
  endTime: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  url: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  waveform: {
    type: [Number],
    default: []
  },
  properties: {
    volume: {
      type: Number,
      default: 1,
      min: 0,
      max: 1
    },
    opacity: {
      type: Number,
      default: 1,
      min: 0,
      max: 1
    },
    speed: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 4
    },
    fadeIn: {
      type: Number,
      default: 0,
      min: 0
    },
    fadeOut: {
      type: Number,
      default: 0,
      min: 0
    }
  }
});

const trackSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'audio', 'text'],
    required: true
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  height: {
    type: Number,
    default: 60,
    min: 40,
    max: 200
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  volume: {
    type: Number,
    default: 1,
    min: 0,
    max: 1
  }
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'editor'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    type: String,
    default: null
  },
  settings: {
    resolution: {
      width: {
        type: Number,
        default: 1920
      },
      height: {
        type: Number,
        default: 1080
      }
    },
    frameRate: {
      type: Number,
      default: 30
    },
    duration: {
      type: Number,
      default: 0
    },
    currentTime: {
      type: Number,
      default: 0
    },
    zoom: {
      type: Number,
      default: 1
    },
    playbackRate: {
      type: Number,
      default: 1
    }
  },
  tracks: [trackSchema],
  clips: [clipSchema],
  chatMessages: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  selectedClipId: {
    type: String,
    default: null
  },
  sidebarOpen: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ 'collaborators.user': 1 });
projectSchema.index({ isPublic: 1, createdAt: -1 });
projectSchema.index({ name: 'text', description: 'text' });

// Update lastModified on save
projectSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModified = new Date();
    this.version += 1;
  }
  next();
});

// Virtual for project URL
projectSchema.virtual('shareUrl').get(function() {
  return this.isPublic ? `/share/${this._id}` : null;
});

// Method to check if user has access
projectSchema.methods.hasAccess = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  if (this.isPublic) return true;
  return this.collaborators.some(collab => 
    collab.user.toString() === userId.toString()
  );
};

// Method to get user role
projectSchema.methods.getUserRole = function(userId) {
  if (this.owner.toString() === userId.toString()) return 'owner';
  const collaborator = this.collaborators.find(collab => 
    collab.user.toString() === userId.toString()
  );
  return collaborator ? collaborator.role : null;
};

module.exports = mongoose.model('Project', projectSchema);

