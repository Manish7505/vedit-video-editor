# 🎬 VEdit - AI-Powered Video Editor

A modern, full-stack video editing platform with AI assistance, real-time collaboration, and professional-grade features.

![VEdit Demo](https://via.placeholder.com/800x400/1e293b/ffffff?text=VEdit+AI+Video+Editor)

## ✨ Features

### 🎥 Core Video Editing
- **Multi-Track Timeline**: Professional video, audio, and text tracks
- **Drag & Drop Interface**: Intuitive clip manipulation
- **Real-time Preview**: Instant playback with scrubbing
- **Advanced Controls**: Speed, volume, opacity, fade effects
- **Context Menus**: Split, duplicate, delete clips
- **Keyboard Shortcuts**: Professional editing workflow

### 🤖 AI-Powered Features
- **AI Chatbot**: Natural language video editing commands
- **Voice Commands**: Speech-to-text editing instructions
- **Smart Suggestions**: AI-driven editing recommendations
- **Auto-Effects**: One-click professional effects
- **Intelligent Cuts**: AI-powered scene detection

### 👥 Collaboration & Management
- **User Authentication**: Secure JWT-based auth
- **Project Management**: Save, load, and organize projects
- **Real-time Collaboration**: Live editing with multiple users
- **File Uploads**: Drag & drop media files
- **Project Sharing**: Public and private project sharing
- **User Dashboard**: Comprehensive project overview

### 🎨 Modern Interface
- **Dark Theme**: Professional editing environment
- **Responsive Design**: Works on all devices
- **Smooth Animations**: Framer Motion powered
- **Intuitive UX**: Designed for efficiency
- **Customizable Layout**: Flexible workspace

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd vedit
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

3. **Environment Setup**
```bash
# Copy environment files
cp env.example .env
cp server/env.example server/.env

# Edit the .env files with your configuration
```

4. **Start the application**
```bash
# Run both frontend and backend
npm run dev:full
```

5. **Access the application**
- Frontend: http://localhost:3003
- Backend API: http://localhost:5000

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Express.js** - Web framework
- **Node.js** - Runtime environment
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Socket.io** - Real-time communication
- **OpenAI API** - AI integration

### Infrastructure
- **Vercel** - Frontend deployment
- **Railway/Render** - Backend deployment
- **MongoDB Atlas** - Cloud database
- **Cloudinary** - Media storage (optional)

## 📁 Project Structure

```
vedit/
├── src/                          # Frontend React app
│   ├── components/               # Reusable components
│   │   ├── auth/                # Authentication components
│   │   ├── AIChatbot.tsx        # AI assistant
│   │   ├── Dashboard.tsx        # User dashboard
│   │   ├── VideoCanvas.tsx      # Video preview
│   │   ├── Timeline.tsx         # Editing timeline
│   │   └── ...
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── VideoEditorContext.tsx # Editor state
│   ├── pages/                   # Page components
│   │   ├── HomePage.tsx         # Landing page
│   │   └── VideoEditor.tsx      # Main editor
│   ├── services/                # API services
│   │   ├── openai.ts           # OpenAI integration
│   │   └── supabase.ts         # Supabase client
│   └── stores/                  # State management
│       └── videoEditorStore.ts  # Zustand store
├── server/                      # Backend Express app
│   ├── routes/                  # API endpoints
│   │   ├── auth.js             # Authentication
│   │   ├── users.js            # User management
│   │   ├── projects.js         # Project CRUD
│   │   ├── files.js            # File uploads
│   │   └── ai.js               # AI services
│   ├── models/                  # Database models
│   │   ├── User.js             # User schema
│   │   └── Project.js          # Project schema
│   ├── middleware/              # Express middleware
│   │   ├── auth.js             # JWT authentication
│   │   └── errorHandler.js     # Error handling
│   └── config/                  # Configuration
│       └── database.js         # MongoDB connection
└── public/                      # Static assets
    ├── herovideo.mp4           # Demo videos
    └── ...
```

## 🔧 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-token` - Token verification

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Files
- `POST /api/files/upload` - Upload media files
- `GET /api/files` - Get user files
- `GET /api/files/:filename` - Download file

### AI Services
- `POST /api/ai/chat` - AI chat interaction
- `POST /api/ai/execute-command` - Execute video commands
- `GET /api/ai/status` - AI service status

## 🎯 Usage Examples

### Creating a New Project
```javascript
const response = await axios.post('/api/projects', {
  name: 'My Video Project',
  description: 'A creative video project',
  isPublic: false
});
```

### AI-Powered Editing
```javascript
// Send voice command to AI
const result = await axios.post('/api/ai/execute-command', {
  command: 'add a fade in effect to the first clip',
  projectData: currentProject
});
```

### Real-time Collaboration
```javascript
// Join project room for real-time editing
socket.emit('join-project', projectId);

// Listen for timeline updates
socket.on('timeline-update', (data) => {
  updateTimeline(data);
});
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Backend (Railway)
1. Connect your GitHub repository to Railway
2. Set environment variables
3. Deploy with automatic scaling

### Database (MongoDB Atlas)
1. Create a free cluster
2. Get connection string
3. Update `MONGODB_URI` in production

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API abuse prevention
- **CORS Protection**: Cross-origin security
- **Input Validation**: Request sanitization
- **File Upload Security**: Type and size validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for AI capabilities
- **MongoDB** for database services
- **Vercel** for hosting
- **React** and **Express** communities

## 📞 Support

- **Documentation**: [Full Setup Guide](FULL_STACK_SETUP.md)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Built with ❤️ for the video editing community**

*Start creating amazing videos with AI assistance today!* 🎬✨