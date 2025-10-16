// Backend AI Service - Handles communication with the backend OpenRouter API
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface BackendAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface BackendAIResponse {
  message: string;
  timestamp: string;
  action?: string;
  confidence?: number;
  data?: any;
}

interface VideoContext {
  currentTime: number;
  duration: number;
  clipsCount: number;
  selectedClip: string | null;
  clips: any[];
  tracks: any[];
  playbackState: 'playing' | 'paused';
  currentEffects: any;
}

class BackendAIService {
  private baseUrl: string;
  private isConnected: boolean = false;
  private lastConnectionCheck: number = 0;
  private connectionCheckInterval: number = 10000; // 10 seconds
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;

  constructor() {
    this.baseUrl = API_URL;
    console.log('🚀 BackendAIService initialized');
    console.log('📍 Base URL:', this.baseUrl);
    console.log('🌍 Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('🔧 Fallback API_URL:', API_URL);
    
    // Test connection immediately
    this.testConnection().then(connected => {
      console.log('🔗 Initial connection test:', connected ? 'SUCCESS' : 'FAILED');
    });
  }

  // Check if AI service is available (synchronous)
  isAvailable(): boolean {
    return true; // Always available if backend is running
  }

  // Check if AI service is available (asynchronous)
  async isAvailableAsync(): Promise<boolean> {
    try {
      const now = Date.now();
      // Only check every 10 seconds to avoid too many requests
      if (now - this.lastConnectionCheck < this.connectionCheckInterval) {
        return this.isConnected;
      }

      console.log('🔍 Checking AI availability...');
      const isConnected = await this.testConnection();
      this.isConnected = isConnected;
      this.lastConnectionCheck = now;
      
      console.log('📊 AI availability check result:', isConnected ? 'CONNECTED' : 'DISCONNECTED');
      return isConnected;
    } catch (error) {
      console.error('❌ AI service availability check failed:', error);
      this.isConnected = false;
      this.lastConnectionCheck = Date.now();
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing AI connection...');
      console.log('🎯 Target URL:', `${this.baseUrl}/ai/status`);
      
      this.connectionAttempts++;
      console.log(`📈 Connection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000);
      });
      
      // Create the fetch promise
      const fetchPromise = fetch(`${this.baseUrl}/ai/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      if (!response.ok) {
        console.log('❌ Response not OK:', response.status, response.statusText);
        return false;
      }
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      const isConnected = data.success && data.data?.available;
      console.log('✅ Connection test result:', isConnected ? 'SUCCESS' : 'FAILED');
      
      if (isConnected) {
        this.connectionAttempts = 0; // Reset on success
      }
      
      return isConnected;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        console.log('🔄 Max connection attempts reached, resetting counter');
        this.connectionAttempts = 0;
      }
      
      return false;
    }
  }

  async chat(message: string): Promise<BackendAIResponse> {
    try {
      console.log('💬 Sending chat message to backend:', message);
      const response = await axios.post(`${this.baseUrl}/ai/chat`, { 
        message 
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('💬 Chat response received:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Backend AI chat failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get AI chat response');
    }
  }

  async analyzeVideoCommand(command: string, videoContext: VideoContext): Promise<BackendAIResponse> {
    try {
      console.log('🎬 Analyzing video command:', command);
      console.log('📊 Video context:', videoContext);
      
      const response = await axios.post(`${this.baseUrl}/ai/execute-command`, { 
        command, 
        videoContext 
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('🎬 Command analysis response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Backend AI command execution failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to execute AI command');
    }
  }

  async getSuggestions(prompt: string, videoContext: VideoContext): Promise<BackendAIResponse> {
    try {
      console.log('💡 Getting AI suggestions for:', prompt);
      const response = await axios.post(`${this.baseUrl}/ai/suggestions`, { 
        prompt, 
        videoContext 
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('💡 Suggestions response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Backend AI suggestions failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get AI suggestions');
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Force connection check
  async forceConnectionCheck(): Promise<boolean> {
    console.log('🔄 Forcing connection check...');
    this.lastConnectionCheck = 0; // Reset to force immediate check
    this.connectionAttempts = 0; // Reset attempts
    return await this.isAvailableAsync();
  }

  // Debug connection method
  async debugConnection(): Promise<void> {
    console.log('🔍 === AI Connection Debug ===');
    console.log('📍 Base URL:', this.baseUrl);
    console.log('🎯 Full URL:', `${this.baseUrl}/ai/status`);
    console.log('🔗 Current connection status:', this.isConnected);
    console.log('⏰ Last check time:', new Date(this.lastConnectionCheck).toISOString());
    console.log('📊 Connection attempts:', this.connectionAttempts);
    console.log('🌍 Environment:', {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    });
    
    try {
      console.log('🧪 Running connection test...');
      const result = await this.testConnection();
      console.log('✅ Test connection result:', result);
      
      if (result) {
        console.log('🎉 AI service is working correctly!');
      } else {
        console.log('❌ AI service connection failed');
      }
    } catch (error) {
      console.error('❌ Debug connection error:', error);
    }
    console.log('🔍 === End Debug ===');
  }

  // Get service info
  async getServiceInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get service info:', error);
      return null;
    }
  }
}

export const backendAIService = new BackendAIService();

// Make debug functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).debugAI = () => backendAIService.debugConnection();
  (window as any).testAI = () => backendAIService.testConnection();
  (window as any).getAIInfo = () => backendAIService.getServiceInfo();
  (window as any).forceAICheck = () => backendAIService.forceConnectionCheck();
}