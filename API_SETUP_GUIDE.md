# 🚀 API Setup Guide for VEdit AI Video Editor

This guide will help you set up all the necessary API keys and services to enable the full AI-powered video editing features.

## 📋 Required Services

### 1. **OpenAI API** (Required for AI features)
### 2. **Supabase** (Optional for database and auth)
### 3. **Google Cloud** (Optional for advanced video analysis)
### 4. **ElevenLabs** (Optional for premium voice)

---

## 🔧 Step-by-Step Setup

### 1. OpenAI API Setup (REQUIRED)

**Cost**: $5 free credits, then pay-as-you-go

**Steps**:
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Click on your profile → "View API keys"
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Save it securely - you won't see it again!

**What it enables**:
- Real AI understanding of video editing commands
- Natural language processing
- Smart video editing suggestions
- Automatic caption generation
- Content analysis

---

### 2. Supabase Setup (Recommended)

**Cost**: FREE tier available

**Steps**:
1. Go to [supabase.com](https://supabase.com/)
2. Sign up with GitHub
3. Click "New Project"
4. Fill in project details:
   - Name: `vedit-ai`
   - Database Password: (generate strong password)
   - Region: (choose closest to you)
5. Wait 2-3 minutes for project to be ready
6. Go to Project Settings → API
7. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

**What it enables**:
- User authentication and accounts
- Project saving and loading
- Video file storage
- Real-time collaboration
- Project history

---

### 3. Google Cloud API (Optional)

**Cost**: $300 free credits for 90 days

**Steps**:
1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create new project
3. Enable these APIs:
   - Speech-to-Text API
   - Video Intelligence API
   - Natural Language API
4. Create credentials:
   - Go to "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key

**What it enables**:
- Advanced speech recognition
- Video content analysis
- Scene detection
- Object tracking
- Audio transcription

---

### 4. ElevenLabs API (Optional)

**Cost**: $5/month for premium voice

**Steps**:
1. Go to [elevenlabs.io](https://elevenlabs.io/)
2. Sign up for account
3. Go to Profile → API Keys
4. Click "Generate API Key"
5. Copy the key

**What it enables**:
- Premium AI voice generation
- Voice cloning
- Natural-sounding text-to-speech
- Multiple voice options

---

## 🔐 Configure Your Project

### Step 1: Create `.env.local` file

In your project root (D:\vedit), create a file named `.env.local`:

```env
# OpenAI (REQUIRED)
VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Supabase (Recommended)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your-key-here

# Google Cloud (Optional)
# VITE_GOOGLE_CLOUD_API_KEY=your-google-key-here

# ElevenLabs (Optional)
# VITE_ELEVENLABS_API_KEY=your-elevenlabs-key-here

# App Configuration
VITE_APP_NAME=VEdit AI Video Editor
VITE_APP_URL=http://localhost:3003
```

### Step 2: Replace placeholder values

Replace `your-openai-key-here`, `https://your-project.supabase.co`, etc. with your actual keys.

### Step 3: Restart development server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## ✅ Verify Setup

1. Open your app at [http://localhost:3003](http://localhost:3003)
2. Go to Video Editor
3. Click on "AI Assistant" tab (right panel)
4. Look for the status indicator:
   - 🟢 Green dot = AI Enabled
   - 🟡 Yellow dot = Using fallback mode (add API key)

### Test AI Features

Try these commands in the AI chat:
- "Play video"
- "Add a clip at 5 seconds"
- "Help me make this video better"
- "Generate captions for this video"

---

## 💰 Cost Breakdown

### For Assignment (4-6 weeks):

**Minimum Cost**: $5 (OpenAI only)
- OpenAI: $5 free credits
- Supabase: FREE tier
- **Total**: $5 one-time

**Recommended**: $5-20
- OpenAI: $5-15 (depending on usage)
- Supabase: FREE
- Google Cloud: FREE (using credits)
- **Total**: $5-20/month

**Premium**: $30-50
- OpenAI: $15
- Supabase: FREE
- Google Cloud: $10
- ElevenLabs: $5
- **Total**: $30/month

---

## 🔒 Security Best Practices

1. **Never commit `.env.local` to Git**
   - It's already in `.gitignore`
   - Double-check before pushing

2. **Use environment variables**
   - Never hardcode API keys in code
   - Always use `import.meta.env.VITE_*`

3. **Rotate keys regularly**
   - Regenerate keys every few months
   - Immediately rotate if exposed

4. **Set spending limits**
   - OpenAI: Set monthly limit in dashboard
   - Google Cloud: Set billing alerts

---

## 🚨 Troubleshooting

### Problem: "OpenAI API key not configured"
**Solution**: 
1. Check `.env.local` file exists
2. Check key starts with `sk-`
3. Restart development server

### Problem: "Invalid API key"
**Solution**:
1. Verify key was copied correctly
2. Check for extra spaces
3. Generate new key from OpenAI dashboard

### Problem: "Supabase connection failed"
**Solution**:
1. Check URL format: `https://xxxxx.supabase.co`
2. Verify anon key is correct
3. Check project is not paused

### Problem: "AI features not working"
**Solution**:
1. Check browser console for errors
2. Verify API keys are set
3. Check internet connection
4. Try regenerating API keys

---

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Cloud Video AI](https://cloud.google.com/video-intelligence)
- [ElevenLabs API Docs](https://docs.elevenlabs.io/)

---

## 🎬 What's Next?

Once your APIs are set up:

1. ✅ Test basic commands ("play video", "pause")
2. ✅ Try AI features ("make this video better")
3. ✅ Test voice commands (click mic button)
4. ✅ Save your first project
5. ✅ Deploy to Vercel

---

## 📞 Need Help?

If you encounter issues:
1. Check this guide carefully
2. Review error messages in browser console (F12)
3. Verify all API keys are correct
4. Make sure you restarted the dev server

---

## 🎉 You're All Set!

Your AI-powered video editor is now fully functional! Try saying:
- "Add a clip at 2:30"
- "Remove all filler words"
- "Generate highlight reel"
- "Make this video more engaging"

The AI will understand and execute your commands automatically! 🚀✨


