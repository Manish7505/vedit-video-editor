@echo off
echo Creating .env file for VAPI AI Assistant...
echo.

if exist .env (
    echo .env file already exists!
    echo Please edit it manually to add your VAPI credentials.
    echo.
    echo Required variables:
    echo VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
    echo VITE_VAPI_WORKFLOW_ID=your-vapi-workflow-id
    echo.
    pause
    exit /b
)

echo Creating new .env file...

(
echo # Frontend Environment Variables
echo VITE_API_URL=http://localhost:5000/api
echo.
echo # Clerk Authentication
echo VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key
echo.
echo # Optional: Supabase ^(if using Supabase features^)
echo VITE_SUPABASE_URL=your-supabase-url
echo VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
echo.
echo # Optional: OpenAI ^(if using client-side OpenAI^)
echo VITE_OPENAI_API_KEY=your-openai-api-key
echo.
echo # VAPI AI Assistant - REQUIRED
echo VITE_VAPI_PUBLIC_KEY=your-vapi-public-key-here
echo VITE_VAPI_WORKFLOW_ID=your-vapi-workflow-id-here
) > .env

echo.
echo ✅ .env file created successfully!
echo.
echo 📋 Next steps:
echo 1. Get your VAPI credentials from https://vapi.ai
echo 2. Edit the .env file and replace:
echo    - your-vapi-public-key-here with your actual public key
echo    - your-vapi-workflow-id-here with your actual workflow ID
echo 3. Restart your development server
echo.
echo 📖 See VAPI_SETUP_INSTRUCTIONS.md for detailed setup guide
echo.
pause
