'use client';

/**
 * IntellifyDemo Component
 * Complete example showing how to integrate Intellify functionality
 */

import React, { useState, useCallback } from 'react';
import { useIntellifyComplete } from '../hooks/useIntellify';
import { AIResponse } from '../lib/intellify-client';
import { appKit } from '../lib/reown-config';

// Component interfaces
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
}

interface AIResponseDisplayProps {
  response: AIResponse | null;
  isProcessing: boolean;
}

interface INFTDisplayProps {
  tokenIds: string[];
  onSelectINFT: (tokenId: string) => void;
  selectedTokenId: string | null;
}

// File Upload Component
const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isUploading, uploadProgress }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
        id="file-upload"
        accept=".txt,.pdf,.doc,.docx,.md"
      />
      <label
        htmlFor="file-upload"
        className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
          isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Choose File'}
      </label>
      
      {isUploading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">{uploadProgress}% uploaded</p>
        </div>
      )}
    </div>
  );
};

// AI Response Display Component
const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({ response, isProcessing }) => {
  if (isProcessing) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
        No AI response yet. Upload a file or ask a question to get started.
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">AI Response</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Confidence: {Math.round(response.confidence * 100)}%</span>
          <span>•</span>
          <span>{response.tokens_used} tokens</span>
        </div>
      </div>
      
      <div className="prose max-w-none">
        <p className="text-gray-700 leading-relaxed">{response.response}</p>
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        Generated at {new Date(response.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

// INFT Display Component
const INFTDisplay: React.FC<INFTDisplayProps> = ({ tokenIds, onSelectINFT, selectedTokenId }) => {
  if (tokenIds.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
        No INFTs found. Create your first knowledge companion by uploading a file.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tokenIds.map((tokenId) => (
        <div
          key={tokenId}
          onClick={() => onSelectINFT(tokenId)}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedTokenId === tokenId
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">INFT #{tokenId}</h4>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            AI Knowledge Companion
          </p>
          <div className="mt-3 text-xs text-gray-400">
            Click to interact
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Demo Component
const IntellifyDemo: React.FC = () => {
  const {
    // Core Intellify state
    client,
    isInitialized,
    isConnecting,
    error,
    wallet,
    isWalletConnected,
    connectWallet,
    disconnect,
    clearError,
    
    // File upload
    fileUpload,
    
    // AI interaction
    aiInteraction,
    
    // INFT management
    inft
  } = useIntellifyComplete();

  // Local state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'chat' | 'infts'>('upload');

  // Handlers
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    try {
      // Upload file and create knowledge companion
      const result = await inft.createKnowledgeCompanion(file);
      
      // Show the summary
      console.log('Knowledge companion created:', result);
      
      // Switch to INFTs tab to show the new INFT
      setActiveTab('infts');
    } catch (error) {
      console.error('Failed to create knowledge companion:', error);
    }
  }, [inft]);

  const handleAskQuestion = useCallback(async () => {
    if (!question.trim()) return;
    
    try {
      if (selectedTokenId) {
        // Ask question about specific INFT
        await aiInteraction.askQuestionByTokenId(selectedTokenId, question);
      } else if (selectedFile) {
        // Ask question about uploaded file
        const fileContent = await selectedFile.text();
        await aiInteraction.askQuestion(fileContent, question);
      }
      
      setQuestion('');
    } catch (error) {
      console.error('Failed to ask question:', error);
    }
  }, [question, selectedTokenId, selectedFile, aiInteraction]);

  const handleGenerateSummary = useCallback(async () => {
    if (!selectedFile) return;
    
    try {
      const fileContent = await selectedFile.text();
      await aiInteraction.generateSummary(fileContent);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  }, [selectedFile, aiInteraction]);

  // Render loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing Intellify...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Intellify</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Wave 2 Demo
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <w3m-button />
                {isWalletConnected ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        {wallet?.address.slice(0, 6)}...{wallet?.address.slice(-4)}
                      </span>
                    </div>
                    <button
                      onClick={disconnect}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect with Intellify'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isWalletConnected ? (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Intellify
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Your decentralized AI knowledge companion. Connect your wallet to get started.
            </p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'upload', name: 'Upload & Create', icon: '📄' },
                  { id: 'chat', name: 'AI Chat', icon: '💬' },
                  { id: 'infts', name: 'My INFTs', icon: '🎨' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'upload' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Upload Knowledge
                    </h3>
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      isUploading={fileUpload.isUploading || inft.isMinting}
                      uploadProgress={fileUpload.uploadProgress}
                    />
                  </div>
                  
                  {selectedFile && (
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Selected File</h4>
                      <p className="text-sm text-gray-600">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                      
                      <button
                        onClick={handleGenerateSummary}
                        disabled={aiInteraction.isProcessing}
                        className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        Generate Summary
                      </button>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    AI Response
                  </h3>
                  <AIResponseDisplay
                    response={aiInteraction.lastResponse}
                    isProcessing={aiInteraction.isProcessing}
                  />
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-medium text-gray-900">
                      AI Chat Interface
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Ask questions about your uploaded files or selected INFTs
                    </p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Question Input */}
                    <div className="flex space-x-4">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a question about your knowledge..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                      />
                      <button
                        onClick={handleAskQuestion}
                        disabled={!question.trim() || aiInteraction.isProcessing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Ask
                      </button>
                    </div>
                    
                    {/* Context Info */}
                    <div className="text-sm text-gray-600">
                      {selectedTokenId ? (
                        <span>Asking about INFT #{selectedTokenId}</span>
                      ) : selectedFile ? (
                        <span>Asking about {selectedFile.name}</span>
                      ) : (
                        <span>Upload a file or select an INFT to ask questions</span>
                      )}
                    </div>
                    
                    {/* AI Response */}
                    <AIResponseDisplay
                      response={aiInteraction.lastResponse}
                      isProcessing={aiInteraction.isProcessing}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'infts' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    My Knowledge Companions
                  </h3>
                  <button
                    onClick={inft.loadUserINFTs}
                    disabled={inft.isLoadingINFTs}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {inft.isLoadingINFTs ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                
                <INFTDisplay
                  tokenIds={inft.userINFTs}
                  onSelectINFT={setSelectedTokenId}
                  selectedTokenId={selectedTokenId}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default IntellifyDemo;