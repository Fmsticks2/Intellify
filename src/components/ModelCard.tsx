'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'ethers';
import { LoadingSpinner } from './LoadingSpinner';

interface AIModel {
  id: number;
  creator: string;
  name: string;
  description: string;
  category: string;
  pricePerInference: string;
  totalInferences: number;
  totalRating: number;
  ratingCount: number;
  isActive: boolean;
  isVerified: boolean;
  modelHash: string;
  metadataURI: string;
  averageRating: number;
}

interface ModelAccess {
  hasAccess: boolean;
  purchasedAt: number;
  inferencesUsed: number;
  inferencesAllowed: number;
}

interface ModelCardProps {
  model: AIModel;
  userAccess?: ModelAccess;
  onPurchase: (modelId: number, inferences: number) => void;
  onRate: (modelId: number, rating: number) => void;
  onDeploy: () => void;
}

const ModelCard: React.FC<ModelCardProps> = ({
  model,
  userAccess,
  onPurchase,
  onRate,
  onDeploy
}) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [inferencesToPurchase, setInferencesToPurchase] = useState(10);
  const [selectedRating, setSelectedRating] = useState(5);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (priceWei: string) => {
    try {
      return parseFloat(formatEther(priceWei)).toFixed(6);
    } catch {
      return '0.000000';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => interactive && onStarClick && onStarClick(i)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          disabled={!interactive}
        >
          <svg
            className={`w-4 h-4 ${i <= rating ? 'text-yellow-400' : 'text-gray-400'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      );
    }
    return stars;
  };

  const handlePurchase = () => {
    onPurchase(model.id, inferencesToPurchase);
    setShowPurchaseModal(false);
  };

  const handleRate = () => {
    onRate(model.id, selectedRating);
    setShowRatingModal(false);
  };

  const totalCost = (parseFloat(formatPrice(model.pricePerInference)) * inferencesToPurchase).toFixed(6);

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white truncate">{model.name}</h3>
              {model.isVerified && (
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-300 mb-2">by {formatAddress(model.creator)}</p>
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
              {model.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{model.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{model.totalInferences.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Inferences</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {renderStars(Math.round(model.averageRating))}
              <span className="text-sm text-gray-300 ml-1">({model.ratingCount})</span>
            </div>
            <div className="text-xs text-gray-400">Rating</div>
          </div>
        </div>

        {/* Price */}
        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{formatPrice(model.pricePerInference)} ETH</div>
            <div className="text-xs text-gray-400">per inference</div>
          </div>
        </div>

        {/* User Access Status */}
        {userAccess?.hasAccess && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4">
            <div className="text-sm text-green-300 font-medium">Access Granted</div>
            <div className="text-xs text-green-400">
              {userAccess.inferencesAllowed - userAccess.inferencesUsed} inferences remaining
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!userAccess?.hasAccess ? (
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Purchase Access
            </button>
          ) : (
            <button
              onClick={onDeploy}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Deploy Model
            </button>
          )}
          
          {userAccess?.hasAccess && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
            >
              Rate Model
            </button>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs text-gray-400">
            Model ID: {model.id}
          </div>
        </div>
      </motion.div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4">Purchase Model Access</h3>
            <p className="text-gray-300 mb-4">{model.name}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Inferences
              </label>
              <input
                type="number"
                min="1"
                value={inferencesToPurchase}
                onChange={(e) => setInferencesToPurchase(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white/5 rounded-lg p-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Price per inference:</span>
                <span className="text-white">{formatPrice(model.pricePerInference)} ETH</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-300">Quantity:</span>
                <span className="text-white">{inferencesToPurchase}</span>
              </div>
              <div className="border-t border-white/10 mt-2 pt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-white">Total:</span>
                  <span className="text-white">{totalCost} ETH</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Purchase
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4">Rate This Model</h3>
            <p className="text-gray-300 mb-6">{model.name}</p>
            
            <div className="text-center mb-6">
              <div className="flex justify-center gap-2 mb-2">
                {renderStars(selectedRating, true, setSelectedRating)}
              </div>
              <p className="text-sm text-gray-400">Click to rate</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRate}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
              >
                Submit Rating
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ModelCard;