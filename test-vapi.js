// Simple VAPI test script
// Run this in your browser console to test VAPI connection

console.log('🧪 Testing VAPI Connection...');

// Check environment variables
console.log('📋 Environment Check:');
console.log('Public Key:', import.meta.env.VITE_VAPI_PUBLIC_KEY ? '✅ Found' : '❌ Missing');
console.log('Workflow ID:', import.meta.env.VITE_VAPI_WORKFLOW_ID ? '✅ Found' : '❌ Missing');

// Test VAPI initialization
async function testVAPI() {
  try {
    console.log('🔄 Loading VAPI SDK...');
    const Vapi = (await import('@vapi-ai/web')).default;
    
    console.log('🔄 Initializing VAPI...');
    const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);
    
    console.log('✅ VAPI initialized successfully');
    
    // Set up event listeners
    vapi.on('call-start', () => {
      console.log('✅ Call started successfully!');
    });
    
    vapi.on('call-end', () => {
      console.log('📞 Call ended');
    });
    
    vapi.on('error', (error) => {
      console.error('❌ VAPI Error:', error);
    });
    
    // Test different connection methods
    const workflowId = import.meta.env.VITE_VAPI_WORKFLOW_ID;
    
    console.log('🔄 Testing connection methods...');
    
    // Method 1: Try as assistantId
    try {
      console.log('🔄 Method 1: Trying as assistantId...');
      await vapi.start({ assistantId: workflowId });
      console.log('✅ Success with assistantId method!');
      return;
    } catch (err) {
      console.log('❌ Method 1 failed:', err.message);
    }
    
    // Method 2: Try as workflowId
    try {
      console.log('🔄 Method 2: Trying as workflowId...');
      await vapi.start({ workflowId: workflowId });
      console.log('✅ Success with workflowId method!');
      return;
    } catch (err) {
      console.log('❌ Method 2 failed:', err.message);
    }
    
    // Method 3: Try direct ID
    try {
      console.log('🔄 Method 3: Trying with direct ID...');
      await vapi.start(workflowId);
      console.log('✅ Success with direct ID method!');
      return;
    } catch (err) {
      console.log('❌ Method 3 failed:', err.message);
    }
    
    console.log('❌ All methods failed. You likely need an Assistant ID instead of a Workflow ID.');
    console.log('💡 Go to your VAPI dashboard and create an assistant, then use the Assistant ID.');
    
  } catch (error) {
    console.error('❌ Failed to initialize VAPI:', error);
  }
}

// Run the test
testVAPI();

console.log('💡 Check the console output above for detailed results.');
