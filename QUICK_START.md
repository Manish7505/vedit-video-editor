# ⚡ Quick Start Guide

## 🎯 Get Your API Keys (5 minutes)

### 1. OpenAI (Required)
1. Visit: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

### 2. Supabase (Optional but recommended)
1. Visit: https://supabase.com/dashboard
2. Create new project
3. Copy Project URL and anon key from Settings → API

## 🔧 Setup (2 minutes)

1. **Create `.env.local` file** in project root:
```env
VITE_OPENAI_API_KEY=sk-your-key-here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-key-here
```

2. **Restart server**:
```bash
npm run dev
```

## ✅ Test It Works

1. Open http://localhost:3003
2. Go to Video Editor
3. Click "AI Assistant" tab
4. Look for 🟢 green dot = AI Enabled!

## 🎤 Try These Commands

Say or type:
- "Play video"
- "Add clip at 2:30"
- "Split this clip"
- "Make this video better"
- "Generate captions"

## 📖 Need More Help?

See `API_SETUP_GUIDE.md` for detailed instructions!


