@echo off
echo Creating .env file with VAPI credentials...
echo.

(
echo # Frontend Environment Variables
echo VITE_API_URL=http://localhost:5000/api
echo.
echo # Clerk Authentication
echo VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key
echo.
echo # Optional: Supabase
echo VITE_SUPABASE_URL=your-supabase-url
echo VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
echo.
echo # Optional: OpenAI
echo VITE_OPENAI_API_KEY=your-openai-api-key
echo.
echo # VAPI AI Assistant
echo VITE_VAPI_PUBLIC_KEY=47ca6dee-a0e4-43ae-923d-44ae1311b959
echo VITE_VAPI_WORKFLOW_ID=8f8d1dc9-3683-4c75-b007-96b52d35e049
) > .env

echo.
echo ✓ .env file created successfully!
echo ✓ VAPI credentials have been added
echo.
echo Next steps:
echo 1. Restart your development server: npm run dev
echo 2. Open http://localhost:3004 in your browser
echo 3. Look for the AI assistant button in bottom-right corner
echo.
pause
