'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAIMarketplace } from '../hooks/useAIMarketplace';
import { useWallet } from './WalletProvider';
import { LoadingSpinner } from './LoadingSpinner';

interface ModelRegistrationProps {
  onClose: () => void;
  onSuccess: () => void;
}

const MODEL_CATEGORIES = [
  'Natural Language Processing',
  'Computer Vision',
  'Audio Processing',
  'Predictive Analytics',
  'Recommendation Systems',
  'Generative AI',
  'Classification',
  'Regression',
  'Clustering',
  'Other'
];

export default function ModelRegistration({ onClose, onSuccess }: ModelRegistrationProps) {
  const { wallet } = useWallet();
  const { registerModel, loading } = useAIMarketplace();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    pricePerInference: '',
    modelFile: null as File | null,
    metadataFile: null as File | null
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Model name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.pricePerInference || parseFloat(formData.pricePerInference) < 0) {
      newErrors.pricePerInference = 'Valid price is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.modelFile) {
      newErrors.modelFile = 'Model file is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (field: 'modelFile' | 'metadataFile', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    // Simulate IPFS upload - replace with actual IPFS integration
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setUploading(false);
    return `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    
    try {
      setUploading(true);
      
      // Upload model file to IPFS/0G Storage
      const modelHash = await uploadToIPFS(formData.modelFile!);
      
      // Upload metadata if provided
      let metadataURI = '';
      if (formData.metadataFile) {
        metadataURI = await uploadToIPFS(formData.metadataFile);
      } else {
        // Create basic metadata
        const metadata = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          creator: wallet.address,
          createdAt: new Date().toISOString()
        };
        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        const metadataFile = new File([metadataBlob], 'metadata.json');
        metadataURI = await uploadToIPFS(metadataFile);
      }
      
      // Register model on blockchain
      await registerModel(
        formData.name,
        formData.description,
        formData.category,
        formData.pricePerInference,
        modelHash,
        metadataURI
      );
      
      onSuccess();
    } catch (error) {
      console.error('Failed to register model:', error);
      setErrors({ submit: 'Failed to register model. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Icon icon="mdi:wallet-outline" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wallet Required</h3>
            <p className="text-gray-600 mb-6">Please connect your wallet to register AI models.</p>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Register AI Model</h2>
            <p className="text-gray-600 mt-1">Step {step} of 2</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon icon="mdi:close" className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Model Details</span>
            <span>Upload & Deploy</span>
          </div>
        </div>

        {/* Step 1: Model Details */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter model name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your AI model's capabilities and use cases"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {MODEL_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Inference (0G) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.pricePerInference}
                onChange={(e) => handleInputChange('pricePerInference', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.pricePerInference ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.001"
              />
              {errors.pricePerInference && <p className="text-red-500 text-sm mt-1">{errors.pricePerInference}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Upload & Deploy */}
        {step === 2 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model File *
              </label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                errors.modelFile ? 'border-red-500' : 'border-gray-300'
              }`}>
                {formData.modelFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Icon icon="mdi:file-check" className="w-8 h-8 text-green-600" />
                    <span className="text-gray-900">{formData.modelFile.name}</span>
                    <button
                      onClick={() => handleFileChange('modelFile', null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Icon icon="mdi:close" className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Icon icon="mdi:cloud-upload" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Upload your AI model file</p>
                    <input
                      type="file"
                      accept=".pkl,.h5,.onnx,.pt,.pth,.pb,.tflite"
                      onChange={(e) => handleFileChange('modelFile', e.target.files?.[0] || null)}
                      className="hidden"
                      id="model-file"
                    />
                    <label
                      htmlFor="model-file"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>
              {errors.modelFile && <p className="text-red-500 text-sm mt-1">{errors.modelFile}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metadata File (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {formData.metadataFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Icon icon="mdi:file-check" className="w-8 h-8 text-green-600" />
                    <span className="text-gray-900">{formData.metadataFile.name}</span>
                    <button
                      onClick={() => handleFileChange('metadataFile', null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Icon icon="mdi:close" className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Icon icon="mdi:file-document" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Upload additional metadata (JSON)</p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => handleFileChange('metadataFile', e.target.files?.[0] || null)}
                      className="hidden"
                      id="metadata-file"
                    />
                    <label
                      htmlFor="metadata-file"
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={step === 1 ? onClose : prevStep}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <div className="flex space-x-3">
            {step === 1 ? (
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || uploading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                {(loading || uploading) && <LoadingSpinner size="sm" />}
                <span>{uploading ? 'Uploading...' : loading ? 'Registering...' : 'Register Model'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}