# 🎯 How to Get Your VAPI Assistant ID

## 🚨 **The "Unknown Error" Problem**

The "Unknown error" usually means your **Workflow ID** needs to be an **Assistant ID** instead.

VAPI has two types of IDs:
- **Workflow ID**: `8f8d1dc9-3683-4c75-b007-96b52d35e049` (what you have)
- **Assistant ID**: `asst_xxxxx` or similar (what you need)

---

## 🔍 **Step-by-Step Solution**

### Step 1: Go to VAPI Dashboard
1. Open [vapi.ai](https://vapi.ai) in your browser
2. Login with your account
3. You should see the main dashboard

### Step 2: Check Your Assistants
1. Look for **"Assistants"** in the left sidebar
2. Click on it
3. You should see a list of assistants

### Step 3: Find or Create an Assistant

**Option A: If you already have an assistant**
1. Click on any assistant in the list
2. Look for the **"Assistant ID"** or **"ID"** field
3. Copy this ID (it will look like `asst_xxxxx` or a UUID)

**Option B: If you don't have an assistant**
1. Click **"Create New Assistant"** or **"New Assistant"**
2. Fill in the details:
   - **Name**: "VEdit AI Assistant" (or any name)
   - **Voice**: Choose a voice (e.g., "Alloy", "Echo", "Nova")
   - **Model**: Choose AI model (GPT-4, GPT-3.5-turbo, etc.)
   - **System Prompt**: Add this:
     ```
     You are a helpful AI assistant for VEdit, a professional video editing platform.
     Help users with video editing questions, feature guidance, technical support, and creative suggestions.
     Be friendly, concise, and helpful. Speak naturally as if having a conversation.
     ```
3. **Link your workflow** (if there's an option)
4. Click **"Create"** or **"Save"**
5. Copy the **Assistant ID** that appears

### Step 4: Update Your Configuration

Once you have the Assistant ID, update your `.env` file:

```env
# VAPI AI Assistant
VITE_VAPI_PUBLIC_KEY=47ca6dee-a0e4-43ae-923d-44ae1311b959
VITE_VAPI_ASSISTANT_ID=your-assistant-id-here
```

**Replace `your-assistant-id-here` with the actual Assistant ID you copied.**

### Step 5: Restart and Test

1. Save the `.env` file
2. The server should restart automatically
3. Go to `http://localhost:3004/` (or whatever port is shown)
4. Try the voice chat again

---

## 🎯 **What the Assistant ID Looks Like**

Assistant IDs typically look like:
- `asst_abc123def456789`
- `550e8400-e29b-41d4-a716-446655440000` (UUID format)
- `asst_xxxxxxxxxxxxxxxx` (with 'asst_' prefix)

**Your current ID** (`8f8d1dc9-3683-4c75-b007-96b52d35e049`) looks like a **Workflow ID**, not an Assistant ID.

---

## 🔧 **Alternative: Use Workflow as Assistant**

Some VAPI setups allow workflows to be used directly. The updated code will try multiple methods:

1. **Method 1**: Try as `assistantId`
2. **Method 2**: Try as `workflowId`  
3. **Method 3**: Try as direct ID

If all methods fail, you'll get a clear error message telling you what to do.

---

## 📞 **Quick Test**

1. **Open your website**: `http://localhost:3004/`
2. **Look at the test panel** (top-left corner)
3. **Click "Start Call"** in the test panel
4. **Check the console** (F12) for detailed error messages
5. **Look for specific error details** that will tell you exactly what's wrong

---

## 🎊 **Expected Result**

Once you have the correct Assistant ID:
1. ✅ Test panel shows "VAPI initialized successfully"
2. ✅ "Start Call" button works
3. ✅ Status changes to "Connected"
4. ✅ You can speak and hear the AI response

---

## 🆘 **Still Having Issues?**

If you can't find the Assistants section or create an assistant:

1. **Check your VAPI plan**: Some features might require a paid plan
2. **Contact VAPI support**: They can help you set up an assistant
3. **Try the workflow directly**: The updated code will try multiple methods

**Tell me what you see in the VAPI dashboard and I'll help you find the right ID!** 🎯

---

## 💡 **Pro Tip**

The most common solution is:
1. Go to VAPI dashboard
2. Find "Assistants" section
3. Create a new assistant
4. Use the Assistant ID instead of Workflow ID
5. Update your `.env` file
6. Restart and test

**This should fix the "Unknown error" issue!** 🚀
