import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import HomePage from './pages/HomePage'
import VideoEditor from './pages/VideoEditor'
import Dashboard from './components/Dashboard'
import { VideoEditorProvider } from './contexts/VideoEditorContext'
import VAPIAssistant from './components/VAPIAssistant'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

// Public Route Component (no redirect - allow signed-in users to view homepage)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

function App() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

  if (!publishableKey) {
    throw new Error("Missing Publishable Key")
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <div className="min-h-screen bg-zinc-950">
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <HomePage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/editor" 
            element={
              <ProtectedRoute>
                <VideoEditorProvider>
                  <VideoEditor />
                </VideoEditorProvider>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/editor/:projectId" 
            element={
              <ProtectedRoute>
                <VideoEditorProvider>
                  <VideoEditor />
                </VideoEditorProvider>
              </ProtectedRoute>
            } 
          />
          {/* Catch-all route for undefined paths */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
                  <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            } 
          />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid #27272a',
            },
          }}
        />
        
        {/* VAPI AI Assistant */}
        <VAPIAssistant 
          workflowId={import.meta.env.VITE_VAPI_WORKFLOW_ID || ''}
          position="bottom-right"
        />
      </div>
    </ClerkProvider>
  )
}

export default App
