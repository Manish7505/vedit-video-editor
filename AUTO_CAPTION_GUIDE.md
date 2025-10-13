# 🎬 Auto Caption Feature - Quick Guide

## ✨ Simple One-Click Caption Generation

Your VEdit now has a super simple **Auto Caption** button that automatically generates captions from your video's audio!

---

## 🚀 How to Use (3 Easy Steps)

### **Step 1: Upload Your Video**
1. Open VEdit editor: http://localhost:3001/editor
2. Click **"Add Media"** or drag & drop your video file
3. Your video will appear on the timeline

### **Step 2: Click "Auto Caption"**
1. Look for the **purple "Auto Caption" button** in the top toolbar
2. Click it once
3. Wait 1-3 minutes while AI processes your video

### **Step 3: See Captions!**
1. Captions automatically appear on your video
2. They sync perfectly with the audio
3. Play the video to see captions in real-time

**That's it!** 🎉

---

## 🎯 What You Get

### ✅ **Automatic Features:**
- **AI Transcription**: Uses OpenAI Whisper for accurate speech-to-text
- **Perfect Timing**: Captions sync automatically with audio
- **Professional Styling**: Clean, readable captions
- **Real-time Display**: See captions while playing video
- **Timeline Integration**: Captions appear in the timeline below video

### ✅ **Caption Appearance:**
- **Font**: Arial (clean and readable)
- **Size**: 32px (perfect for viewing)
- **Color**: White text with black background
- **Position**: Bottom of video (standard placement)
- **Animation**: Smooth fade in/out

---

## 📍 Where to Find It

The **Auto Caption** button is located in the **top toolbar**, right after the "Publish" button:

```
[Save] [Export] [Publish] [Auto Caption] ← Purple button
```

---

## 🎨 What Happens When You Click

1. **Button shows "Processing..."** with spinning icon
2. **AI extracts audio** from your video
3. **AI transcribes speech** to text
4. **Captions are generated** with timing
5. **Button shows "Done!"** with checkmark
6. **Captions appear** on video and timeline

---

## 👀 How to View Captions

### **On Video Preview:**
- Captions appear **overlaid on the video**
- They show **at the bottom** of the screen
- They appear **automatically** during playback
- They **fade in/out** smoothly

### **On Timeline:**
- Scroll down to see **Caption Track** below timeline
- Each caption shows as a **colored segment**
- Click segments to **edit text or timing**
- Add **manual captions** if needed

---

## ✏️ Editing Captions

### **Edit Caption Text:**
1. Find the caption in the Caption Track
2. Click the **edit icon** (pencil)
3. Type your changes
4. Click the **checkmark** to save

### **Adjust Timing:**
1. Click and **drag caption segments** on timeline
2. Adjust **start/end times** manually
3. Preview to check synchronization

### **Delete Captions:**
1. Click the **trash icon** on any caption
2. Caption is removed immediately

### **Add Manual Captions:**
1. Scroll to "Add New Caption" section
2. Enter **start time** and **end time**
3. Type **caption text**
4. Click **"Add Caption"**

---

## 🎯 Requirements

### **Must Have:**
- **OpenAI API Key**: Required for transcription
- **Video with Audio**: Clear speech works best
- **Internet Connection**: For AI processing

### **Setup:**
Add your OpenAI API key to `.env.local`:
```env
VITE_OPENAI_API_KEY=sk-proj-your-key-here
```

---

## 💰 Cost

- **~$0.006 per minute** of audio
- **Example**: 10-minute video = ~$0.06
- **Very affordable** for professional results

---

## 🎬 Best Results

### **For Best Accuracy:**
- ✅ Use **clear audio** with minimal background noise
- ✅ Speak **clearly and at moderate pace**
- ✅ Use **good microphone** quality
- ✅ Avoid **overlapping voices**

### **Supported:**
- ✅ **Multiple languages** (English, Spanish, French, etc.)
- ✅ **Any video format** (MP4, MOV, AVI, etc.)
- ✅ **Any video length** (short clips to full movies)
- ✅ **Multiple speakers** (AI detects speech automatically)

---

## 🔧 Troubleshooting

### **Button is Disabled (Gray)**
- **Reason**: No video uploaded yet
- **Fix**: Upload a video first

### **"Please upload a video first" Message**
- **Reason**: You clicked before uploading
- **Fix**: Add a video to the timeline

### **"Failed to generate captions" Error**
- **Reason**: Missing or invalid OpenAI API key
- **Fix**: Check your `.env.local` file has correct API key

### **Captions Not Showing**
- **Reason**: Video time not matching caption timing
- **Fix**: Play the video to see captions appear at correct times

### **Processing Takes Too Long**
- **Normal**: 1-3 minutes for 10-minute video
- **If Stuck**: Refresh page and try again
- **Check**: Internet connection and API key

---

## 🎉 Features

### **Current Features:**
- ✅ One-click caption generation
- ✅ Automatic audio transcription
- ✅ Real-time caption display
- ✅ Timeline integration
- ✅ Edit caption text
- ✅ Adjust timing
- ✅ Add manual captions
- ✅ Delete captions

### **Coming Soon:**
- 🔜 Custom caption styling (fonts, colors)
- 🔜 Multiple caption positions
- 🔜 Export captions as SRT/VTT files
- 🔜 Multi-language support selector
- 🔜 Speaker identification
- 🔜 Automatic translation

---

## 📊 Perfect For

### **Content Creators:**
- YouTube videos
- TikTok content
- Instagram Reels
- Social media posts

### **Business:**
- Training videos
- Marketing content
- Product demos
- Webinars

### **Education:**
- Online courses
- Tutorials
- Lectures
- Learning materials

### **Accessibility:**
- Hearing-impaired viewers
- Silent viewing (social media)
- Language learners
- SEO optimization

---

## 🎯 Quick Tips

1. **Upload video first** before clicking Auto Caption
2. **Wait patiently** - AI processing takes 1-3 minutes
3. **Review captions** after generation for accuracy
4. **Edit if needed** - AI is 95% accurate but not perfect
5. **Test playback** to ensure captions sync properly

---

## 🚀 Example Workflow

```
1. Upload Video → 2. Click "Auto Caption" → 3. Wait 2 minutes → 4. Captions appear! → 5. Edit if needed → 6. Export video
```

**Total Time**: ~5 minutes for complete captioned video! 🎉

---

## 💡 Pro Tips

### **For YouTube:**
- Captions improve SEO and discoverability
- Helps with accessibility requirements
- Increases watch time and engagement

### **For Social Media:**
- 85% of videos watched without sound
- Captions increase completion rates
- Better engagement and shares

### **For Business:**
- Professional appearance
- Accessibility compliance
- Better training outcomes

---

## 🎊 You're All Set!

Your VEdit now has **professional-grade automatic captioning** in just one click!

**Try it now:**
1. Upload a video
2. Click the purple "Auto Caption" button
3. Watch the magic happen! ✨

**Questions?** Check the main documentation or contact support.

---

*Making video content accessible to everyone, one caption at a time.* 🎬✨
