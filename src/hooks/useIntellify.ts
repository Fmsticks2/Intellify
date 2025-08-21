/**
 * React Hook for Intellify Wave 2 Integration
 * Provides easy-to-use React hooks for Intellify functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  IntellifyClient, 
  createIntellifyClient, 
  defaultConfig,
  WalletConnection,
  AIResponse,
  INFTMetadata,
  IntellifyConfig
} from '../lib/intellify-client';

// Hook return types
export interface UseIntellifyReturn {
  // Client state
  client: IntellifyClient | null;
  isInitialized: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Wallet state
  wallet: WalletConnection | null;
  isWalletConnected: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

export interface UseFileUploadReturn {
  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  
  // Upload result
  storageHash: string | null;
  
  // Actions
  uploadFile: (file: File) => Promise<string>;
  clearUpload: () => void;
}

export interface UseAIInteractionReturn {
  // AI state
  isProcessing: boolean;
  aiError: string | null;
  
  // AI responses
  lastResponse: AIResponse | null;
  responseHistory: AIResponse[];
  
  // Actions
  generateSummary: (content: string) => Promise<AIResponse>;
  askQuestion: (content: string, question: string) => Promise<AIResponse>;
  askQuestionByTokenId: (tokenId: string, question: string) => Promise<AIResponse>;
  clearHistory: () => void;
}

export interface UseINFTReturn {
  // INFT state
  isMinting: boolean;
  mintError: string | null;
  userINFTs: string[];
  isLoadingINFTs: boolean;
  
  // Actions
  mintINFT: (metadata: INFTMetadata) => Promise<string>;
  createKnowledgeCompanion: (file: File) => Promise<{ storageHash: string; tokenId: string; summary: AIResponse }>;
  loadUserINFTs: () => Promise<void>;
  getAIState: (tokenId: string) => Promise<any>;
}

/**
 * Main Intellify Hook
 * Manages client initialization and wallet connection
 */
export const useIntellify = (config?: Partial<IntellifyConfig>): UseIntellifyReturn => {
  const [client, setClient] = useState<IntellifyClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  
  const clientRef = useRef<IntellifyClient | null>(null);
  
  const initialize = useCallback(async () => {
    try {
      setError(null);
      const clientConfig = { ...defaultConfig, ...config };
      const newClient = createIntellifyClient(clientConfig);
      
      await newClient.initialize();
      
      setClient(newClient);
      clientRef.current = newClient;
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize client');
    }
  }, [config]);
  
  const connectWallet = useCallback(async () => {
    if (!client) {
      setError('Client not initialized');
      return;
    }
    
    try {
      setIsConnecting(true);
      setError(null);
      
      const walletConnection = await client.connectWallet();
      await client.authenticateUser();
      
      setWallet(walletConnection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [client]);
  
  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect();
    }
    setWallet(null);
    setError(null);
  }, [client]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Auto-initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Check wallet connection on client change
  useEffect(() => {
    if (client && client.isWalletConnected()) {
      // Wallet is already connected, update state
      const address = client.getWalletAddress();
      if (address && !wallet) {
        // Try to restore wallet state
        connectWallet();
      }
    }
  }, [client, wallet, connectWallet]);
  
  return {
    client,
    isInitialized,
    isConnecting,
    error,
    wallet,
    isWalletConnected: !!wallet,
    initialize,
    connectWallet,
    disconnect,
    clearError
  };
};

/**
 * File Upload Hook
 * Handles encrypted file uploads to 0G Storage
 */
export const useFileUpload = (client: IntellifyClient | null): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storageHash, setStorageHash] = useState<string | null>(null);
  
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!client) {
      throw new Error('Client not initialized');
    }
    
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      // Encrypt file
      setUploadProgress(30);
      const encryptedData = await client.encryptFile(file);
      
      // Upload to storage
      setUploadProgress(60);
      const uploadResult = await client.uploadFile(encryptedData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setStorageHash(uploadResult.hash);
      
      return uploadResult.hash;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [client]);
  
  const clearUpload = useCallback(() => {
    setUploadProgress(0);
    setUploadError(null);
    setStorageHash(null);
  }, []);
  
  return {
    isUploading,
    uploadProgress,
    uploadError,
    storageHash,
    uploadFile,
    clearUpload
  };
};

/**
 * AI Interaction Hook
 * Handles AI summaries and Q&A
 */
