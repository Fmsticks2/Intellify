'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from './WalletProvider';
import { encryptionService, PrivacySettings as IPrivacySettings, defaultPrivacySettings } from '../lib/enhanced-encryption';

interface PrivacySettingsProps {
  onClose: () => void;
  sessionId?: string;
}

export default function PrivacySettings({ onClose, sessionId }: PrivacySettingsProps) {
  const { wallet } = useWallet();
  const [settings, setSettings] = useState<IPrivacySettings>(defaultPrivacySettings);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(sessionId || null);

  useEffect(() => {
    if (sessionId) {
      const sessionInfo = encryptionService.getSessionInfo(sessionId);
      if (sessionInfo?.privacySettings) {
        setSettings(sessionInfo.privacySettings);
      }
    }
  }, [sessionId]);

  const handleSettingChange = (key: keyof IPrivacySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!activeSession) {
      // Create new session if none exists
      if (wallet.address) {
        setLoading(true);
        try {
          const session = await encryptionService.initializeSecureSession(wallet.address, settings);
          setActiveSession(session.sessionId);
          setSaved(true);
        } catch (error) {
          console.error('Failed to create session:', error);
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Update existing session
      const success = encryptionService.updatePrivacySettings(activeSession, settings);
      setSaved(success);
    }

    if (saved) {
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleKeyRotation = async () => {
    if (!activeSession) return;
    
    setLoading(true);
    try {
      await encryptionService.rotateKeys(activeSession);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Key rotation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEncryptionStrengthDescription = (strength: string) => {
    switch (strength) {
      case 'standard': return 'AES-128, good for general use';
      case 'high': return 'AES-256, recommended for sensitive data';
      case 'maximum': return 'AES-256 + additional layers, maximum security';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <motion.div 
        className="glass-strong max-w-2xl w-full mx-4 rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Privacy & Encryption Settings</h2>
              <p className="text-gray-400">Configure your data protection preferences</p>
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

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Encryption Settings */}
          <div className="glass-subtle rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Encryption Settings
            </h3>
            
            <div className="space-y-4">
              {/* End-to-End Encryption */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">End-to-End Encryption</label>
                  <p className="text-gray-400 text-sm">Encrypt all data before uploading to storage</p>
                </div>
                <button
                  onClick={() => handleSettingChange('enableEndToEndEncryption', !settings.enableEndToEndEncryption)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.enableEndToEndEncryption ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    settings.enableEndToEndEncryption ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Zero-Knowledge Proofs */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Zero-Knowledge Proofs</label>
                  <p className="text-gray-400 text-sm">Verify data without revealing content</p>
                </div>
                <button
                  onClick={() => handleSettingChange('enableZeroKnowledgeProofs', !settings.enableZeroKnowledgeProofs)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.enableZeroKnowledgeProofs ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    settings.enableZeroKnowledgeProofs ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Data Obfuscation */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Data Obfuscation</label>
                  <p className="text-gray-400 text-sm">Add noise to protect against analysis</p>
                </div>
                <button
                  onClick={() => handleSettingChange('enableDataObfuscation', !settings.enableDataObfuscation)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.enableDataObfuscation ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    settings.enableDataObfuscation ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Encryption Strength */}
              <div>
                <label className="text-white font-medium block mb-2">Encryption Strength</label>
                <select
                  value={settings.encryptionStrength}
                  onChange={(e) => handleSettingChange('encryptionStrength', (e.target as HTMLSelectElement).value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard" className="bg-gray-800">Standard - {getEncryptionStrengthDescription('standard')}</option>
                  <option value="high" className="bg-gray-800">High - {getEncryptionStrengthDescription('high')}</option>
                  <option value="maximum" className="bg-gray-800">Maximum - {getEncryptionStrengthDescription('maximum')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="glass-subtle rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Privacy Settings
            </h3>
            
            <div className="space-y-4">
              {/* Allow Data Sharing */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Allow Data Sharing</label>
                  <p className="text-gray-400 text-sm">Allow sharing encrypted data with authorized users</p>
                </div>
                <button
                  onClick={() => handleSettingChange('allowDataSharing', !settings.allowDataSharing)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.allowDataSharing ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    settings.allowDataSharing ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Anonymize Metadata */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Anonymize Metadata</label>
                  <p className="text-gray-400 text-sm">Remove or hash identifying information</p>
                </div>
                <button
                  onClick={() => handleSettingChange('anonymizeMetadata', !settings.anonymizeMetadata)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.anonymizeMetadata ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    settings.anonymizeMetadata ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Key Rotation Interval */}
              <div>
                <label className="text-white font-medium block mb-2">Key Rotation Interval (days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.keyRotationInterval}
                  onChange={(e) => handleSettingChange('keyRotationInterval', parseInt((e.target as HTMLInputElement).value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-gray-400 text-sm mt-1">Automatically rotate encryption keys every N days</p>
              </div>
            </div>
          </div>

          {/* Key Management */}
          <div className="glass-subtle rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Key Management
            </h3>
            
            <div className="space-y-4">
              {activeSession && (
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div>
                    <p className="text-green-400 font-medium">Active Secure Session</p>
                    <p className="text-gray-400 text-sm">Session ID: {activeSession.substring(0, 16)}...</p>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
              )}
              
              <button
                onClick={handleKeyRotation}
                disabled={!activeSession || loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Rotate Encryption Keys
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Save Settings
          </button>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-400 font-medium">Privacy settings saved successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}