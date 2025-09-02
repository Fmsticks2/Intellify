'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from './WalletProvider';
import { useIntellifyContract } from '../hooks/useIntellifyContract';
import EnhancedEncryptionModal from './EnhancedEncryptionModal';
import { encryptionService, EncryptedDataPackage } from '../lib/enhanced-encryption';

interface MintINFTModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  modelVersion: string;
  knowledgeHash: string;
  metadataURI: string;
  description: string;
}

export default function MintINFTModal({ onClose, onSuccess }: MintINFTModalProps) {
  const { wallet } = useWallet();
  const { mintINFT, isKnowledgeHashUsed } = useIntellifyContract();
  const [formData, setFormData] = useState<FormData>({
    modelVersion: 'gpt-4',
    knowledgeHash: '',
    metadataURI: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [encryptedData, setEncryptedData] = useState<EncryptedDataPackage | null>(null);
  const [encryptionSessionId, setEncryptionSessionId] = useState<string | null>(null);
  const [enableEncryption, setEnableEncryption] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const name = (target as any).name || '';
    const value = (target as any).value || '';
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.knowledgeHash.trim()) {
      setError('Knowledge hash is required');
      return false;
    }
    if (!formData.metadataURI.trim()) {
      setError('Metadata URI is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.knowledgeHash.trim()) {
        setError('Please enter a knowledge hash');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const isUsed = await isKnowledgeHashUsed(formData.knowledgeHash);
        if (isUsed) {
          setError('This knowledge hash is already in use. Please use a different hash.');
          return;
        }
        setStep(2);
      } catch (err: any) {
        console.error('Error checking knowledge hash:', err);
        setError('Failed to verify knowledge hash. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMint = async () => {
    if (!validateForm() || !wallet.address) return;

    // If encryption is enabled and we don't have encrypted data yet, show encryption modal
    if (enableEncryption && !encryptedData) {
      setShowEncryptionModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use encrypted data if available
      const finalDescription = encryptedData ? encryptedData.encryptedData : formData.description;
      
      const metadata = {
        name: `Intellify INFT #${Date.now()}`,
        description: finalDescription,
        image: 'https://via.placeholder.com/400x400?text=Intellify+INFT',
        attributes: [
          {
            trait_type: 'Model Version',
            value: formData.modelVersion,
          },
          {
            trait_type: 'Knowledge Files',
            value: 1,
          },
          {
            trait_type: 'Created',
            value: new Date().toISOString(),
          },
          {
            trait_type: 'Encrypted',
            value: enableEncryption ? 'Yes' : 'No',
          },
        ],
      };

      const tx = await mintINFT(
        wallet.address,
        formData.metadataURI,
        formData.knowledgeHash,
        formData.modelVersion
      );

      setTxHash(tx.hash);
      setStep(3);

      await tx.wait();
      
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      console.error('Error minting INFT:', err);
      setError(err.message || 'Failed to mint INFT. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEncryptionComplete = (encrypted: EncryptedDataPackage, sessionId: string) => {
    setEncryptedData(encrypted);
    setEncryptionSessionId(sessionId);
    setShowEncryptionModal(false);
    // Automatically proceed with minting
    setTimeout(() => {
      handleMint();
    }, 100);
  };

  const generateSampleHash = () => {
    const randomHash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setFormData(prev => ({ ...prev, knowledgeHash: randomHash }));
  };

  const generateSampleMetadataURI = () => {
    const sampleURI = `https://ipfs.io/ipfs/Qm${Array.from({ length: 44 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
    ).join('')}`;
    setFormData(prev => ({ ...prev, metadataURI: sampleURI }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Mint Intellify INFT</h2>
          <p className="text-sm sm:text-base text-black">Create your AI-powered Intelligent NFT</p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Step 1: Knowledge Configuration</h3>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  AI Model Version
                </label>
                <select
                  name="modelVersion"
                  value={formData.modelVersion}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3">Claude 3</option>
                  <option value="llama-2">LLaMA 2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Knowledge Hash
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    name="knowledgeHash"
                    value={formData.knowledgeHash}
                    onChange={handleInputChange}
                    placeholder="Enter unique knowledge hash (0x...)"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={generateSampleHash}
                    className="px-3 sm:px-4 py-2 sm:py-3 bg-green-50 border border-green-300 rounded-lg text-sm sm:text-base text-green-700 hover:bg-green-100 transition-colors whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4">Step 2: INFT Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Metadata URI
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    name="metadataURI"
                    value={formData.metadataURI}
                    onChange={handleInputChange}
                    placeholder="Enter IPFS URI or metadata URL"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={generateSampleMetadataURI}
                    className="px-3 sm:px-4 py-2 sm:py-3 bg-green-50 border border-green-300 rounded-lg text-sm sm:text-base text-green-700 hover:bg-green-100 transition-colors whitespace-nowrap"
                  >
                    Generate Sample
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your AI model and its capabilities..."
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Encryption Settings */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-black">Enhanced Encryption</label>
                  <button
                    type="button"
                    onClick={() => setEnableEncryption(!enableEncryption)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      enableEncryption ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                      enableEncryption ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <p className="text-black text-xs">
                  {enableEncryption 
                    ? 'Your data will be encrypted using advanced encryption algorithms before storage'
                    : 'Data will be stored without additional encryption'
                  }
                </p>
                {encryptedData && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-600 text-sm font-medium">Data encrypted successfully</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center border border-green-300">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">INFT Minted Successfully!</h3>
              <p className="text-sm sm:text-base text-black">Your Intellify INFT has been created and is now available on the blockchain.</p>
              
              {txHash && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-black mb-2">Transaction Hash:</p>
                  <p className="text-blue-600 font-mono text-xs sm:text-sm break-all">{txHash}</p>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="w-full py-2 sm:py-3 bg-green-50 border border-green-300 rounded-lg text-sm sm:text-base text-green-700 hover:bg-green-100 transition-colors font-medium"
              >
                View My INFTs
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 sm:mt-8">
          {step < 3 && (
            <div className="flex flex-col sm:flex-row gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-2 sm:py-3 bg-gray-100 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                >
                  Back
                </button>
              )}
              <button
                onClick={step === 1 ? handleNext : handleMint}
                disabled={loading}
                className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg text-sm sm:text-base font-medium transition-all duration-200 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base">{step === 1 ? 'Verifying...' : 'Minting...'}</span>
                  </div>
                ) : (
                  step === 1 ? 'Next' : 'Mint INFT'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Encryption Modal */}
       {showEncryptionModal && (
         <EnhancedEncryptionModal
           isOpen={showEncryptionModal}
           onClose={() => setShowEncryptionModal(false)}
           onEncryptionComplete={handleEncryptionComplete}
           data={{
             content: formData.description,
             type: 'knowledge'
           }}
         />
       )}
    </div>
  );
}