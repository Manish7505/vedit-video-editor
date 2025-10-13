import React, { useState, useEffect } from 'react'
import Vapi from '@vapi-ai/web'

const VAPIDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY || ''
  const workflowId = import.meta.env.VITE_VAPI_WORKFLOW_ID || ''

  useEffect(() => {
    const runDebug = async () => {
      setIsLoading(true)
      const results: string[] = []
      
      try {
        results.push('🔍 Starting VAPI Debug...')
        
        // Check environment variables
        results.push(`📋 Public Key: ${publicKey ? '✅ Found' : '❌ Missing'}`)
        results.push(`📋 Workflow ID: ${workflowId ? '✅ Found' : '❌ Missing'}`)
        
        if (!publicKey || !workflowId) {
          results.push('❌ Missing required environment variables')
          setTestResults(results)
          setIsLoading(false)
          return
        }

        // Initialize VAPI
        results.push('🔄 Initializing VAPI...')
        const vapi = new Vapi(publicKey)
        
        // Set up event listeners
        vapi.on('call-start', () => {
          results.push('✅ Call started successfully!')
          setTestResults([...results])
        })
        
        vapi.on('call-end', () => {
          results.push('📞 Call ended')
          setTestResults([...results])
        })
        
        vapi.on('error', (error: any) => {
          results.push(`❌ VAPI Error: ${JSON.stringify(error, null, 2)}`)
          setTestResults([...results])
        })

        results.push('✅ VAPI initialized successfully')
        setTestResults([...results])

        // Test different methods - VAPI expects direct ID first
        const methods = [
          { name: 'Direct ID', config: workflowId },
          { name: 'Workflow ID', config: { workflowId: workflowId } },
          { name: 'Assistant ID', config: { assistantId: workflowId } }
        ]

        for (const method of methods) {
          try {
            results.push(`🔄 Testing ${method.name}...`)
            setTestResults([...results])
            
            await vapi.start(method.config)
            results.push(`✅ SUCCESS with ${method.name}!`)
            setTestResults([...results])
            return // Exit on first success
            
          } catch (error: any) {
            results.push(`❌ ${method.name} failed: ${error.message || error}`)
            setTestResults([...results])
          }
        }

        results.push('❌ All methods failed. You need an Assistant ID.')
        results.push('💡 Go to VAPI dashboard → Assistants → Create Assistant')
        setTestResults([...results])

      } catch (error: any) {
        results.push(`❌ Debug failed: ${error.message}`)
        setTestResults([...results])
      }
      
      setIsLoading(false)
    }

    runDebug()
  }, [publicKey, workflowId])

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/95 backdrop-blur-lg rounded-lg p-4 border border-white/20 max-w-lg max-h-96 overflow-y-auto">
      <h3 className="text-white font-bold mb-3">🔍 VAPI Debugger</h3>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Public Key:</span>
          <span className={`font-mono ${publicKey ? 'text-green-400' : 'text-red-400'}`}>
            {publicKey ? `${publicKey.substring(0, 8)}...` : 'Missing'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Workflow ID:</span>
          <span className={`font-mono ${workflowId ? 'text-green-400' : 'text-red-400'}`}>
            {workflowId ? `${workflowId.substring(0, 8)}...` : 'Missing'}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-white font-medium mb-2">Test Results:</h4>
        <div className="bg-gray-900 rounded p-2 max-h-48 overflow-y-auto">
          {testResults.map((result, index) => (
            <div key={index} className="text-xs text-gray-300 mb-1 font-mono">
              {result}
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="mt-2 text-yellow-400 text-xs">
          🔄 Running tests...
        </div>
      )}
    </div>
  )
}

export default VAPIDebugger
