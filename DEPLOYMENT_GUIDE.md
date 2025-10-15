# 🚀 **FREE DEPLOYMENT GUIDE - VEdit Video Editor**

## 🎯 **RECOMMENDED: Render.com (Best Option)**

### **Why Render.com?**
- ✅ **Free tier** with 750 hours/month
- ✅ **Supports both frontend and backend**
- ✅ **Can install FFmpeg** for video processing
- ✅ **Automatic deployments** from GitHub
- ✅ **Custom domains** on free tier
- ✅ **No credit card required**

---

## 📋 **STEP-BY-STEP DEPLOYMENT**

### **Step 1: Prepare Your Code**

1. **Commit all changes to Git:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Make sure your GitHub repository is public** (required for free Render deployment)

### **Step 2: Deploy Backend on Render**

1. **Go to [render.com](https://render.com)** and sign up with GitHub
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the backend service:**
   - **Name**: `vedit-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: `Free`

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   CLERK_SECRET_KEY=your_clerk_secret_key
   MONGODB_URI=mongodb://localhost:27017/vedit
   ```

6. **Click "Create Web Service"**

### **Step 3: Deploy Frontend on Render**

1. **Click "New +" → "Static Site"**
2. **Connect your GitHub repository**
3. **Configure the frontend service:**
   - **Name**: `vedit-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: `Free`

4. **Add Environment Variables:**
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
   VITE_VAPI_WORKFLOW_ID=your_vapi_workflow_id
   VITE_VAPI_VIDEO_PUBLIC_KEY=your_vapi_video_public_key
   VITE_VAPI_VIDEO_WORKFLOW_ID=your_vapi_video_workflow_id
   VITE_VAPI_VIDEO_ASSISTANT_ID=your_vapi_video_assistant_id
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

5. **Click "Create Static Site"**

### **Step 4: Update Frontend API URLs**

After deployment, you'll need to update the API URLs in your frontend to point to your Render backend URL.

---

## 🐳 **ALTERNATIVE: Docker Deployment**

### **For VPS/Cloud Providers:**

1. **Upload your code to a VPS** (DigitalOcean, Linode, etc.)
2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

---

## 🌐 **OTHER FREE OPTIONS**

### **Option 2: Vercel (Frontend Only)**
- ✅ **Excellent for frontend**
- ❌ **No backend support**
- ❌ **No FFmpeg support**
- **Use with**: Simple download mode only

### **Option 3: Netlify (Frontend Only)**
- ✅ **Great for static sites**
- ❌ **No backend support**
- ❌ **No FFmpeg support**
- **Use with**: Simple download mode only

### **Option 4: Railway**
- ✅ **Full-stack support**
- ✅ **FFmpeg support**
- ❌ **Limited free tier**
- **Cost**: $5/month after free tier

---

## 🔧 **POST-DEPLOYMENT SETUP**

### **1. Update Environment Variables**
Make sure all your API keys are properly set in the Render dashboard.

### **2. Test Your Deployment**
- ✅ **Frontend loads** without errors
- ✅ **VAPI assistants work**
- ✅ **File upload works**
- ✅ **Export functionality works** (with fallback mode)

### **3. Custom Domain (Optional)**
- Render allows custom domains on free tier
- Add your domain in the Render dashboard

---

## 🎯 **WHAT WILL WORK AFTER DEPLOYMENT**

### **✅ WILL WORK:**
- ✅ **VAPI AI Assistants** (cloud-based)
- ✅ **OpenRouter AI** (cloud-based)
- ✅ **Video editing interface**
- ✅ **File uploads**
- ✅ **Simple download mode** (fallback export)
- ✅ **All UI features**

### **⚠️ MIGHT NOT WORK:**
- ⚠️ **Full video rendering** (depends on FFmpeg installation)
- ⚠️ **Database features** (MongoDB not included in free tier)

### **❌ WON'T WORK:**
- ❌ **Local file processing** (browser limitations)
- ❌ **Advanced video effects** (requires server processing)

---

## 🚀 **QUICK START COMMANDS**

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to render.com and create services
# 3. Add environment variables
# 4. Deploy!

# For Docker deployment:
docker-compose up -d
```

---

## 📞 **SUPPORT**

If you encounter issues:
1. **Check Render logs** in the dashboard
2. **Verify environment variables** are set correctly
3. **Test locally first** before deploying
4. **Use fallback export mode** if full rendering fails

**Your video editor will work great on Render.com with the free tier!** 🎬✨