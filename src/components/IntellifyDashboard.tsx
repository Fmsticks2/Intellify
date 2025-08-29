'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from './WalletProvider'
import MintINFTModal from './MintINFTModal'
import INFTCard from './INFTCard'
import { useIntellifyContract } from '../hooks/useIntellifyContract';
import PrivacySettings from './PrivacySettings';
import EnhancedEncryptionModal from './EnhancedEncryptionModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import { encryptionService } from '../lib/enhanced-encryption';

interface INFT {
  tokenId: number;
  owner: string;
  modelVersion: string;
  knowledgeHashes: string[];
  interactionCount: number;
  lastUpdated: number;
  isActive: boolean;
  tokenURI: string;
  isEncrypted?: boolean;
}

export default function IntellifyDashboard() {
  const { wallet, connectWallet, switchToCorrectNetwork } = useWallet();
  const { contract, getUserINFTs, getAIState, isCorrectNetwork } = useIntellifyContract();
  const [infts, setInfts] = useState<INFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encryptionStats, setEncryptionStats] = useState({
    totalEncrypted: 0,
    activeSessions: 0,
    lastKeyRotation: null as Date | null
  });

  useEffect(() => {
    if (wallet.isConnected && contract && isCorrectNetwork) {
      loadUserINFTs();
      loadEncryptionStats();
    }
  }, [wallet.isConnected, contract, isCorrectNetwork]);

  const loadEncryptionStats = async () => {
     try {
       // Get encryption statistics from the service
       const sessions = encryptionService.getActiveSessions();
       setEncryptionStats({
         totalEncrypted: infts.filter(inft => inft.isEncrypted || false).length,
         activeSessions: sessions.length,
         lastKeyRotation: sessions.length > 0 ? new Date() : null
       });
     } catch (error) {
       console.error('Failed to load encryption stats:', error);
     }
   };

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
      <motion.div 
        className="text-center py-16"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="glass-strong max-w-md mx-auto rounded-3xl p-8 cyber-border relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-3xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-shimmer" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-shimmer" style={{animationDelay: '1s'}} />
          </div>
          
          <div className="space-y-6 relative z-10">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mx-auto flex items-center justify-center shadow-lg cyber-glow"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
            >
              <img src="/icons/wallet.svg" alt="Wallet" className="w-8 h-8 filter brightness-0 invert" />
            </motion.div>
            <h3 className="text-xl font-semibold gradient-text text-glow">Connect Your Wallet</h3>
            <p className="text-gray-300 text-shadow leading-relaxed">
              Connect your wallet to start creating and managing your <span className="text-primary-400 font-semibold">AI Knowledge INFTs</span>.
            </p>
            <motion.button 
              onClick={connectWallet} 
              className="btn-primary w-full cyber-glow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Connect Wallet</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Wrong network state
  if (!isCorrectNetwork) {
    return (
      <motion.div 
        className="text-center py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="glass-strong max-w-md mx-auto rounded-3xl p-8 cyber-border relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Warning Border Animation */}
          <div className="absolute inset-0 rounded-3xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-shimmer" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-shimmer" style={{animationDelay: '1s'}} />
          </div>
          
          <div className="space-y-6 relative z-10">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full mx-auto flex items-center justify-center shadow-lg"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(245, 158, 11, 0.3)",
                  "0 0 40px rgba(245, 158, 11, 0.6)",
                  "0 0 20px rgba(245, 158, 11, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </motion.div>
            <h3 className="text-xl font-semibold text-yellow-400 text-glow">Network Mismatch</h3>
            <p className="text-gray-300 text-shadow leading-relaxed">
              Please switch to <span className="text-yellow-400 font-semibold">0G-Galileo-Testnet</span> to use Intellify.
            </p>
            <motion.button 
              onClick={handleNetworkSwitch} 
              className="btn-primary w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Switch Network</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats and Actions */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        variants={containerVariants}
      >
        <motion.div 
          className="glass-strong rounded-2xl p-6 border border-primary-400/30 bg-gradient-to-br from-black/80 to-gray-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-50" />
          <div className="flex items-center space-x-4 relative z-10">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg cyber-glow"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
            >
              <img src="/icons/database.svg" alt="Database" className="w-6 h-6 filter brightness-0 invert" />
            </motion.div>
            <div>
              <p className="text-sm text-primary-300/80 font-medium">Total INFTs</p>
              <motion.p 
                className="text-2xl font-bold gradient-text text-glow"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              >
                {infts.length}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="glass-strong rounded-2xl p-6 border border-primary-400/30 bg-gradient-to-br from-black/80 to-gray-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-50" />
          <div className="flex items-center space-x-4 relative z-10">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg cyber-glow"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </motion.div>
            <div>
              <p className="text-sm text-primary-300/80 font-medium">Encrypted INFTs</p>
              <motion.p 
                className="text-2xl font-bold gradient-text text-glow"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              >
                {encryptionStats.totalEncrypted}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="glass-strong rounded-2xl p-6 border border-primary-400/30 bg-gradient-to-br from-black/80 to-gray-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-50" />
          <div className="flex items-center space-x-4 relative z-10">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg cyber-glow"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </motion.div>
            <div>
              <p className="text-sm text-primary-300/80 font-medium">Active Sessions</p>
              <motion.p 
                className="text-2xl font-bold gradient-text text-glow"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
              >
                {encryptionStats.activeSessions}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="glass-strong rounded-2xl p-6 border border-primary-400/30 bg-gradient-to-br from-black/80 to-gray-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-50" />
          <div className="flex items-center space-x-4 relative z-10">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg cyber-glow"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
            >
              <img src="/icons/analytics.svg" alt="Analytics" className="w-6 h-6 filter brightness-0 invert" />
            </motion.div>
            <div>
              <p className="text-sm text-primary-300/80 font-medium">Total Interactions</p>
              <motion.p 
                className="text-2xl font-bold gradient-text text-glow"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              >
                {infts.reduce((sum, inft) => sum + inft.interactionCount, 0)}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="flex flex-col sm:flex-row gap-4"
        variants={cardVariants}
      >
        <motion.button
          onClick={() => setShowPrivacySettings(true)}
          className="btn-secondary flex items-center justify-center space-x-2 glass border border-primary-400/30 bg-gradient-to-r from-black/80 to-gray-900/60 backdrop-blur-xl"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <motion.svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </motion.svg>
          <span>Privacy Settings</span>
        </motion.button>
        <motion.button
          onClick={() => setShowAnalytics(true)}
          className="btn-secondary flex items-center justify-center space-x-2 glass border border-primary-400/30 bg-gradient-to-r from-black/80 to-gray-900/60 backdrop-blur-xl"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <motion.svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </motion.svg>
          <span>Analytics Dashboard</span>
        </motion.button>
        <motion.button
          onClick={() => setShowMintModal(true)}
          className="btn-primary flex items-center justify-center space-x-2 glass-strong border border-primary-400/30 cyber-glow"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <motion.img 
            src="/icons/brain.svg" 
            alt="Create" 
            className="w-5 h-5"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          />
          <span>Create New INFT</span>
        </motion.button>
        
        <motion.button
          onClick={loadUserINFTs}
          disabled={loading}
          className="btn-secondary flex items-center justify-center space-x-2 glass border border-primary-400/30 bg-gradient-to-r from-black/80 to-gray-900/60 backdrop-blur-xl"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <motion.img 
            src="/icons/refresh.svg" 
            alt="Refresh" 
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
            animate={loading ? { rotate: 360 } : {}}
            transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          />
          <span>Refresh</span>
        </motion.button>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="glass-strong border border-red-400/30 rounded-2xl p-4 shadow-lg bg-gradient-to-r from-black/80 to-gray-900/60 backdrop-blur-xl"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.div>
              <p className="text-white font-medium text-shadow">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INFTs Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            className="flex items-center justify-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="loading-spinner"></div>
            <motion.span 
              className="ml-3 text-white/80 text-shadow"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Loading your INFTs...
            </motion.span>
          </motion.div>
        ) : infts.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="glass-strong w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-400/30 cyber-glow"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.8 }}
            >
              <img src="/icons/knowledge.svg" alt="No INFTs" className="w-12 h-12 filter brightness-0 invert" />
            </motion.div>
            <motion.h3 
              className="text-xl font-semibold gradient-text text-glow mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No INFTs Yet
            </motion.h3>
            <motion.p 
              className="text-primary-300/80 text-shadow mb-8 max-w-md mx-auto font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Create your first AI Knowledge NFT to get started with Intellify.
            </motion.p>
            <motion.button
              onClick={() => setShowMintModal(true)}
              className="btn-primary glass-strong border border-primary-400/30 cyber-glow"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              Create Your First INFT
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {infts.map((inft, index) => (
              <motion.div
                key={inft.tokenId}
                variants={cardVariants}
                custom={index}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <INFTCard
                  inft={inft}
                  onUpdate={loadUserINFTs}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showMintModal && (
          <MintINFTModal
            onClose={() => setShowMintModal(false)}
            onSuccess={handleMintSuccess}
          />
        )}
        {showPrivacySettings && (
           <PrivacySettings
             onClose={() => setShowPrivacySettings(false)}
           />
         )}
        {showEncryptionModal && (
           <EnhancedEncryptionModal
             isOpen={showEncryptionModal}
             onClose={() => setShowEncryptionModal(false)}
             onEncryptionComplete={(encryptedData, sessionId) => {
               console.log('Encryption completed:', { encryptedData, sessionId });
               setShowEncryptionModal(false);
               loadEncryptionStats();
             }}
             data={{
               content: 'Sample data for encryption',
               type: 'general'
             }}
           />
         )}
        {showAnalytics && (
           <AnalyticsDashboard
             isOpen={showAnalytics}
             onClose={() => setShowAnalytics(false)}
             userINFTs={infts}
           />
         )}
      </AnimatePresence>
    </motion.div>
  );
}