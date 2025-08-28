'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from './WalletProvider'
import MintINFTModal from './MintINFTModal'
import INFTCard from './INFTCard'
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

export default function IntellifyDashboard() {
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
      setError('Failed to switch to 0G-Galileo-Testnet. Please switch manually.');
    }
  };

  // Not connected state
  if (!wallet.isConnected) {
    return (
      <div className="text-center py-16">
        <div className="card max-w-md mx-auto">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
              <img src="/icons/wallet.svg" alt="Wallet" className="w-8 h-8" />
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
              Please switch to 0G-Galileo-Testnet to use Intellify.
            </p>
            <button onClick={handleNetworkSwitch} className="btn-primary w-full">
              Switch to 0G-Galileo-Testnet
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
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <img src="/icons/database.svg" alt="Database" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total INFTs</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{infts.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
              <img src="/icons/brain.svg" alt="Active AI" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active INFTs</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {infts.filter(inft => inft.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
              <img src="/icons/analytics.svg" alt="Analytics" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Interactions</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
          className="btn-primary flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <img src="/icons/brain.svg" alt="Create" className="w-5 h-5" />
          <span>Create New INFT</span>
        </button>
        
        <button
          onClick={loadUserINFTs}
          disabled={loading}
          className="btn-secondary flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <img src="/icons/refresh.svg" alt="Refresh" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-700 font-medium">{error}</p>
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
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
            <img src="/icons/knowledge.svg" alt="No INFTs" className="w-12 h-12 opacity-60" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No INFTs Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first AI Knowledge NFT to get started with Intellify.
          </p>
          <button
            onClick={() => setShowMintModal(true)}
            className="btn-primary bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
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