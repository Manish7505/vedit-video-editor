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
  private connectionCheckInterval: number = 30000; // 30 seconds

  constructor() {
    this.baseUrl = API_URL;
    console.log('BackendAIService initialized with URL:', this.baseUrl);
  }

  // Check if AI service is available (synchronous)
  isAvailable(): boolean {
    return true; // Always available if backend is running
  }

  // Check if AI service is available (asynchronous)
  async isAvailableAsync(): Promise<boolean> {
    try {
      const now = Date.now();
      // Only check every 30 seconds to avoid too many requests
      if (now - this.lastConnectionCheck < this.connectionCheckInterval) {
        return this.isConnected;
      }

      const response = await fetch(`${this.baseUrl}/ai/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const data = await response.json();
      this.isConnected = response.ok && data.success && data.data?.available;
      this.lastConnectionCheck = now;
      
      console.log('AI connection check:', this.isConnected ? 'CONNECTED' : 'DISCONNECTED');
      return this.isConnected;
    } catch (error) {
      console.error('AI service availability check failed:', error);
      this.isConnected = false;
      this.lastConnectionCheck = Date.now();
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing AI connection to:', `${this.baseUrl}/ai/status`);
      const response = await axios.get(`${this.baseUrl}/ai/status`, {
        timeout: 5000
      });
      
      const isConnected = response.status === 200 && response.data.success;
      console.log('AI connection test result:', isConnected ? 'SUCCESS' : 'FAILED');
      return isConnected;
    } catch (error) {
      console.error('Backend AI service connection test failed:', error);
      return false;
    }
  }

  async chat(message: string): Promise<BackendAIResponse> {
    try {
      console.log('Sending chat message to backend:', message);
      const response = await axios.post(`${this.baseUrl}/ai/chat`, { 
        message 
      }, {
        timeout: 30000
      });
      
      console.log('Chat response received:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Backend AI chat failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get AI chat response');
    }
  }

  async analyzeVideoCommand(command: string, videoContext: VideoContext): Promise<BackendAIResponse> {
    try {
      console.log('Sending video command to backend:', command);
      console.log('Video context:', videoContext);
      
      const response = await axios.post(`${this.baseUrl}/ai/execute-command`, { 
        command, 
        videoContext 
      }, {
        timeout: 30000
      });
      
      console.log('Command analysis response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Backend AI command execution failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to execute AI command');
    }
  }

  async getSuggestions(prompt: string, videoContext: VideoContext): Promise<BackendAIResponse> {
    try {
      console.log('Getting AI suggestions for:', prompt);
      const response = await axios.post(`${this.baseUrl}/ai/suggestions`, { 
        prompt, 
        videoContext 
      }, {
        timeout: 30000
      });
      
      console.log('Suggestions response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Backend AI suggestions failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get AI suggestions');
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Force connection check
  async forceConnectionCheck(): Promise<boolean> {
    this.lastConnectionCheck = 0; // Reset to force immediate check
    return await this.isAvailableAsync();
  }
}

export const backendAIService = new BackendAIService();