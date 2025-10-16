# 🚀 RAILWAY BACKEND DEPLOYMENT GUIDE

## 🎯 **DEPLOY BACKEND TO RAILWAY**

### **Step 1: Go to Railway**
**Visit:** [railway.app](https://railway.app)

### **Step 2: Create New Project**
1. **Sign up/Login** with GitHub
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Find: `Manish7505/vedit-video-editor`**
5. **Click "Deploy Now"**

### **Step 3: Configure for Backend Only**
1. **Go to Settings** → **General**
2. **Change Root Directory** to: `server`
3. **Save changes**

### **Step 4: Add Environment Variables**
In Railway dashboard → **Variables** tab:

```
NODE_ENV=production
PORT=8080
CLERK_SECRET_KEY=sk_test_6tU55JHiIOcCGUaP3O667JN3RJTZ8RT8ZSHCPD9MnN
MONGODB_URI=mongodb://localhost:27017/vedit
```

### **Step 5: Update Build Settings**
1. **Go to Settings** → **Build**
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. **Save changes**

### **Step 6: Deploy**
1. **Go to Deployments** tab
2. **Click "Redeploy"**
3. **Wait for deployment** (5-10 minutes)

---

## 🎉 **WHAT YOU GET:**

### **✅ Backend API:**
- **Health check:** `https://your-backend.railway.app/api/health`
- **File upload:** `https://your-backend.railway.app/api/files/upload`
- **AI routes:** `https://your-backend.railway.app/api/ai/*`
- **Render routes:** `https://your-backend.railway.app/api/render/*`

### **✅ CORS Support:**
- **Frontend can connect** from any domain
- **VAPI assistants work** with backend support
- **File upload works** properly

---

## 🔗 **CONNECT TO VERCEL FRONTEND:**

### **Step 1: Get Railway Backend URL**
After deployment, copy your Railway URL: `https://your-backend.railway.app`

### **Step 2: Update Vercel Environment Variables**
Add to Vercel → Settings → Environment Variables:
```
VITE_API_URL=https://your-backend.railway.app
```

### **Step 3: Redeploy Vercel**
Vercel will automatically redeploy with the new API URL.

---

## 🚀 **READY TO DEPLOY:**

**Go to [railway.app](https://railway.app) and deploy your backend now!**

**Your VAPI assistants will work perfectly with the backend!** 🎬✨
