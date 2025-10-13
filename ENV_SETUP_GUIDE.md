# 🔑 Complete Environment Setup Guide

## Quick Setup Instructions

Create a file named `.env.local` in your project root (D:\vedit) with this content:

```env
# VEdit AI Platform - Environment Configuration

# ============================================
# SUPABASE CONFIGURATION (✅ Already Configured)
# ============================================
VITE_SUPABASE_URL=https://juepmywviwzkekreuzsl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZXBteXd2aXd6a2VrcmV1enNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTQ3NTQsImV4cCI6MjA3NTY3MDc1NH0.tbFuHLOJ2bXv8bZ_20v_bQdAZN5fIFM_tjRocoPtijs

# ============================================
# OPENAI (⚠️ REQUIRED - Get from platform.openai.com)
# ============================================
VITE_OPENAI_API_KEY=sk-proj-your-key-here

# ============================================
# OPTIONAL: Social Media APIs (For Vport)
# ============================================
VITE_YOUTUBE_API_KEY=your-youtube-api-key
VITE_INSTAGRAM_APP_ID=your-instagram-app-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_TIKTOK_CLIENT_KEY=your-tiktok-client-key
VITE_TWITTER_API_KEY=your-twitter-api-key

# ============================================
# APP CONFIG
# ============================================
VITE_APP_URL=http://localhost:3001
```

## 🚀 Minimum Required (To Start)

Just add your OpenAI API key:

```env
VITE_SUPABASE_URL=https://juepmywviwzkekreuzsl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZXBteXd2aXd6a2VrcmV1enNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTQ3NTQsImV4cCI6MjA3NTY3MDc1NH0.tbFuHLOJ2bXv8bZ_20v_bQdAZN5fIFM_tjRocoPtijs
VITE_OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
```

## 📝 How to Get OpenAI API Key

1. Go to: https://platform.openai.com/
2. Sign up/Login
3. Click Profile → "View API keys"
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Paste it in your `.env.local` file

## ✅ After Creating .env.local

1. Restart your dev server (Ctrl+C, then `npm run dev`)
2. Open http://localhost:3001
3. Go to Video Editor → AI Assistant
4. Look for green dot = Working!

## 🎯 Current Status

- ✅ Supabase: Configured
- ⚠️ OpenAI: Need your API key
- ⏳ Social Media: Optional (for publishing features)

