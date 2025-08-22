'use client';

import React, { useState } from 'react';
import { useWallet } from './WalletProvider';
import { useIntellifyContract } from '../hooks/useIntellifyContract';

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

export function MintINFTModal({ onClose, onSuccess }: MintINFTModalProps) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.modelVersion.trim()) {
      setError('Model version is required');
      return false;
    }
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

  const checkKnowledgeHash = async () => {
    if (!formData.knowledgeHash.trim()) {
      setError('Please enter a knowledge hash');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isUsed = await isKnowledgeHashUsed(formData.knowledgeHash);
      if (isUsed) {
        setError('This knowledge hash has already been used. Please use a different one.');
      } else {
        setStep(2);
      }
    } catch (err: any) {
      console.error('Error checking knowledge hash:', err);
      setError('Failed to verify knowledge hash. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!validateForm() || !wallet.address) return;

    setLoading(true);
    setError(null);

    try {
      // Create metadata object
      const metadata = {
        name: `Intellify INFT #${Date.now()}`,
        description: formData.description,
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
        ],
      };

      // In a real implementation, you would upload this metadata to IPFS or another storage service
      // For now, we'll use the provided metadataURI
      const tx = await mintINFT(
        wallet.address,
        formData.metadataURI,
        formData.knowledgeHash,
        formData.modelVersion
      );

      setTxHash(tx.hash);
      setStep(3);

      // Wait for transaction confirmation
      await tx.wait();
      
      // Success!
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Create New INFT
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${
              step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${
              step >= 3 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Knowledge Hash */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Step 1: Knowledge Hash
              </h3>
              <p className="text-gray-600 mb-4">
                Enter the 0G Storage hash of your knowledge file. This should be a unique hash from your uploaded document.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Knowledge Hash *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="knowledgeHash"
                  value={formData.knowledgeHash}
                  onChange={handleInputChange}
                  placeholder="0x1234567890abcdef..."
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={generateSampleHash}
                  className="btn-secondary whitespace-nowrap"
                >
                  Generate Sample
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This should be a 64-character hexadecimal hash from 0G Network storage.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={checkKnowledgeHash}
                disabled={loading || !formData.knowledgeHash.trim()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loading-spinner"></div>
                    <span>Checking...</span>
                  </div>
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: INFT Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Step 2: INFT Details
              </h3>
              <p className="text-gray-600 mb-4">
                Configure your AI Knowledge NFT with model version and metadata.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model Version *
              </label>
              <select
                name="modelVersion"
                value={formData.modelVersion}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3</option>
                <option value="llama-2">Llama 2</option>
                <option value="custom">Custom Model</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metadata URI *
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  name="metadataURI"
                  value={formData.metadataURI}
                  onChange={handleInputChange}
                  placeholder="https://ipfs.io/ipfs/Qm..."
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={generateSampleMetadataURI}
                  className="btn-secondary whitespace-nowrap"
                >
                  Generate Sample
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                IPFS URI pointing to the NFT metadata JSON file.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your AI knowledge companion..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleMint}
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loading-spinner"></div>
                    <span>Minting...</span>
                  </div>
                ) : (
                  'Mint INFT'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                INFT Created Successfully!
              </h3>
              <p className="text-gray-600">
                Your AI Knowledge NFT has been minted and is now available in your collection.
              </p>
            </div>

            {txHash && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Transaction Hash:</span>
                  <br />
                  <span className="font-mono text-xs break-all">{txHash}</span>
                </p>
              </div>
            )}

            <button
              onClick={onSuccess}
              className="btn-primary w-full"
            >
              View My INFTs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}