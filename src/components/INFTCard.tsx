'use client';

import React, { useState } from 'react';
import { useIntellifyContract } from '../hooks/useIntellifyContract.js';

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
    <div className="nft-card relative">
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className={`status-badge ${
          inft.isActive ? 'status-active' : 'status-inactive'
        }`}>
          {inft.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              INFT #{inft.tokenId}
            </h3>
            <p className="text-sm text-gray-500">
              {formatAddress(inft.owner)}
            </p>
          </div>
          
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        {/* AI Model Info */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-600">Model: {inft.modelVersion}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-gray-600">
              {inft.knowledgeHashes.length} Knowledge File{inft.knowledgeHashes.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm text-gray-600">
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
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
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