export const useAIInteraction = (client: IntellifyClient | null): UseAIInteractionReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [responseHistory, setResponseHistory] = useState<AIResponse[]>([]);
  
  const generateSummary = useCallback(async (content: string): Promise<AIResponse> => {
    if (!client) {
      throw new Error('Client not initialized');
    }
    
    try {
      setIsProcessing(true);
      setAiError(null);
      
      const response = await client.executeAITask({
        type: 'summary',
        content
      });
      
      setLastResponse(response);
      setResponseHistory(prev => [...prev, response]);
      
      return response;
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI processing failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [client]);
  
  const askQuestion = useCallback(async (content: string, question: string): Promise<AIResponse> => {
    if (!client) {
      throw new Error('Client not initialized');
    }
    
    try {
      setIsProcessing(true);
      setAiError(null);
      
      const response = await client.executeAITask({
        type: 'qa',
        content,
        question
      });
      
      setLastResponse(response);
      setResponseHistory(prev => [...prev, response]);
      
      return response;
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI processing failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [client]);
  
  const askQuestionByTokenId = useCallback(async (tokenId: string, question: string): Promise<AIResponse> => {
    if (!client) {
      throw new Error('Client not initialized');
    }
    
    try {
      setIsProcessing(true);
      setAiError(null);
      
      const response = await client.askQuestion(tokenId, question);
      
      setLastResponse(response);
      setResponseHistory(prev => [...prev, response]);
      
      return response;
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI processing failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [client]);
  
  const clearHistory = useCallback(() => {
    setResponseHistory([]);
    setLastResponse(null);
    setAiError(null);
  }, []);
  
  return {
    isProcessing,
    aiError,
    lastResponse,
    responseHistory,
    generateSummary,
    askQuestion,
    askQuestionByTokenId,
    clearHistory
  };
};

/**
 * INFT Management Hook
 * Handles INFT minting and management
 */
export const useINFT = (client: IntellifyClient | null): UseINFTReturn => {
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [userINFTs, setUserINFTs] = useState<string[]>([]);
  const [isLoadingINFTs, setIsLoadingINFTs] = useState(false);
  
  const mintINFT = useCallback(async (metadata: INFTMetadata): Promise<string> => {
    if (!client) {
      throw new Error('Client not initialized');
    }
    
    try {
      setIsMinting(true);
      setMintError(null);
      
      const tokenId = await client.mintINFT(metadata);
      
      // Refresh user INFTs
      await loadUserINFTs();
      
      return tokenId;
    } catch (err) {
      setMintError(err instanceof Error ? err.message : 'Minting failed');
      throw err;
    } finally {
      setIsMinting(false);
    }
  }, [client]);
  
  const createKnowledgeCompanion = useCallback(async (file: File) => {
    if (!client) {
      throw new Error('Client not initialized');
    }
    
    try {
      setIsMinting(true);
      setMintError(null);
      
      const result = await client.createKnowledgeCompanion(file);
      
      // Refresh user INFTs
      await loadUserINFTs();
      
      return result;
    } catch (err) {
      setMintError(err instanceof Error ? err.message : 'Knowledge companion creation failed');
      throw err;
    } finally {
      setIsMinting(false);
    }
  }, [client]);
  
  const loadUserINFTs = useCallback(async (): Promise<void> => {
    if (!client) {
      return;
    }
    
    try {
      setIsLoadingINFTs(true);
      const tokenIds = await client.getUserINFTs();
      setUserINFTs(tokenIds);
    } catch (err) {
      console.error('Failed to load user INFTs:', err);
    } finally {
      setIsLoadingINFTs(false);
    }
  }, [client]);
  
  const getAIState = useCallback(async (tokenId: string) => {
    if (!client) {
      throw new Error('Client not initialized');
    }
    
    return await client.getAIState(tokenId);
  }, [client]);
  
  // Auto-load user INFTs when client is available
  useEffect(() => {
    if (client && client.isWalletConnected()) {
      loadUserINFTs();
    }
  }, [client, loadUserINFTs]);
  
  return {
    isMinting,
    mintError,
    userINFTs,
    isLoadingINFTs,
    mintINFT,
    createKnowledgeCompanion,
    loadUserINFTs,
    getAIState
  };
};

/**
 * Combined Hook for Complete Workflow
 * Provides all Intellify functionality in one hook
 */
export const useIntellifyComplete = (config?: Partial<IntellifyConfig>) => {
  const intellify = useIntellify(config);
  const fileUpload = useFileUpload(intellify.client);
  const aiInteraction = useAIInteraction(intellify.client);
  const inft = useINFT(intellify.client);
  
  return {
    ...intellify,
    fileUpload,
    aiInteraction,
    inft
  };
};

// Utility hooks

/**
 * Hook for handling async operations with loading states
 */
export const useAsyncOperation = <T extends any[], R>(
  operation: (...args: T) => Promise<R>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<R | null>(null);
  
  const execute = useCallback(async (...args: T): Promise<R> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await operation(...args);
      setResult(result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [operation]);
  
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);
  
  return {
    execute,
    isLoading,
    error,
    result,
    reset
  };
};

/**
 * Hook for local storage persistence
 */
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  
  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  }, [key, value]);
  
  return [value, setStoredValue] as const;
};