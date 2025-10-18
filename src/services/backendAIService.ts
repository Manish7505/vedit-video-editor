// Backend AI Service - Handles communication with the backend OpenRouter API
import axios from 'axios'
import { logger } from '../utils/logger';

// Dynamic API URL: prefer env override; otherwise use relative path so Vite proxy works in dev
const API_URL = (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) || '/api'


interface BackendAIResponse {
  message: string;
  timestamp: string;
  action?: string;
  confidence?: number;
  data?: any;
}

import { VideoContext } from '../types/videoContext'

class BackendAIService {
  private baseUrl: string;
  private isConnected: boolean = false;
  private lastConnectionCheck: number = 0;
  private connectionCheckInterval: number = 10000; // 10 seconds
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;

  constructor() {
    this.baseUrl = API_URL;
    logger.info('🚀 BackendAIService initialized');
    logger.debug('📍 Base URL:', this.baseUrl);
    logger.debug('🌍 Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
    logger.debug('🔧 Hardcoded API_URL:', API_URL);
    logger.debug('🎯 Full status URL:', `${this.baseUrl}/ai/status`);
    
    // Test connection immediately
    this.testConnection().then(connected => {
      logger.info('🔗 Initial connection test:', connected ? 'SUCCESS' : 'FAILED');
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

      logger.debug('🔍 Checking AI availability...');
      const isConnected = await this.testConnection();
      this.isConnected = isConnected;
      this.lastConnectionCheck = now;
      
      logger.debug('📊 AI availability check result:', isConnected ? 'CONNECTED' : 'DISCONNECTED');
      return isConnected;
    } catch (error) {
      logger.error('❌ AI service availability check failed:', error);
      this.isConnected = false;
      this.lastConnectionCheck = Date.now();
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      logger.debug('🧪 Testing AI connection...');
      logger.debug('🎯 Target URL:', `${this.baseUrl}/ai/status`);
      
      this.connectionAttempts++;
      logger.debug(`📈 Connection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
      
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
      
      logger.debug('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      if (!response.ok) {
        logger.error('❌ Response not OK:', response.status, response.statusText);
        return false;
      }
      
      const data = await response.json();
      logger.debug('📦 Response data:', data);
      
      const isConnected = data.success && data.data?.available;
      logger.info('✅ Connection test result:', isConnected ? 'SUCCESS' : 'FAILED');
      
      if (isConnected) {
        this.connectionAttempts = 0; // Reset on success
      }
      
      return isConnected;
    } catch (error) {
      logger.error('❌ Connection test failed:', error);
      
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        logger.warn('🔄 Max connection attempts reached, resetting counter');
        this.connectionAttempts = 0;
      }
      
      return false;
    }
  }

  async chat(message: string): Promise<BackendAIResponse> {
    try {
      logger.debug('💬 Sending chat message to backend:', message);
      const response = await axios.post(`${this.baseUrl}/ai/chat`, { 
        message 
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      logger.debug('💬 Chat response received:', response.data);
      return response.data.data;
    } catch (error: any) {
      logger.error('❌ Backend AI chat failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get AI chat response');
    }
  }

  async analyzeVideoCommand(command: string, videoContext: VideoContext): Promise<BackendAIResponse> {
    try {
      logger.debug('🎬 Analyzing video command:', command);
      logger.debug('📊 Video context:', videoContext);
      
      const response = await axios.post(`${this.baseUrl}/ai/execute-command`, { 
        command, 
        videoContext 
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      logger.debug('🎬 Command analysis response:', response.data);
      return response.data.data;
    } catch (error: any) {
      logger.error('❌ Backend AI command execution failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to execute AI command');
    }
  }

  async getSuggestions(prompt: string, videoContext: VideoContext): Promise<BackendAIResponse> {
    try {
      logger.debug('💡 Getting AI suggestions for:', prompt);
      const response = await axios.post(`${this.baseUrl}/ai/suggestions`, { 
        prompt, 
        videoContext 
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      logger.debug('💡 Suggestions response:', response.data);
      return response.data.data;
    } catch (error: any) {
      logger.error('❌ Backend AI suggestions failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get AI suggestions');
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Force connection check
  async forceConnectionCheck(): Promise<boolean> {
    logger.debug('🔄 Forcing connection check...');
    this.lastConnectionCheck = 0; // Reset to force immediate check
    this.connectionAttempts = 0; // Reset attempts
    return await this.isAvailableAsync();
  }

  // Debug connection method (development only)
  async debugConnection(): Promise<void> {
    if (import.meta.env.DEV) {
      logger.debug('🔍 === AI Connection Debug ===');
      logger.debug('📍 Base URL:', this.baseUrl);
      logger.debug('🎯 Full URL:', `${this.baseUrl}/ai/status`);
      logger.debug('🔗 Current connection status:', this.isConnected);
      logger.debug('⏰ Last check time:', new Date(this.lastConnectionCheck).toISOString());
      logger.debug('📊 Connection attempts:', this.connectionAttempts);
      logger.debug('🌍 Environment:', {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE
      });
      
      try {
        logger.debug('🧪 Running connection test...');
        const result = await this.testConnection();
        logger.debug('✅ Test connection result:', result);
        
        if (result) {
          logger.info('🎉 AI service is working correctly!');
        } else {
          logger.error('❌ AI service connection failed');
        }
      } catch (error) {
        logger.error('❌ Debug connection error:', error);
      }
      logger.debug('🔍 === End Debug ===');
    }
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
      logger.error('Failed to get service info:', error);
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