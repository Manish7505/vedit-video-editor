# Video Editor VAPI Assistant Setup Guide

## 🎬 Overview

You now have **TWO separate VAPI assistants**:

1. **Homepage AI Assistant** (bottom-right) - General help and chat
2. **Video Editor AI Assistant** (bottom-left) - Video editing commands

Both use the same interface design but are completely independent with different configurations.

---

## 📋 Setup Instructions

### Step 1: Create Video Editor Assistant in VAPI

1. Go to [VAPI Dashboard](https://dashboard.vapi.ai)
2. Click **"Create New Assistant"**
3. Configure the assistant for video editing:

   **Name:** `Video Editor AI`
   
   **System Prompt:**
   ```
   You are a helpful video editing assistant. You help users edit videos by understanding their voice commands and text instructions. You can assist with:
   
   - Adjusting brightness, contrast, and saturation
   - Applying visual effects (blur, sepia, grayscale, vintage, etc.)
   - Controlling audio (volume, mute, unmute)
   - Managing playback (play, pause, speed control)
   - Cutting and trimming clips
   - Adding text overlays
   - Adding transitions and filters
   
   When a user asks to edit something, acknowledge their request and confirm what you're going to do. Be specific and action-oriented. Use phrases like:
   - "I'll increase the brightness by 20%"
   - "Adding a blur effect to your video"
   - "Cutting the clip at the current position"
   
   Keep responses concise and helpful.
   ```

4. **Voice Settings:**
   - Select a professional voice
   - Adjust speed and tone as needed

5. **Model:** Choose GPT-4 or GPT-3.5-Turbo

6. **Save** the assistant

7. **Copy the Assistant ID** - You'll need this!

### Step 2: Create Workflow (Optional)

If you want to use a workflow instead of direct assistant:

1. Go to **Workflows** in VAPI Dashboard
2. Create a new workflow for video editing
3. Link it to your Video Editor AI assistant
4. Copy the **Workflow ID**

### Step 3: Update Environment Variables

1. Open your `.env` file (or create it if it doesn't exist)

2. Add these variables:

```env
# Homepage AI Assistant (existing)
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_WORKFLOW_ID=your-homepage-workflow-id

# Video Editor AI Assistant (NEW)
VITE_VAPI_VIDEO_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_VIDEO_WORKFLOW_ID=your-video-editor-workflow-id
VITE_VAPI_VIDEO_ASSISTANT_ID=your-video-editor-assistant-id
```

**Note:** You can use the **same public key** for both assistants if they're in the same VAPI account.

3. **Save** the `.env` file

4. **Restart** your development server:
   ```bash
   # Press Ctrl+C to stop the current server
   npm run dev
   ```

---

## 🎯 What's Different?

### Homepage Assistant (Bottom-Right)
- **Name:** "AI Assistant"
- **Purpose:** General help and chat
- **Icon Color:** Blue/Purple/Pink gradient
- **Environment Variables:**
  - `VITE_VAPI_PUBLIC_KEY`
  - `VITE_VAPI_WORKFLOW_ID`

### Video Editor Assistant (Bottom-Left)
- **Name:** "Video Editor AI"
- **Purpose:** Video editing commands
- **Icon Color:** Purple/Pink/Orange gradient
- **Button Text:** "Start Editing" / "End Session"
- **Environment Variables:**
  - `VITE_VAPI_VIDEO_PUBLIC_KEY`
  - `VITE_VAPI_VIDEO_WORKFLOW_ID`
  - `VITE_VAPI_VIDEO_ASSISTANT_ID`

---

## ✅ Testing

1. **Homepage:**
   - Scroll down past the hero section
   - See the AI assistant button appear on the **bottom-right**
   - Click it to test general chat

2. **Video Editor:**
   - Go to `/editor` route
   - See the Video Editor AI button on the **bottom-left**
   - Click "Start Editing" to begin
   - Try commands like:
     - "Increase brightness by 20"
     - "Add blur effect"
     - "Set volume to 80"

---

## 🎤 Example Voice Commands

Once connected to the Video Editor AI:

### Visual Adjustments:
- "Increase brightness by 20"
- "Make it darker"
- "Add more contrast"
- "Increase saturation"
- "Make it more colorful"

### Effects & Filters:
- "Add blur effect"
- "Apply sepia filter"
- "Make it black and white"
- "Add vintage effect"
- "Apply warm filter"

### Audio Control:
- "Increase volume to 80"
- "Mute the audio"
- "Unmute"
- "Set volume to 50 percent"

### Playback:
- "Play the video"
- "Pause"
- "Speed up to 2x"
- "Slow down to half speed"

### Clip Management:
- "Cut at 30 seconds"
- "Split here"
- "Trim the clip"

---

## 🔧 Troubleshooting

### Assistant Not Appearing
- Make sure you've added the environment variables
- Restart the development server
- Check browser console for errors

### Connection Errors
- Verify your VAPI public key is correct
- Ensure the Workflow ID or Assistant ID is valid
- Check that the assistant is properly configured in VAPI dashboard
- Make sure voice settings are configured

### "Meeting has ended" Error
- Check your VAPI account credits
- Verify assistant voice settings
- Ensure the assistant is activated in VAPI dashboard

---

## 📝 Summary

You now have:
- ✅ Two separate VAPI assistants
- ✅ Homepage assistant on bottom-right
- ✅ Video editor assistant on bottom-left
- ✅ Different names and purposes
- ✅ Same beautiful interface
- ✅ Independent configurations

Both assistants work independently and won't affect each other!

---

## 🚀 Next Steps

1. Create your video editor assistant in VAPI dashboard
2. Copy the Assistant ID or Workflow ID
3. Add it to your `.env` file
4. Restart the server
5. Test both assistants!

**Enjoy your voice-controlled video editor!** 🎬🎤✨

