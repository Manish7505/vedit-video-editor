# 🔧 VEdit2.0 - Troubleshooting Guide

## 🐛 Common Issues & Solutions

---

## ❌ Issue: VAPI SDK Failed to Load (Line 548 Error)

### **Symptoms:**
- Console error: "Failed to load VAPI SDK"
- Voice button doesn't work
- Message: "⚠️ Could not load voice SDK"

### **Solutions:**

#### **1. Check Internet Connection**
The VAPI SDK loads from CDN. Make sure you're online.

```bash
# Test CDN access
curl https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/index.js
```

#### **2. Clear Browser Cache**
```
Chrome: Ctrl+Shift+Del → Clear cached images and files
Firefox: Ctrl+Shift+Del → Cache
```

#### **3. Refresh the Page**
```
Ctrl+F5 (hard refresh)
```

#### **4. Check Console Logs**
Open DevTools (F12) and look for:
- ✅ "VAPI SDK loaded successfully from CDN"
- ✅ "VAPI initialized successfully"

---

## ❌ Issue: Voice Commands Not Working

### **Symptoms:**
- Button clicks but nothing happens
- No transcription appearing
- "Start Voice Editing" doesn't connect

### **Solutions:**

#### **1. Check VAPI Credentials**
Verify in `src/components/VAPIVideoEditorAssistant.tsx`:
```typescript
const publicKey = '5d37cef6-c8d8-4903-a318-157d89551cf2'
const configWorkflowId = '140b60c3-088a-4fd5-98b4-6dcb9817d0d5'
const configAssistantId = '179a4347-ff8d-4f5b-bd4b-c83f7d13e489'
```

#### **2. Check Microphone Permissions**
- Chrome: Settings → Privacy → Microphone
- Firefox: Preferences → Privacy → Microphone
- Allow microphone access for localhost

#### **3. Test VAPI Dashboard**
- Go to https://vapi.ai/dashboard
- Check workflow status
- Verify workflow ID matches
- Test workflow in dashboard

#### **4. Check Console for Errors**
Look for:
- "VAPI call started" ✅
- "User started speaking" ✅
- Any error messages ❌

---

## ❌ Issue: Text Commands Not Working

### **Symptoms:**
- Typing commands but nothing happens
- No response in chat
- Video doesn't change

### **Solutions:**

#### **1. Upload a Video First**
You need a video uploaded before commands can work:
```
1. Click Upload button
2. Select a video file
3. Wait for it to appear on timeline
4. Then try commands
```

#### **2. Check Command Syntax**
Use these test commands:
```
"make it brighter"
"play video"
"add blur effect"
```

#### **3. Check Console for Errors**
Open DevTools (F12) and look for errors in Console tab

#### **4. Verify Video Element Exists**
In console, run:
```javascript
document.querySelector('video')
// Should return <video> element
```

---

## ❌ Issue: AI Button Not Visible

### **Symptoms:**
- Can't see the floating AI button
- Bottom-left corner is empty

### **Solutions:**

#### **1. Check You're on Editor Page**
Make sure URL is:
```
http://localhost:3005/editor
```

#### **2. Check Z-Index Issues**
The button has `z-50`. Check if anything is covering it.

#### **3. Refresh the Page**
```
Ctrl+F5
```

#### **4. Check Console for Component Errors**
```javascript
// Look for:
"AI Assistant button clicked!" // When you click
```

---

## ❌ Issue: Effects Not Applying

### **Symptoms:**
- Commands execute but video doesn't change
- Toast shows success but no visual change
- Filters not visible

### **Solutions:**

#### **1. Select a Clip**
Click on a clip in the timeline before running commands

#### **2. Check Video Element**
In console:
```javascript
const video = document.querySelector('video')
console.log(video.style.filter)
// Should show filter values
```

#### **3. Try Simpler Commands**
Start with basic commands:
```
"make it brighter"
"play video"
```

#### **4. Reset and Try Again**
```
"reset all effects"
```
Then try the command again.

---

## ❌ Issue: Chat Panel Won't Open

### **Symptoms:**
- Clicking AI button does nothing
- Panel doesn't appear

### **Solutions:**

#### **1. Check for JavaScript Errors**
Open DevTools Console and look for errors

#### **2. Verify Component is Rendering**
In React DevTools, check if `VAPIVideoEditorAssistant` exists

#### **3. Check Animation Issues**
Try disabling animations temporarily:
```css
/* In browser DevTools */
* {
  animation: none !important;
  transition: none !important;
}
```

---

## ❌ Issue: VAPI Connection Fails

### **Symptoms:**
- "Failed to start voice session"
- Connection errors in console
- VAPI error messages

### **Solutions:**

#### **1. Check VAPI Dashboard Status**
- Login to https://vapi.ai
- Check if workflow is active
- Verify billing/credits

