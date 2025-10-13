# 🚀 VEdit Full-Stack Setup Guide

## 📋 Overview

This guide will help you set up the complete VEdit AI Video Editor with:
- ✅ **Frontend**: React + TypeScript + Vite
- ✅ **Backend**: Express.js + Node.js
- ✅ **Database**: MongoDB
- ✅ **Authentication**: JWT + bcrypt
- ✅ **AI Integration**: OpenAI API
- ✅ **File Uploads**: Multer
- ✅ **Real-time**: Socket.io
- ✅ **Deployment**: Vercel + MongoDB Atlas

## 🛠️ Prerequisites

- Node.js 18+ installed
- MongoDB (local or Atlas)
- OpenAI API key
- Git

## 📦 Installation

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Setup

Create `.env` file in the root directory:

```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:5000/api

# Backend Environment Variables (create server/.env)
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/vedit
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/vedit

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=100MB
UPLOAD_PATH=./uploads

# CORS
FRONTEND_URL=http://localhost:3003

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Supabase (for additional features)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB locally
# Start MongoDB service
mongod
```

#### Option B: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

### 4. OpenAI API Setup
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add it to your `.env` file

## 🚀 Running the Application

### Development Mode (Both Frontend & Backend)

```bash
# Run both frontend and backend simultaneously
npm run dev:full
```

### Individual Services

```bash
# Frontend only (port 3003)
npm run dev

# Backend only (port 5000)
npm run dev:server
```

## 📁 Project Structure

```
vedit/
├── src/                          # Frontend React app
│   ├── components/               # React components
│   │   ├── auth/                # Authentication components
│   │   ├── AIChatbot.tsx        # AI chatbot
│   │   ├── Dashboard.tsx        # User dashboard
│   │   └── ...
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx      # Authentication context
│   │   └── VideoEditorContext.tsx
│   ├── pages/                   # Page components
│   ├── services/                # API services
│   └── stores/                  # State management
├── server/                      # Backend Express app
│   ├── routes/                  # API routes
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User management
│   │   ├── projects.js         # Project management
│   │   ├── files.js            # File uploads
│   │   └── ai.js               # AI integration
│   ├── models/                  # Database models
│   │   ├── User.js             # User model
│   │   └── Project.js          # Project model
│   ├── middleware/              # Express middleware
│   │   ├── auth.js             # Authentication middleware
│   │   └── errorHandler.js     # Error handling
│   ├── config/                  # Configuration
│   │   └── database.js         # Database connection
│   └── uploads/                 # File uploads directory
└── public/                      # Static assets
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-token` - Token verification

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/change-password` - Change password
- `GET /api/users/dashboard` - Dashboard data

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Files
- `POST /api/files/upload` - Upload files
- `GET /api/files` - Get user files
- `GET /api/files/:filename` - Get file
- `DELETE /api/files/:filename` - Delete file

### AI
- `POST /api/ai/chat` - AI chat
- `POST /api/ai/execute-command` - Execute video commands
- `GET /api/ai/status` - AI service status

## 🎯 Features

### ✅ Implemented
- **User Authentication**: Sign up, sign in, JWT tokens
- **Project Management**: Create, edit, delete, share projects
- **File Uploads**: Video, audio, image uploads
- **AI Chatbot**: OpenAI integration for video editing assistance
- **Real-time Collaboration**: Socket.io for live editing
- **Dashboard**: User dashboard with project overview
- **Video Editor**: Full-featured video editing interface
- **Responsive Design**: Mobile-friendly interface

### 🚧 Coming Soon
- **Video Processing**: Server-side video manipulation
- **Cloud Storage**: AWS S3/Cloudinary integration
- **Email Notifications**: User notifications
- **Advanced AI**: Video analysis and auto-editing
- **Team Collaboration**: Multi-user editing
- **Export Options**: Multiple export formats

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Build frontend
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend (Railway/Render)
```bash
# Deploy backend
# Update environment variables in hosting platform
# Set MONGODB_URI to Atlas connection string
# Set FRONTEND_URL to your Vercel domain
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vedit
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-vercel-app.vercel.app
OPENAI_API_KEY=your-openai-api-key
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API rate limiting
- **CORS Protection**: Cross-origin request protection
- **Input Validation**: Request validation
- **File Upload Security**: File type and size validation

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MongoDB is running
   - Verify connection string
   - Check network access (for Atlas)

2. **OpenAI API Error**
   - Verify API key is correct
   - Check API quota/billing
   - Ensure API key has proper permissions

3. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Check file type restrictions

4. **CORS Errors**
   - Update FRONTEND_URL in backend .env
   - Check CORS configuration in server.js

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev:server
```

## 📞 Support

If you encounter any issues:
1. Check the console logs
2. Verify environment variables
3. Ensure all dependencies are installed
4. Check database connectivity

## 🎉 You're Ready!

Your full-stack VEdit application is now ready! 

- **Frontend**: http://localhost:3003
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/api/health

Start creating amazing videos with AI assistance! 🎬✨

