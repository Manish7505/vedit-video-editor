# Railway Clerk Production Setup Guide

## 🚨 **IMPORTANT: Clerk Production Keys Required**

Your Railway deployment is currently using **development/test Clerk keys** which won't work in production.

## 🔧 **How to Fix:**

### **Step 1: Get Production Clerk Keys**

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Select your application**
3. **Navigate to "API Keys"**
4. **Find "Production" section** (not "Development")
5. **Copy these keys**:
   - **Publishable Key**: Starts with `pk_live_`
   - **Secret Key**: Starts with `sk_live_`

### **Step 2: Update Railway Environment Variables**

In your Railway dashboard, go to **Variables** tab and update:

```bash
# Replace with your PRODUCTION Clerk keys
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_actual_production_key_here
CLERK_SECRET_KEY=sk_live_your_actual_production_secret_here
```

### **Step 3: Configure Clerk Production Settings**

In your Clerk dashboard:

1. **Go to "Domains"**
2. **Add your Railway domain**: `vedit-video-editor-production.up.railway.app`
3. **Set as production domain**
4. **Configure allowed origins** for your Railway URL

### **Step 4: Redeploy**

After updating the environment variables:
1. **Railway will auto-redeploy**
2. **Test authentication** on your production URL
3. **Verify no more "development keys" warnings**

## 🎯 **Expected Results:**

- ✅ No more "Clerk has been loaded with development keys" warnings
- ✅ Authentication works properly in production
- ✅ Users can sign in/up on your live site
- ✅ All Clerk features work as expected

## 🔍 **Current Issue:**

```
Clerk: Clerk has been loaded with development keys. 
Development instances have strict usage limits and should not be used 
when deploying your application to production.
```

This warning appears because you're using `pk_test_` keys instead of `pk_live_` keys.

## 📞 **Need Help?**

If you don't have production Clerk keys yet:
1. **Upgrade your Clerk plan** if needed
2. **Contact Clerk support** for production key access
3. **Check your Clerk dashboard** for production key availability

---

**Your Railway URL**: `https://vedit-video-editor-production.up.railway.app`
