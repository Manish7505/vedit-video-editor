# VAPI AI Assistant Setup Guide

This guide will help you integrate the VAPI AI assistant widget into your VEdit video editing platform.

## Prerequisites

1. A VAPI account (sign up at [vapi.ai](https://vapi.ai))
2. A VAPI workflow ID
3. Your VAPI public API key

## Setup Steps

### 1. Install Dependencies

The VAPI SDK has already been installed. If you need to reinstall:

```bash
npm install @vapi-ai/web
```

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# VAPI AI Assistant
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_WORKFLOW_ID=your-vapi-workflow-id
```

### 3. Get Your VAPI Credentials

1. **VAPI Public Key:**
   - Log into your VAPI dashboard
   - Go to Settings > API Keys
   - Copy your Public Key

2. **VAPI Workflow ID:**
   - In your VAPI dashboard, go to Workflows
   - Create a new workflow or select an existing one
   - Copy the Workflow ID from the workflow details

### 4. Configure Your Workflow

Make sure your VAPI workflow is configured for:
- **Voice Input:** Enable microphone access
- **Voice Output:** Configure TTS settings
- **AI Model:** Set up your preferred AI model (GPT-4, Claude, etc.)
- **System Prompt:** Customize the assistant's behavior for video editing

### 5. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your website
3. Look for the AI assistant widget in the bottom-right corner
4. Click the assistant button to open the panel
5. Click "Start Voice Chat" to test the connection

## Features

The VAPI assistant widget includes:

- **Floating UI:** Positioned in the bottom-right corner (customizable)
- **Voice Chat:** Start/end voice conversations with AI
- **Mute Controls:** Toggle microphone on/off
- **Status Indicators:** Visual feedback for connection status
- **Error Handling:** Graceful error messages and recovery
- **Responsive Design:** Works on desktop and mobile devices

## Customization

### Position Options
- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`

### Theme Options
- `dark` (default)
- `light`

### Size Options
- `small`
- `medium` (default)
- `large`

### Example Usage

```tsx
import VAPIAssistant from './components/VAPIAssistant'

// Basic usage
<VAPIAssistant workflowId="your-workflow-id" />

// Customized usage
<VAPIAssistant 
  workflowId="your-workflow-id"
  position="bottom-left"
  theme="light"
  size="large"
/>
```

## Troubleshooting

### Common Issues

1. **"VAPI not initialized" error:**
   - Check that your `VITE_VAPI_PUBLIC_KEY` is set correctly
   - Ensure the public key is valid and active

2. **"Workflow ID missing" error:**
   - Verify your `VITE_VAPI_WORKFLOW_ID` is set
   - Check that the workflow ID exists in your VAPI dashboard

3. **Connection fails:**
   - Check your internet connection
   - Verify microphone permissions are granted
   - Check browser console for detailed error messages

4. **Audio not working:**
   - Ensure microphone permissions are granted
   - Check browser audio settings
   - Try refreshing the page

### Debug Mode

To enable debug logging, add this to your browser console:

```javascript
localStorage.setItem('vapi-debug', 'true')
```

## Security Notes

- The public key is safe to use in frontend applications
- Never expose your private API key in frontend code
- Consider implementing rate limiting for production use
- Monitor usage in your VAPI dashboard

## Support

For VAPI-specific issues:
- VAPI Documentation: [docs.vapi.ai](https://docs.vapi.ai)
- VAPI Support: [support.vapi.ai](https://support.vapi.ai)

For integration issues:
- Check the browser console for error messages
- Verify all environment variables are set correctly
- Ensure the VAPI SDK is properly installed
