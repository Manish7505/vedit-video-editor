# Railway Environment Variables Configuration

## Required Environment Variables for Railway Deployment

### Core Application Variables
```
NODE_ENV=production
PORT=8080
```

### Frontend Variables (VITE_*)
```
VITE_API_URL=/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2FyZWZ1bC1tb2xlLTEuY2xlcmsuYWNjb3VudHMuZGV2JA
VITE_VAPI_PUBLIC_KEY=5d37cef6-c8d8-4903-a318-157d89551cf2
VITE_VAPI_WORKFLOW_ID=140b60c3-088a-4fd5-98b4-6dcb9817d0d5
VITE_VAPI_VIDEO_PUBLIC_KEY=5d37cef6-c8d8-4903-a318-157d89551cf2
VITE_VAPI_VIDEO_WORKFLOW_ID=140b60c3-088a-4fd5-98b4-6dcb9817d0d5
VITE_VAPI_VIDEO_ASSISTANT_ID=179a4347-ff8d-4f5b-bd4b-c83f7d13e489
```

### Backend Variables
```
CLERK_SECRET_KEY=sk_test_6tU55JHiIOcCGUaP3O667JN3RJTZ8RT8ZSHCPD9MnN
OPENROUTER_API_KEY=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
```

### Optional Variables
```
FRONTEND_URL=https://vedit-video-editor-production.up.railway.app
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
```

## How to Add Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Add each variable with its value
5. Click "Deploy" to apply changes

## Important Notes

- **VITE_API_URL**: Should be `/api` for production (relative path)
- **OPENROUTER_API_KEY**: Critical for AI functionality
- **CLERK_SECRET_KEY**: Required for authentication
- **VAPI_*_KEY**: Required for voice AI features
- All VITE_* variables are exposed to the frontend
- Backend variables are server-side only

## Verification

After adding all variables, the health check should show:
- AI service: Available
- Authentication: Configured
- Voice AI: Available
- All features: Working
