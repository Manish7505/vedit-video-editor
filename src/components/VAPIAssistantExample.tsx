import React, { useState } from 'react'
import VAPIAssistant from './VAPIAssistant'
import { motion } from 'framer-motion'

/**
 * Example component showing how to use VAPIAssistant with custom configuration
 * This can be used as a reference for implementing the assistant in different parts of your app
 */
const VAPIAssistantExample: React.FC = () => {
  const [workflowId, setWorkflowId] = useState('')
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">VAPI Assistant Example</h1>
        
        <div className="bg-zinc-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Workflow ID
              </label>
              <input
                type="text"
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                placeholder="Enter your VAPI workflow ID"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Code Example</h2>
          <pre className="bg-zinc-800 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`import VAPIAssistant from './components/VAPIAssistant'

<VAPIAssistant 
  workflowId="${workflowId || 'your-workflow-id'}"
  position="${position}"
  theme="${theme}"
  size="${size}"
/>`}</code>
          </pre>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Live Preview</h2>
          <p className="text-gray-400 mb-4">
            The assistant widget will appear in the {position} corner with {theme} theme and {size} size.
            {!workflowId && (
              <span className="text-yellow-400 block mt-2">
                ⚠️ Please enter a workflow ID to test the assistant
              </span>
            )}
          </p>
        </div>
      </div>

      {/* The actual assistant widget */}
      {workflowId && (
        <VAPIAssistant 
          workflowId={workflowId}
          position={position}
          theme={theme}
          size={size}
        />
      )}
    </div>
  )
}

export default VAPIAssistantExample
