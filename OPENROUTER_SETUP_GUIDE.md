# OpenRouter AI Integration Setup Guide

## 🎯 **What This Setup Does**

This integration makes your **right section AI assistant** (not VAPI) much more intelligent by:

- **Understanding natural language** instead of just keywords
- **Processing complex commands** like "make this video more cinematic"
- **Providing intelligent responses** based on context
- **Working with multiple AI models** for better results

---

## 📋 **Step 1: Get OpenRouter API Key**

### **1.1 Go to OpenRouter**
- Visit: **https://openrouter.ai**
- Click **"Sign Up"** or **"Get Started"**

### **1.2 Create Account**
- Enter your email address
- Create a password
- Verify your email (check inbox)
- Complete the signup process

### **1.3 Generate API Key**
- Log in to your dashboard
- Go to **"API Keys"** in the sidebar
- Click **"Create New Key"**
- Name it: **"VEdit Video Editor"**
- Copy the API key (starts with `sk-or-v1-...`)

---

## 📋 **Step 2: Configure Environment**

### **2.1 Create .env File**
Create a `.env` file in your project root (same level as `package.json`):

```env
# OpenRouter API Configuration
VITE_OPENROUTER_API_KEY=your-actual-api-key-here
```

### **2.2 Replace API Key**
- Replace `your-actual-api-key-here` with your real API key
- **NEVER commit this file to Git** (it's already in .gitignore)

---

## 📋 **Step 3: Test the Integration**

### **3.1 Start Your App**
```bash
npm run dev
```

### **3.2 Check AI Status**
- Go to your video editor page
- Look at the right section AI assistant
- You should see:
  - **Green dot**: "AI Powered" (connected)
  - **Yellow dot**: "Connecting..." (testing)
  - **Red dot**: "Basic Mode" (not connected)

### **3.3 Test Commands**
Try these advanced commands:

**Natural Language:**
- "Make this video more cinematic"
- "Add a vintage film effect"
- "Make it look more dramatic"
- "Apply a warm color tone"

**Complex Commands:**
- "Increase brightness and add contrast"
- "Speed up the video and add blur"
- "Make it black and white with high contrast"

---

## 🎯 **How It Works**

### **AI-Powered Processing:**
1. **User types/speaks** a command
2. **OpenRouter AI analyzes** the command with video context
3. **AI determines** the best action to take
4. **System executes** the video editing action
5. **User gets** intelligent response

### **Fallback System:**
- If AI fails → Falls back to basic keyword matching
- If no API key → Works in basic mode
- Always functional, even without AI

---

## 🔧 **Available AI Models**

The system uses these free models (in order of preference):

1. **DeepSeek Chat** - Best for general understanding
2. **Qwen Coder** - Good for technical tasks
3. **Moonshot** - General purpose
4. **Llama 3.1** - Meta's model
5. **Phi-3 Mini** - Microsoft's model

---

## 💰 **Cost Information**

### **Free Tier:**
- **$5 monthly credits** (much better than other services)
- **~100-500 requests** depending on model
- **Monthly refresh** of credits

### **Usage:**
- Each video editing command = ~1-2 requests
- Very cost-effective for development and testing
- Perfect for assignments and demos

---

## 🚀 **Advanced Features**

### **Smart Context Understanding:**
- Knows current video state
- Understands clip selection
- Remembers applied effects
- Provides contextual responses

### **Intelligent Command Processing:**
- "Make it cinematic" → Applies multiple effects
- "Fix the lighting" → Adjusts brightness + contrast
- "Make it vintage" → Applies sepia + contrast + brightness

### **Real-time Status:**
- Connection status indicator
- AI enable/disable toggle
- Reconnect button
- Error handling

---

## 🛠️ **Troubleshooting**

### **Red Dot (Not Connected):**
1. Check if API key is set in `.env`
2. Verify API key is correct
3. Check internet connection
4. Try reconnecting with settings button

### **Yellow Dot (Connecting):**
- Wait a few seconds
- Check console for errors
- Try refreshing the page

### **Commands Not Working:**
1. Make sure you have a video loaded
2. Select a clip first
3. Check if AI is enabled (green zap icon)
4. Try basic commands first

---

## 📝 **Example Commands**

### **Visual Effects:**
- "Make this look like a movie"
- "Add a dreamy effect"
- "Make it look professional"
- "Apply a retro style"

### **Technical Adjustments:**
- "Fix the exposure"
- "Improve the contrast"
- "Make the colors more vibrant"
- "Reduce the noise"

### **Creative Requests:**
- "Make it more dramatic"
- "Add a mysterious atmosphere"
- "Create a warm feeling"
- "Make it look vintage"

---

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ Green dot shows "AI Powered"
- ✅ Natural language commands work
- ✅ Complex requests are understood
- ✅ Responses are intelligent and contextual
- ✅ Video changes are applied correctly

---

## 🔒 **Security Notes**

- **Never share your API key** publicly
- **Keep .env file private** (already in .gitignore)
- **Use environment variables** for deployment
- **Monitor your usage** in OpenRouter dashboard

---

## 🎉 **You're All Set!**

Your AI assistant is now much more intelligent and can understand natural language commands for video editing. The system will automatically fall back to basic mode if needed, so it's always functional.

**Happy video editing with AI! 🎬✨**