#### **2. Verify Workflow Configuration**
In VAPI dashboard:
- Workflow ID: `140b60c3-088a-4fd5-98b4-6dcb9817d0d5`
- Status should be "Active"
- Check for any errors

#### **3. Test with Text Commands**
Text commands don't require VAPI connection:
```
Type: "make it brighter"
Press Enter
```

#### **4. Check Network Tab**
DevTools → Network tab → Look for VAPI API calls

---

## ❌ Issue: Commands Give Wrong Results

### **Symptoms:**
- "increase brightness" makes it darker
- Values don't match expectation
- Unexpected behavior

### **Solutions:**

#### **1. Reset All Filters**
```
"reset all effects"
```

#### **2. Use Specific Values**
Instead of: "make it brighter"
Try: "increase brightness by 20"

#### **3. Check Current State**
Commands are incremental. If brightness is already at 180%, "increase brightness" might max out at 200%.

---

## 🔍 Debugging Checklist

### **When Something Goes Wrong:**

1. **✅ Check Console (F12)**
   - Look for red errors
   - Check VAPI initialization logs
   - Verify command processing logs

2. **✅ Check Network Tab**
   - VAPI SDK loaded?
   - API calls successful?
   - Any 404 or 500 errors?

3. **✅ Check React DevTools**
   - Component rendering?
   - State values correct?
   - Props passed correctly?

4. **✅ Check VAPI Dashboard**
   - Workflow active?
   - Credits available?
   - No errors?

5. **✅ Try Text Commands First**
   - Isolate if issue is VAPI or command processing
   - Text commands always work offline

---

## 🚀 Quick Fixes

### **Most Issues Can Be Fixed By:**

1. **Hard Refresh**
   ```
   Ctrl+F5
   ```

2. **Clear Cache**
   ```
   Ctrl+Shift+Del
   ```

3. **Restart Dev Server**
   ```bash
   Ctrl+C
   npm run dev
   ```

4. **Upload a Video**
   ```
   Many commands require a video to be loaded
   ```

5. **Check Microphone**
   ```
   Browser needs microphone permission
   ```

---

## 📊 Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Failed to load VAPI SDK" | CDN not accessible | Check internet, refresh |
| "VAPI not initialized" | SDK didn't load | Wait longer, refresh page |
| "No clip selected" | No video on timeline | Upload video first |
| "No video element found" | Video not rendered | Check video is playing |
| "Failed to start voice session" | VAPI connection issue | Check dashboard, credits |
| "Connection error" | Network issue | Check internet, VAPI status |

---

## 🎯 Testing Commands

### **Always Test With These First:**

```bash
# Basic Commands (Always Work)
"make it brighter"
"play video"
"pause"

# If These Work, Try:
"add blur effect"
"increase contrast"
"make it cinematic"

# Advanced Commands:
"cut at 30 seconds"
"set volume to 80"
"zoom in"
```

---

## 📞 Still Having Issues?

### **Gather This Information:**

1. **Browser Console Output**
   - Copy all errors from Console tab
   - Include VAPI logs

2. **Network Tab**
   - Check if VAPI SDK loaded
   - Screenshot any failed requests

3. **Video State**
   - Is video uploaded?
   - Is clip selected?
   - What's current time?

4. **Command Attempted**
   - Exact command used
   - Expected vs actual result

5. **Environment**
   - Browser & version
   - Node version (`node --version`)
   - Dev server running?

---

## ✅ Verification Checklist

### **Everything Working When:**

- ✅ VAPI SDK loaded (console log)
- ✅ AI button visible (bottom-left)
- ✅ Chat panel opens on click
- ✅ Video uploaded on timeline
- ✅ Text command "make it brighter" works
- ✅ Video brightness actually increases
- ✅ Toast notification shows
- ✅ Message appears in chat
- ✅ Voice button available (if VAPI works)

---

## 🎬 Pro Tips

### **1. Text Commands Always Work**
Even if voice fails, text commands work independently!

### **2. Upload Video First**
90% of "not working" issues = no video uploaded

### **3. Check Console**
Console logs tell you exactly what's happening

### **4. Reset Often**
Use "reset all effects" to start fresh

### **5. Be Specific**
"increase brightness by 20" better than "make it nice"

---

## 🔄 Emergency Reset

### **If Everything Breaks:**

```bash
# 1. Stop server
Ctrl+C

# 2. Clear node modules
rm -rf node_modules
npm install

# 3. Clear browser
Ctrl+Shift+Del → Clear everything

# 4. Restart
npm run dev

# 5. Hard refresh
Ctrl+F5
```

---

## 📚 Reference Links

- **VAPI Dashboard:** https://vapi.ai/dashboard
- **VAPI Docs:** https://docs.vapi.ai
- **React DevTools:** Chrome Extension
- **Console Shortcuts:** F12 or Ctrl+Shift+I

---

**Remember: Text commands ALWAYS work, even if voice doesn't!** 

Just type in the input field and press Enter! 🚀

