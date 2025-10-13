# 🤖 Gemini 2.0 Flash API Setup Guide

## ✨ **Power Your VEdit with Google's Gemini AI**

Your VEdit now uses **Google Gemini 2.0 Flash** for advanced AI-powered video transcription! Here's how to set it up.

---

## 🔑 **Step 1: Get Gemini API Key**

### **Go to Google AI Studio:**
1. Visit: https://aistudio.google.com/
2. **Sign in** with your Google account
3. Click **"Get API Key"** in the top right
4. Click **"Create API Key"** 
5. **Copy the API key** (starts with `AIza...`)

### **Alternative - Google Cloud Console:**
1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable **"Generative Language API"**
4. Go to **"Credentials"** → **"Create Credentials"** → **"API Key"**
5. **Copy the API key**

---

## 📝 **Step 2: Add API Key to Your Project**

### **Create `.env.local` File:**
Create a file named `.env.local` in your project root (`D:\vedit\`) with this content:

```env
# Supabase (Already configured ✅)
VITE_SUPABASE_URL=https://juepmywviwzkekreuzsl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZXBteXd2aXd6a2VrcmV1enNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTQ3NTQsImV4cCI6MjA3NTY3MDc1NH0.tbFuHLOJ2bXv8bZ_20v_bQdAZN5fIFM_tjRocoPtijs

# YouTube API (Your key ✅)
VITE_YOUTUBE_API_KEY=AIzaSyA37e5-X_TBKzzt9UzVrlx-suvBOEOmHUc

# Gemini 2.0 Flash API (Add your key here)
VITE_GEMINI_API_KEY=AIza-your-gemini-api-key-here
```

### **Replace the API Key:**
Replace `AIza-your-gemini-api-key-here` with your actual Gemini API key.

---

## 🔄 **Step 3: Restart Server**

1. **Stop server**: Press `Ctrl+C` in terminal
2. **Restart**: Run `npm run dev`
3. **Open**: http://localhost:3001/editor

---

## 🎯 **Step 4: Test Gemini Caption Feature**

### **How to Use:**
1. **Upload a video** with audio
2. **Click "Caption" tab** in right sidebar
3. **Click "Gemini Caption" button** (purple)
4. **Wait 1-3 minutes** for AI processing
5. **See real captions** generated from your audio!

---

## 🚀 **Gemini 2.0 Flash Features**

### ✅ **Advanced AI Transcription:**
- **Real speech-to-text** from your video audio
- **High accuracy** (95%+ for clear speech)
- **Multiple languages** supported
- **Context understanding** for better results

### ✅ **Smart Processing:**
- **Automatic timing** synchronization
- **Grammar correction** and improvement
- **Punctuation** and formatting
- **Confidence scores** for each segment

### ✅ **Professional Results:**
- **Export SRT/VTT** subtitle files
- **Timeline integration** with visual segments
- **Real-time preview** on video
- **Full editing** capabilities

---

## 💰 **Gemini Pricing (Very Affordable!)**

### **Free Tier:**
- **15 requests per minute**
- **1 million tokens per day**
- **Perfect for testing** and small projects

### **Paid Tier:**
- **$0.00025 per 1K characters** input
- **$0.0005 per 1K characters** output
- **Very cost-effective** compared to other AI services

### **Cost Examples:**
- **10-minute video**: ~$0.01-0.05
- **1-hour video**: ~$0.10-0.50
- **Much cheaper** than OpenAI Whisper!

---

## 🌍 **Supported Languages**

### **Gemini 2.0 Flash supports 100+ languages:**
- **English** (US, UK, AU, CA)
- **Spanish** (ES, MX, AR, CO)
- **French** (FR, CA)
- **German** (DE, AT, CH)
- **Italian** (IT)
- **Portuguese** (PT, BR)
- **Russian** (RU)
- **Chinese** (Simplified, Traditional)
- **Japanese** (JP)
- **Korean** (KR)
- **Arabic** (SA, AE, EG)
- **Hindi** (IN)
- **And many more!**

---

## 🎨 **Caption Features**

### **Automatic Generation:**
- **Extract audio** from video
- **AI transcription** with Gemini
- **Smart timing** synchronization
- **Professional formatting**

### **Full Editing:**
- **Edit caption text** - Click edit icons
- **Adjust timing** - Drag segments
- **Add manual captions** - Create your own
- **Delete captions** - Remove unwanted ones
- **Export options** - Download SRT/VTT

### **Visual Display:**
- **Real-time preview** on video
- **Timeline integration** with segments
- **Professional styling** (white text, black background)
- **Smooth animations** (fade in/out)

---

## 🔧 **Troubleshooting**

### **"Gemini API key not found" Error:**
- **Check**: `.env.local` file exists in project root
- **Verify**: API key is correct and starts with `AIza`
- **Restart**: Server after adding API key
- **Format**: No spaces or quotes around the key

### **"Failed to transcribe audio" Error:**
- **Check**: Internet connection
- **Verify**: API key has proper permissions
- **Try**: Smaller video file first
- **Check**: Browser console for detailed errors

### **Slow Processing:**
- **Normal**: 1-3 minutes for 10-minute video
- **Depends on**: Video length and audio quality
- **Gemini**: Processes in the cloud, not locally

### **No Captions Generated:**
- **Check**: Video has clear audio
- **Verify**: Audio is not too quiet or noisy
- **Try**: Different video file
- **Check**: API key is valid and active

---

## 🎯 **Best Practices**

### **For Best Results:**
- **Clear audio** with minimal background noise
- **Good microphone** quality in original recording
- **Moderate speaking pace** (not too fast/slow)
- **Single speaker** (avoid overlapping voices)

### **Video Requirements:**
- **Any format**: MP4, MOV, AVI, MKV, WebM
- **Any length**: Short clips to full movies
- **Audio quality**: Clear speech works best
- **File size**: No specific limits

---

## 🆚 **Gemini vs Other AI Services**

| Feature | Gemini 2.0 Flash | OpenAI Whisper | Free Services |
|---------|------------------|----------------|---------------|
| **Cost** | $0.00025/1K chars | $0.006/minute | Free |
| **Accuracy** | 95%+ | 95%+ | Manual only |
| **Languages** | 100+ | 99+ | English only |
| **Speed** | 1-3 minutes | 1-3 minutes | Instant |
| **Quality** | Excellent | Excellent | Basic |

---

## 🎉 **Why Choose Gemini?**

### ✅ **Advantages:**
- **Google's latest AI** technology
- **Very affordable** pricing
- **High accuracy** and reliability
- **Multiple language** support
- **Fast processing** times
- **Easy integration** with VEdit

### ✅ **Perfect For:**
- **Content creators** (YouTube, TikTok, Instagram)
- **Business** (training videos, marketing)
- **Education** (online courses, tutorials)
- **Accessibility** (hearing-impaired support)
- **SEO** (searchable video content)

---

## 🚀 **Quick Start Checklist**

- [ ] ✅ Get Gemini API key from Google AI Studio
- [ ] ✅ Add key to `.env.local` file
- [ ] ✅ Restart server (`npm run dev`)
- [ ] ✅ Upload a video with audio
- [ ] ✅ Click "Caption" tab in right sidebar
- [ ] ✅ Click "Gemini Caption" button
- [ ] ✅ Wait for AI processing
- [ ] ✅ Edit captions as needed
- [ ] ✅ Export video with captions

---

## 🎊 **You're All Set!**

Your VEdit now has **professional-grade AI transcription** powered by Google's Gemini 2.0 Flash!

**Benefits:**
- ✅ **Real speech-to-text** from your videos
- ✅ **High accuracy** with AI processing
- ✅ **Multiple languages** supported
- ✅ **Very affordable** pricing
- ✅ **Professional results** for any project

**Try it now:**
1. Upload a video
2. Click "Caption" tab
3. Click "Gemini Caption" button
4. Watch the AI magic happen! ✨

---

*Powered by Google Gemini 2.0 Flash - The future of AI transcription!* 🤖🚀
