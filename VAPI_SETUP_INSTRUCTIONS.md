# 🚀 VAPI AI Assistant Setup Instructions

## 📋 **Required Setup Steps**

To get the VAPI AI Assistant working, you need to complete these steps:

---

## 1. **Create .env File**

Create a `.env` file in your project root with the following content:

```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:5000/api

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key

# Optional: Supabase (if using Supabase features)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: OpenAI (if using client-side OpenAI)
VITE_OPENAI_API_KEY=your-openai-api-key

# VAPI AI Assistant - REQUIRED
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key-here
VITE_VAPI_WORKFLOW_ID=your-vapi-workflow-id-here
```

---

## 2. **Get VAPI Credentials**

### **Step 1: Sign up for VAPI**
1. Go to [https://vapi.ai](https://vapi.ai)
2. Create an account
3. Complete the setup process

### **Step 2: Get Public Key**
1. Go to your VAPI dashboard
2. Navigate to "API Keys" section
3. Copy your **Public Key**
4. Replace `your-vapi-public-key-here` in the .env file

### **Step 3: Create Assistant or Workflow**
1. Go to "Assistants" or "Workflows" in your VAPI dashboard
2. Create a new assistant or workflow
3. Configure the assistant with:
   - **Voice**: Choose a voice (e.g., "alloy", "nova", "shimmer")
   - **Model**: Choose a model (e.g., "gpt-4", "gpt-3.5-turbo")
   - **System Message**: Set up the assistant's personality
   - **Activation**: Set to "push-to-talk" or "voice-activity-detection"

### **Step 4: Get Workflow/Assistant ID**
1. Copy the **ID** of your created assistant or workflow
2. Replace `your-vapi-workflow-id-here` in the .env file

---

## 3. **Example Configuration**

Here's an example of what your .env file should look like:

```env
# VAPI AI Assistant
VITE_VAPI_PUBLIC_KEY=pk_1234567890abcdef1234567890abcdef
VITE_VAPI_WORKFLOW_ID=8f8d1dc9-3683-4c75-b007-96b52d35e049
```

---

## 4. **Restart Development Server**

After creating the .env file:

1. Stop your development server (Ctrl+C)
2. Run `npm run dev` again
3. The VAPI assistant should now work!

---

## 5. **Testing the Assistant**

1. **Scroll down** on the homepage to make the assistant visible
2. **Click the floating button** to open the chat panel
3. **Click "Start Call"** to begin a voice conversation
4. **Speak** and the assistant will respond with voice

---

## 🔧 **Troubleshooting**

### **Issue: "VAPI public key not found"**
- ✅ Make sure your .env file exists in the project root
- ✅ Check that `VITE_VAPI_PUBLIC_KEY` is set correctly
- ✅ Restart the development server

### **Issue: "Workflow ID not found"**
- ✅ Make sure `VITE_VAPI_WORKFLOW_ID` is set in your .env file
- ✅ Verify the ID is correct in your VAPI dashboard

### **Issue: "Failed to start call"**
- ✅ Check that your VAPI account has credits
- ✅ Verify the assistant/workflow is properly configured
- ✅ Make sure the assistant is activated

### **Issue: Assistant not visible**
- ✅ Scroll down on the homepage (assistant hides on hero section)
- ✅ Check browser console for any errors
- ✅ Make sure the development server is running

---

## 🎯 **Features Available**

Once set up, the VAPI assistant provides:

- ✅ **Voice Conversations** - Real-time voice chat
- ✅ **Visual Chat Interface** - See conversation history
- ✅ **Mute/Unmute** - Control microphone during calls
- ✅ **Call Management** - Start/end calls easily
- ✅ **Error Handling** - Clear error messages
- ✅ **Responsive Design** - Works on all devices

---

## 🚀 **Next Steps**

After setup:
1. **Test the assistant** with voice conversations
2. **Customize the assistant** in your VAPI dashboard
3. **Add more features** as needed
4. **Deploy** with your VAPI credentials

**The VAPI AI Assistant is now ready to use!** 🎉
