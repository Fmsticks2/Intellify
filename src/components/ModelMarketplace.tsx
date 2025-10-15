'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAIMarketplace, AIModel, ModelFilters } from '../hooks/useAIMarketplace';
import { useWallet } from './WalletProvider';
import ModelCard from './ModelCard';
import ModelDeployment from './ModelDeployment';
import ModelRegistration from './ModelRegistration';
import { LoadingSpinner } from './LoadingSpinner';

const MODEL_CATEGORIES = [
  'all',
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

export default function ModelMarketplace() {
  const { wallet } = useWallet();
  const { 
    models, 
    loading, 
    error, 
    filterModels, 
    loadModels, 
    purchaseModelAccess, 
    rateModel 
  } = useAIMarketplace();
  
  const [filters, setFilters] = useState<ModelFilters>({
    category: 'all',
    minRating: 0,
    maxPrice: '',
    searchTerm: '',
    sortBy: 'popularity'
  });
  
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [showDeployment, setShowDeployment] = useState(false);
  const [filteredModels, setFilteredModels] = useState<AIModel[]>([]);

  // Update filtered models when models or filters change
  useEffect(() => {
    setFilteredModels(filterModels(filters));
  }, [models, filters, filterModels]);

  const handleFilterChange = (key: keyof ModelFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleModelSelect = (model: AIModel) => {
    setSelectedModel(model);
    setShowDeployment(true);
  };

  const handleRegistrationSuccess = () => {
    setShowRegistration(false);
    loadModels(); // Refresh the models list
  };

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:wallet-outline" className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Connect your wallet to access the AI Model Marketplace and start discovering, deploying, and monetizing AI models.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Model Marketplace</h1>
              <p className="text-gray-600 mt-2">
                Discover, deploy, and monetize AI models on the 0G Network
              </p>
            </div>
            <button
              onClick={() => setShowRegistration(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Icon icon="mdi:plus" className="w-5 h-5" />
              <span>Register Model</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  placeholder="Search models..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {MODEL_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as ModelFilters['sortBy'])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="popularity">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price">Lowest Price</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Min Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Any Rating</option>
                <option value={1}>1+ Stars</option>
                <option value={2}>2+ Stars</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <Icon icon="mdi:alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Models</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadModels}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="mdi:robot-outline" className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Models Found</h3>
            <p className="text-gray-600 mb-6">
              {models.length === 0 
                ? "No AI models have been registered yet. Be the first to register a model!"
                : "No models match your current filters. Try adjusting your search criteria."
              }
            </p>
            {models.length === 0 && (
              <button
                onClick={() => setShowRegistration(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Register First Model
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                onPurchase={(modelId, inferences) => purchaseModelAccess(modelId, model.pricePerInference)}
                onRate={(modelId, rating) => rateModel(modelId, rating)}
                onDeploy={() => handleModelSelect(model)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Model Registration Modal */}
      {showRegistration && (
        <ModelRegistration
          onClose={() => setShowRegistration(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* Model Deployment Modal */}
      {showDeployment && selectedModel && (
        <ModelDeployment
          model={selectedModel}
          onClose={() => {
            setShowDeployment(false);
            setSelectedModel(null);
          }}
        />
      )}
    </div>
  );
};