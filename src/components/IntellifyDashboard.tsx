'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from './WalletProvider';
import { MintINFTModal } from './MintINFTModal';
import { INFTCard } from './INFTCard';
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

export function IntellifyDashboard() {
  const { wallet, connectWallet, switchToCorrectNetwork } = useWallet();
  const { contract, getUserINFTs, getAIState, isCorrectNetwork } = useIntellifyContract();
  const [infts, setInfts] = useState<INFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallet.isConnected && contract && isCorrectNetwork) {
      loadUserINFTs();
    }
  }, [wallet.isConnected, contract, isCorrectNetwork]);

  const loadUserINFTs = async () => {
    if (!wallet.address || !contract) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tokenIds = await getUserINFTs(wallet.address);
      const inftsData: INFT[] = [];
      
      for (const tokenId of tokenIds) {
        try {
          const aiState = await getAIState(tokenId);
          const tokenURI = await contract.tokenURI(tokenId);
          
          inftsData.push({
            tokenId: Number(tokenId),
            owner: aiState.owner,
            modelVersion: aiState.modelVersion,
            knowledgeHashes: aiState.knowledgeHashes,
            interactionCount: Number(aiState.interactionCount),
            lastUpdated: Number(aiState.lastUpdated),
            isActive: aiState.isActive,
            tokenURI,
          });
        } catch (err) {
          console.error(`Error loading INFT ${tokenId}:`, err);
        }
      }
      
      setInfts(inftsData);
    } catch (err) {
      console.error('Error loading user INFTs:', err);
      setError('Failed to load your INFTs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMintSuccess = () => {
    setShowMintModal(false);
    loadUserINFTs(); // Refresh the list
  };

  const handleNetworkSwitch = async () => {
    const success = await switchToCorrectNetwork();
    if (success) {
      // Network switched successfully, the page will reload
    } else {
      setError('Failed to switch to 0G Testnet. Please switch manually.');
    }
  };

  // Not connected state
  if (!wallet.isConnected) {
    return (
      <div className="text-center py-16">
        <div className="card max-w-md mx-auto">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Connect Your Wallet</h3>
            <p className="text-gray-600">
              Connect your wallet to start creating and managing your AI Knowledge NFTs.
            </p>
            <button onClick={connectWallet} className="btn-primary w-full">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wrong network state
  if (!isCorrectNetwork) {
    return (
      <div className="text-center py-16">
        <div className="card max-w-md mx-auto">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-yellow-500 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Wrong Network</h3>
            <p className="text-gray-600">
              Please switch to 0G Testnet to use Intellify.
            </p>
            <button onClick={handleNetworkSwitch} className="btn-primary w-full">
              Switch to 0G Testnet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total INFTs</p>
              <p className="text-2xl font-bold text-gray-900">{infts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active INFTs</p>
              <p className="text-2xl font-bold text-gray-900">
                {infts.filter(inft => inft.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Interactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {infts.reduce((sum, inft) => sum + inft.interactionCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setShowMintModal(true)}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create New INFT</span>
        </button>
        
        <button
          onClick={loadUserINFTs}
          disabled={loading}
          className="btn-secondary flex items-center justify-center space-x-2"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* INFTs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="loading-spinner"></div>
          <span className="ml-2 text-gray-600">Loading your INFTs...</span>
        </div>
      ) : infts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No INFTs Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first AI Knowledge NFT to get started with Intellify.
          </p>
          <button
            onClick={() => setShowMintModal(true)}
            className="btn-primary"
          >
            Create Your First INFT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {infts.map((inft) => (
            <INFTCard
              key={inft.tokenId}
              inft={inft}
              onUpdate={loadUserINFTs}
            />
          ))}
        </div>
      )}

      {/* Mint Modal */}
      {showMintModal && (
        <MintINFTModal
          onClose={() => setShowMintModal(false)}
          onSuccess={handleMintSuccess}
        />
      )}
    </div>
  );
}