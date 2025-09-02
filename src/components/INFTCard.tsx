'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useIntellifyContract } from '../hooks/useIntellifyContract';

interface INFT {
  tokenId: number;
  owner: string;
  modelVersion: string;
  knowledgeHashes: string[];
  interactionCount: number;
  lastUpdated: number;
  isActive: boolean;
  tokenURI: string;
}

interface INFTCardProps {
  inft: INFT;
  onUpdate: () => void;
}

export default function INFTCard({ inft, onUpdate }: INFTCardProps) {
  const { recordInteraction, deactivateINFT, reactivateINFT, burnINFT } = useIntellifyContract();
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleInteraction = async (interactionType: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const tx = await recordInteraction(inft.tokenId, interactionType);
      await tx.wait();
      onUpdate(); // Refresh the data
    } catch (err: any) {
      console.error('Error recording interaction:', err);
      setError(err.message || 'Failed to record interaction');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const tx = inft.isActive 
        ? await deactivateINFT(inft.tokenId)
        : await reactivateINFT(inft.tokenId);
      await tx.wait();
      onUpdate(); // Refresh the data
    } catch (err: any) {
      console.error('Error toggling INFT status:', err);
      setError(err.message || 'Failed to update INFT status');
    } finally {
      setLoading(false);
    }
  };

  const handleBurn = async () => {
    if (!confirm('Are you sure you want to burn this INFT? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await burnINFT(inft.tokenId);
      await tx.wait();
      onUpdate(); // Refresh the data
    } catch (err: any) {
      console.error('Error burning INFT:', err);
      setError(err.message || 'Failed to burn INFT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="nft-card relative bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)"
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Status Badge */}
      <motion.div 
        className="absolute top-4 right-4 z-10"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <motion.span 
          className={`status-badge ${
            inft.isActive 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg'
          } px-3 py-1 rounded-full text-xs font-medium`}
          animate={inft.isActive ? {
            boxShadow: [
              "0 0 20px rgba(34, 197, 94, 0.3)",
              "0 0 30px rgba(34, 197, 94, 0.6)",
              "0 0 20px rgba(34, 197, 94, 0.3)"
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {inft.isActive ? 'Active' : 'Inactive'}
        </motion.span>
      </motion.div>

      {/* Card Header */}
      <motion.div 
        className="p-6 pb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ 
                scale: 1.1, 
                rotate: 5,
                boxShadow: "0 10px 30px rgba(139, 92, 246, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon icon="mdi:brain" className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <motion.h3 
                className="text-lg font-bold gradient-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                INFT #{inft.tokenId}
              </motion.h3>
              <motion.p 
                className="text-sm text-black truncate max-w-[200px]" 
                title={inft.owner}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Owner: {inft.owner.slice(0, 6)}...{inft.owner.slice(-4)}
              </motion.p>
            </div>
          </div>
          
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        {/* AI Model Info */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, staggerChildren: 0.1 }}
        >
          <motion.div 
            className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 5 }}
          >
            <Icon icon="mdi:neural-network" className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-black">Model:</span>
            <span className="text-sm text-black font-semibold">{inft.modelVersion}</span>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 5 }}
          >
            <Icon icon="mdi:book-open-variant" className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-black">Knowledge Files:</span>
            <span className="text-sm text-black font-semibold">
              {inft.knowledgeHashes.length} File{inft.knowledgeHashes.length !== 1 ? 's' : ''}
            </span>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 5 }}
          >
            <Icon icon="mdi:chart-line" className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-black">Interactions:</span>
            <span className="text-sm text-black font-semibold">
              {inft.interactionCount} Interaction{inft.interactionCount !== 1 ? 's' : ''}
            </span>
          </motion.div>
        </motion.div>

        {/* Last Updated */}
        <motion.div 
          className="mt-4 pt-4 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center space-x-2 text-xs text-black">
            <Icon icon="mdi:clock" className="w-4 h-4 text-gray-500" />
            <span>Last updated: {formatDate(inft.lastUpdated)}</span>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-2">
                  <motion.div 
                    className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                  >
                    <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.div>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <AnimatePresence>
          {showActions && (
            <motion.div 
              className="mt-4 pt-4 border-t border-gray-200 space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, staggerChildren: 0.1 }}
              >
                <motion.button
                  onClick={() => handleInteraction('summary')}
                  disabled={loading || !inft.isActive}
                  className="text-sm py-2 flex items-center justify-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg border border-blue-600 font-medium transition-all duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? (
                    <div className="loading-spinner mx-auto"></div>
                  ) : (
                    <>
                      <Icon icon="mdi:brain" className="w-4 h-4 text-white" />
                      <span>Summary</span>
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  onClick={() => handleInteraction('qa')}
                  disabled={loading || !inft.isActive}
                  className="text-sm py-2 flex items-center justify-center space-x-2 bg-gray-100 text-black hover:bg-gray-200 rounded-lg border border-gray-300 font-medium transition-all duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? (
                    <div className="loading-spinner mx-auto"></div>
                  ) : (
                    'Ask Question'
                  )}
                </motion.button>
              </motion.div>
              
              <motion.div 
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.button
                  onClick={handleToggleActive}
                  disabled={loading}
                  className={`text-sm py-2 font-medium rounded-lg transition-all duration-300 border ${
                    inft.isActive
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500'
                      : 'bg-green-500 text-white hover:bg-green-600 border-green-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? (
                    <div className="loading-spinner mx-auto"></div>
                  ) : inft.isActive ? (
                    'Deactivate'
                  ) : (
                    'Reactivate'
                  )}
                </motion.button>
                
                <motion.button
                  onClick={handleBurn}
                  disabled={loading}
                  className="text-sm py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 border border-red-500"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? (
                    <div className="loading-spinner mx-auto"></div>
                  ) : (
                    'Burn'
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <AnimatePresence>
          {!showActions && inft.isActive && (
            <motion.div 
              className="mt-4 pt-4 border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex space-x-2">
                <motion.button
                  onClick={() => handleInteraction('summary')}
                  disabled={loading}
                  className="flex-1 text-sm py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium border border-purple-600 flex items-center justify-center space-x-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? (
                    <div className="loading-spinner mx-auto"></div>
                  ) : (
                    <>
                      <Icon icon="mdi:brain" className="w-4 h-4 text-white" />
                      <span>Interact</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}