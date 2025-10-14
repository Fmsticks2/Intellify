'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { useIntellifyContract } from '../hooks/useIntellifyContract';
import ModelCard from './ModelCard';
import ModelDeployment from './ModelDeployment';
import LoadingSpinner from './LoadingSpinner';

interface AIModel {
  modelId: number;
  creator: string;
  name: string;
  description: string;
  category: string;
  modelHash: string;
  metadataHash: string;
  pricePerInference: string;
  totalInferences: number;
  totalRevenue: string;
  rating: number;
  ratingCount: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ModelAccess {
  hasAccess: boolean;
  purchasedAt: number;
  inferencesUsed: number;
  inferencesAllowed: number;
}

const ModelMarketplace: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { contract } = useIntellifyContract();
  
  const [models, setModels] = useState<AIModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<AIModel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'popularity'>('rating');
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [showDeployment, setShowDeployment] = useState(false);
  const [userAccess, setUserAccess] = useState<Record<number, ModelAccess>>({});

  useEffect(() => {
    if (contract && isConnected) {
      loadMarketplaceData();
    }
  }, [contract, isConnected]);

  useEffect(() => {
    filterAndSortModels();
  }, [models, selectedCategory, searchTerm, sortBy, showOnlyVerified]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const categoriesData = await contract.getCategories();
      setCategories(['All', ...categoriesData]);
      
      // Load total models count
      const totalModels = await contract.getTotalModels();
      const modelsData: AIModel[] = [];
      const accessData: Record<number, ModelAccess> = {};
      
      // Load all models
      for (let i = 1; i <= totalModels.toNumber(); i++) {
        try {
          const model = await contract.getModel(i);
          if (model.creator !== '0x0000000000000000000000000000000000000000') {
            modelsData.push({
              modelId: model.modelId.toNumber(),
              creator: model.creator,
              name: model.name,
              description: model.description,
              category: model.category,
              modelHash: model.modelHash,
              metadataHash: model.metadataHash,
              pricePerInference: model.pricePerInference.toString(),
              totalInferences: model.totalInferences.toNumber(),
              totalRevenue: model.totalRevenue.toString(),
              rating: model.rating.toNumber() / 100, // Convert back from scaled rating
              ratingCount: model.ratingCount.toNumber(),
              isActive: model.isActive,
              isVerified: model.isVerified,
              createdAt: model.createdAt.toNumber(),
              updatedAt: model.updatedAt.toNumber()
            });
            
            // Load user access for this model
            if (account) {
              const access = await contract.getModelAccess(i, account);
              accessData[i] = {
                hasAccess: access.hasAccess,
                purchasedAt: access.purchasedAt.toNumber(),
                inferencesUsed: access.inferencesUsed.toNumber(),
                inferencesAllowed: access.inferencesAllowed.toNumber()
              };
            }
          }
        } catch (error) {
          console.error(`Error loading model ${i}:`, error);
        }
      }
      
      setModels(modelsData);
      setUserAccess(accessData);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortModels = () => {
    let filtered = models.filter(model => {
      // Category filter
      if (selectedCategory !== 'All' && model.category !== selectedCategory) {
        return false;
      }
      
      // Search filter
      if (searchTerm && !model.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !model.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Verified filter
      if (showOnlyVerified && !model.isVerified) {
        return false;
      }
      
      // Only show active models
      return model.isActive;
    });

    // Sort models
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return parseFloat(a.pricePerInference) - parseFloat(b.pricePerInference);
        case 'popularity':
          return b.totalInferences - a.totalInferences;
        default:
          return 0;
      }
    });

    setFilteredModels(filtered);
  };

  const handlePurchaseAccess = async (modelId: number, inferences: number) => {
    if (!contract || !account) return;

    try {
      const model = models.find(m => m.modelId === modelId);
      if (!model) return;

      const totalCost = (parseFloat(model.pricePerInference) * inferences).toString();
      
      const tx = await contract.purchaseModelAccess(modelId, inferences, {
        value: totalCost
      });
      
      await tx.wait();
      
      // Reload user access data
      const access = await contract.getModelAccess(modelId, account);
      setUserAccess(prev => ({
        ...prev,
        [modelId]: {
          hasAccess: access.hasAccess,
          purchasedAt: access.purchasedAt.toNumber(),
          inferencesUsed: access.inferencesUsed.toNumber(),
          inferencesAllowed: access.inferencesAllowed.toNumber()
        }
      }));
      
      // Refresh models data
      loadMarketplaceData();
    } catch (error) {
      console.error('Error purchasing model access:', error);
    }
  };

  const handleRateModel = async (modelId: number, rating: number) => {
    if (!contract) return;

    try {
      const tx = await contract.rateModel(modelId, rating);
      await tx.wait();
      
      // Refresh models data
      loadMarketplaceData();
    } catch (error) {
      console.error('Error rating model:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">AI Model Marketplace</h2>
          <p className="text-gray-300 mb-8">Connect your wallet to explore and deploy AI models</p>
          <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Model Marketplace
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover, deploy, and monetize AI models on the decentralized 0G Network
          </p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'price' | 'popularity')}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rating" className="bg-gray-800">Highest Rated</option>
                <option value="price" className="bg-gray-800">Lowest Price</option>
                <option value="popularity" className="bg-gray-800">Most Popular</option>
              </select>
            </div>

            {/* Verified Filter */}
            <div className="flex items-center">
              <label className="flex items-center text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyVerified}
                  onChange={(e) => setShowOnlyVerified(e.target.checked)}
                  className="mr-2 rounded"
                />
                Verified Only
              </label>
            </div>
          </div>
        </motion.div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredModels.map((model, index) => (
              <motion.div
                key={model.modelId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <ModelCard
                  model={model}
                  userAccess={userAccess[model.modelId]}
                  onPurchase={handlePurchaseAccess}
                  onRate={handleRateModel}
                  onDeploy={() => {
                    setSelectedModel(model);
                    setShowDeployment(true);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredModels.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Models Found</h3>
            <p className="text-gray-300">Try adjusting your filters or search terms</p>
          </motion.div>
        )}

        {/* Model Deployment Modal */}
        <AnimatePresence>
          {showDeployment && selectedModel && (
            <ModelDeployment
              model={selectedModel}
              onClose={() => {
                setShowDeployment(false);
                setSelectedModel(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ModelMarketplace;