'use client';

import React, { useState } from 'react';
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
    <div className="nft-card relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className={`status-badge ${
          inft.isActive 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' 
            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md'
        } px-3 py-1 rounded-full text-xs font-medium`}>
          {inft.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <img src="/icons/brain.svg" alt="INFT" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                INFT #{inft.tokenId}
              </h3>
              <p className="text-sm text-gray-500">
                {formatAddress(inft.owner)}
              </p>
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
        <div className="space-y-3">
          <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <img src="/icons/neural-network.svg" alt="Model" className="w-4 h-4" />
            <span className="text-sm text-gray-700 font-medium">Model: {inft.modelVersion}</span>
          </div>
          
          <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
            <img src="/icons/knowledge.svg" alt="Knowledge" className="w-4 h-4" />
            <span className="text-sm text-gray-700 font-medium">
              {inft.knowledgeHashes.length} Knowledge File{inft.knowledgeHashes.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <img src="/icons/analytics.svg" alt="Interactions" className="w-4 h-4" />
            <span className="text-sm text-gray-700 font-medium">
              {inft.interactionCount} Interaction{inft.interactionCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Last updated: {formatDate(inft.lastUpdated)}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleInteraction('summary')}
                disabled={loading || !inft.isActive}
                className="btn-secondary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="loading-spinner mx-auto"></div>
                ) : (
                  'Generate Summary'
                )}
              </button>
              
              <button
                onClick={() => handleInteraction('qa')}
                disabled={loading || !inft.isActive}
                className="btn-secondary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="loading-spinner mx-auto"></div>
                ) : (
                  'Ask Question'
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleToggleActive}
                disabled={loading}
                className={`text-sm py-2 font-medium rounded-lg transition-colors ${
                  inft.isActive
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <div className="loading-spinner mx-auto"></div>
                ) : inft.isActive ? (
                  'Deactivate'
                ) : (
                  'Reactivate'
                )}
              </button>
              
              <button
                onClick={handleBurn}
                disabled={loading}
                className="btn-danger text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="loading-spinner mx-auto"></div>
                ) : (
                  'Burn'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!showActions && inft.isActive && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <button
                onClick={() => handleInteraction('summary')}
                disabled={loading}
                className="flex-1 btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="loading-spinner mx-auto"></div>
                ) : (
                  'Interact'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}