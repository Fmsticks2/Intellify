'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from './WalletProvider';
import { useIntellifyContract } from '../hooks/useIntellifyContract';
import { encryptionService, EncryptedDataPackage, PrivacySettings as PrivacySettingsType } from '../lib/enhanced-encryption';
import PrivacySettings from './PrivacySettings';

interface EnhancedEncryptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEncryptionComplete: (encryptedData: EncryptedDataPackage, sessionId: string) => void;
  data: {
    content: string;
    metadata?: any;
    type: 'knowledge' | 'model_state' | 'general';
  };
}

export default function EnhancedEncryptionModal({ 
  isOpen, 
  onClose, 
  onEncryptionComplete, 
  data 
}: EnhancedEncryptionModalProps) {
  const { wallet } = useWallet();
  const contract = useIntellifyContract();
  const [step, setStep] = useState<'configure' | 'encrypt' | 'complete'>('configure');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [encryptedData, setEncryptedData] = useState<EncryptedDataPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsType>({
    enableEndToEndEncryption: true,
    enableZeroKnowledgeProofs: true,
    enableDataObfuscation: false,
    encryptionStrength: 'high',
    allowDataSharing: false,
    anonymizeMetadata: true,
    keyRotationInterval: 30
  });

  useEffect(() => {
    if (isOpen && !sessionId && wallet.address) {
      initializeSession();
    }
  }, [isOpen, wallet.address]);

  const initializeSession = async () => {
    if (!wallet.address) return;
    
    try {
      const session = await encryptionService.initializeSecureSession(wallet.address, privacySettings);
      setSessionId(session.sessionId);
    } catch (err) {
      setError('Failed to initialize secure session');
      console.error('Session initialization error:', err);
    }
  };

  const handleEncrypt = async () => {
    // Clear any previous errors
    setError(null);
    
    // Validate input data
    if (!data.content.trim()) {
      setError('Please enter some data to encrypt.');
      return;
    }
    
    if (data.content.length < 4) {
      setError('Data must be at least 4 characters long for security purposes.');
      return;
    }
    
    if (data.content.length > 10000) {
      setError('Data is too large. Please limit to 10,000 characters or less.');
      return;
    }

    if (!sessionId) {
      setError('Session not initialized. Please try again.');
      return;
    }

    setLoading(true);
    setStep('encrypt');
    setEncryptionProgress(0);

    try {
      // Simulate encryption progress
      const progressInterval = setInterval(() => {
        setEncryptionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Encrypt the data
      const encrypted = await encryptionService.encryptData(data.content, sessionId);
      
      // Generate zero-knowledge proof if enabled
      if (privacySettings.enableZeroKnowledgeProofs) {
        await encryptionService.generateZKProof(data.content, sessionId);
      }

      // Obfuscate metadata if enabled
      if (privacySettings.enableDataObfuscation && data.metadata) {
        await encryptionService.obfuscateMetadata(data.metadata, sessionId);
      }

      clearInterval(progressInterval);
      setEncryptionProgress(100);
      setEncryptedData(encrypted);
      setStep('complete');
      
      // Auto-complete after showing success
      setTimeout(() => {
        onEncryptionComplete(encrypted, sessionId);
      }, 2000);

    } catch (err) {
      console.error('Encryption error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Encryption failed. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('session')) {
          errorMessage = 'Session initialization failed. Please refresh and try again.';
        } else if (err.message.includes('key')) {
          errorMessage = 'Encryption key generation failed. Please check your connection and try again.';
        } else if (err.message.includes('data')) {
          errorMessage = 'Invalid data format. Please check your input and try again.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error occurred. Please check your connection and try again.';
        } else {
          errorMessage = `Encryption failed: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  const getEncryptionTypeIcon = () => {
    switch (data.type) {
      case 'knowledge':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'model_state':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <motion.div 
          className="glass-strong max-w-2xl w-full mx-4 rounded-3xl p-8"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                {getEncryptionTypeIcon()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Enhanced Encryption</h2>
                <p className="text-gray-400">Secure your {data.type.replace('_', ' ')} data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              {['configure', 'encrypt', 'complete'].map((stepName, index) => {
                const isActive = step === stepName;
                const isCompleted = ['configure', 'encrypt', 'complete'].indexOf(step) > index;
                
                return (
                  <React.Fragment key={stepName}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-200 shadow-lg ${
                      isActive ? 'bg-blue-600 text-white ring-4 ring-blue-200' : 
                      isCompleted ? 'bg-green-600 text-white ring-4 ring-green-200' : 
                      'bg-gray-100 text-gray-500 border-2 border-gray-300'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < 2 && (
                      <div className={`w-16 h-1 rounded transition-all duration-200 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {step === 'configure' && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Data Preview */}
                <div className="glass-subtle rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Data to Encrypt</h3>
                  <div className="bg-black/20 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enter your knowledge data to encrypt
                    </label>
                    <p className="text-gray-300 text-sm font-mono bg-gray-800/50 p-3 rounded-lg border border-gray-600">
                      {data.content.length > 200 ? 
                        `${data.content.substring(0, 200)}...` : 
                        data.content || "Enter your knowledge data here... (e.g., research notes, personal insights, confidential information)"
                      }
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <span className="text-gray-400 text-sm">Size: {data.content.length} characters (minimum 4 required)</span>
                      <span className="text-gray-400 text-sm">Type: {data.type}</span>
                    </div>
                  </div>
                </div>

                {/* Encryption Settings Summary */}
                <div className="glass-subtle rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Security Features</h3>
                    <button
                      onClick={() => setShowPrivacySettings(true)}
                      className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                    >
                      Customize
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${
                      privacySettings.enableEndToEndEncryption 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-gray-500/10 border-gray-500/20'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          privacySettings.enableEndToEndEncryption ? 'bg-green-400' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm font-medium text-white">End-to-End Encryption</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        privacySettings.enableEndToEndEncryption 
                          ? 'text-green-300 bg-green-500/20' 
                          : 'text-gray-400 bg-gray-500/20'
                      }`}>
                        {privacySettings.enableEndToEndEncryption ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${
                      privacySettings.enableZeroKnowledgeProofs 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-gray-500/10 border-gray-500/20'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          privacySettings.enableZeroKnowledgeProofs ? 'bg-green-400' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm font-medium text-white">Zero-Knowledge Proofs</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        privacySettings.enableZeroKnowledgeProofs 
                          ? 'text-green-300 bg-green-500/20' 
                          : 'text-gray-400 bg-gray-500/20'
                      }`}>
                        {privacySettings.enableZeroKnowledgeProofs ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${
                      privacySettings.enableDataObfuscation 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-gray-500/10 border-gray-500/20'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          privacySettings.enableDataObfuscation ? 'bg-green-400' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm font-medium text-white">Data Obfuscation</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        privacySettings.enableDataObfuscation 
                          ? 'text-green-300 bg-green-500/20' 
                          : 'text-gray-400 bg-gray-500/20'
                      }`}>
                        {privacySettings.enableDataObfuscation ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-blue-400" />
                        <span className="text-sm font-medium text-white">Security Strength</span>
                      </div>
                      <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full font-semibold capitalize">
                        {privacySettings.encryptionStrength}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Info */}
                {sessionId && (
                  <div className="glass-subtle rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Secure Session</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-gray-300 text-sm font-mono">{sessionId.substring(0, 32)}...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-red-800 font-semibold text-sm">Encryption Error</h4>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'encrypt' && (
              <motion.div
                key="encrypt"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Encrypting Your Data</h3>
                  <p className="text-gray-400 text-lg mb-2">Securing your information with advanced encryption...</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Processing...</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-gray-300 mb-3">
                    <span className="font-medium">Encryption Progress</span>
                    <span className="font-semibold">{Math.round(encryptionProgress)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 shadow-inner">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 h-3 rounded-full shadow-lg"
                      initial={{ width: 0 }}
                      animate={{ width: `${encryptionProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-xs text-gray-400">
                      {encryptionProgress < 25 ? 'Initializing encryption...' :
                       encryptionProgress < 50 ? 'Generating security keys...' :
                       encryptionProgress < 75 ? 'Encrypting data...' :
                       encryptionProgress < 100 ? 'Finalizing encryption...' :
                       'Encryption complete!'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'complete' && encryptedData && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Encryption Complete!</h3>
                  <p className="text-gray-400">Your data has been successfully encrypted</p>
                </div>

                <div className="glass-subtle rounded-2xl p-6 text-left">
                  <h4 className="text-white font-medium mb-3">Encryption Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Algorithm:</span>
                      <span className="text-white">AES-256-GCM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Key Length:</span>
                      <span className="text-white">256 bits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">IV Length:</span>
                      <span className="text-white">96 bits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Encrypted Size:</span>
                      <span className="text-white">{encryptedData.encryptedData.length} chars</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Cancel
            </button>
            
            {step === 'configure' && (
              <button
                onClick={handleEncrypt}
                disabled={!sessionId || loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-lg">Start Encryption</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Privacy Settings Modal */}
      {showPrivacySettings && (
        <PrivacySettings
          onClose={() => setShowPrivacySettings(false)}
          sessionId={sessionId || undefined}
        />
      )}
    </>
  );
}