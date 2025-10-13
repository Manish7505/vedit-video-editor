import React, { useState, useEffect } from 'react'
import Vapi from '@vapi-ai/web'

const VAPITest: React.FC = () => {
  const [status, setStatus] = useState('Initializing...')
  const [error, setError] = useState<string | null>(null)
  const [vapi, setVapi] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY || ''
  const workflowId = import.meta.env.VITE_VAPI_WORKFLOW_ID || ''

  useEffect(() => {
    const testVAPI = async () => {
      try {
        setStatus('Loading VAPI SDK...')
        
        if (!publicKey) {
          setError('VAPI public key not found in environment variables')
          setStatus('Error: No public key')
          return
        }

        if (!workflowId) {
          setError('Workflow ID not found in environment variables')
          setStatus('Error: No workflow ID')
          return
        }

        setStatus('Initializing VAPI...')
        const vapiInstance = new Vapi(publicKey)
        setVapi(vapiInstance)

        // Set up event listeners
        vapiInstance.on('call-start', () => {
          setStatus('✅ Call started successfully!')
          setIsConnected(true)
        })

        vapiInstance.on('call-end', () => {
          setStatus('📞 Call ended')
          setIsConnected(false)
        })

        vapiInstance.on('error', (error: any) => {
          setError(`VAPI Error: ${error.message || 'Unknown error'}`)
          setStatus('❌ Error occurred')
          setIsConnected(false)
        })

        setStatus('✅ VAPI initialized successfully')
        setError(null)

      } catch (err: any) {
        setError(`Failed to initialize VAPI: ${err.message}`)
        setStatus('❌ Initialization failed')
      }
    }

    testVAPI()
  }, [publicKey, workflowId])

  const startCall = async () => {
    if (!vapi) {
      setError('VAPI not initialized')
      return
    }

    try {
      setStatus('Starting call...')
      setError(null)

      // Try as assistantId first
      await vapi.start({ assistantId: workflowId })
    } catch (err: any) {
      console.error('Failed with assistantId, trying workflowId...')
      try {
        // Try as workflowId
        await vapi.start({ workflowId: workflowId })
      } catch (retryErr: any) {
        setError(`Failed to start call: ${retryErr.message || 'Unknown error'}`)
        setStatus('❌ Call failed')
      }
    }
  }

  const endCall = async () => {
    if (vapi) {
      try {
        await vapi.stop()
        setStatus('Call ended')
        setIsConnected(false)
      } catch (err) {
        console.error('Error ending call:', err)
      }
    }
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/90 backdrop-blur-lg rounded-lg p-4 border border-white/20 max-w-md">
      <h3 className="text-white font-bold mb-3">VAPI Test Panel</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Status:</span>
          <span className={`font-medium ${status.includes('✅') ? 'text-green-400' : status.includes('❌') ? 'text-red-400' : 'text-yellow-400'}`}>
            {status}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Public Key:</span>
          <span className={`font-mono text-xs ${publicKey ? 'text-green-400' : 'text-red-400'}`}>
            {publicKey ? `${publicKey.substring(0, 8)}...` : 'Not found'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Workflow ID:</span>
          <span className={`font-mono text-xs ${workflowId ? 'text-green-400' : 'text-red-400'}`}>
            {workflowId ? `${workflowId.substring(0, 8)}...` : 'Not found'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Connected:</span>
          <span className={`font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-xs">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={startCall}
          disabled={!vapi || isConnected}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Call
        </button>
        
        <button
          onClick={endCall}
          disabled={!vapi || !isConnected}
          className="px-3 py-1 bg-red-500 text-white rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          End Call
        </button>
      </div>
    </div>
  )
}

export default VAPITest
