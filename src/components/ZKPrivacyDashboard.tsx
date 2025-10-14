'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useWallet } from './WalletProvider';
import { useZKPrivacy } from '../hooks/useZKPrivacy';

interface ZKPrivacyDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ZKPrivacyDashboard({ isOpen, onClose }: ZKPrivacyDashboardProps) {
  const { wallet } = useWallet();
  const {
    loading,
    privateINFTs,
    privacySettings,
    fees,
    createPrivateINFT,
    shareEncryptedData,
    updatePrivacySettings,
    executeAnonymousTransaction,
    getPrivateInteractions
  } = useZKPrivacy();

  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'share' | 'settings' | 'anonymous'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAnonymousModal, setShowAnonymousModal] = useState(false);

  // Create Private INFT Form
  const [createForm, setCreateForm] = useState({
    secret: '',
    nullifier: '',
    privacyLevel: 2,
    metadata: ''
  });

  // Share Data Form
  const [shareForm, setShareForm] = useState({
    data: '',
    authorizedUsers: ['']
  });

  // Privacy Settings Form
  const [settingsForm, setSettingsForm] = useState({
    defaultPrivacyLevel: 2,
    allowDataSharing: true,
    enableAnonymousMode: false,
    encryptionKey: ''
  });

  // Anonymous Transaction Form
  const [anonymousForm, setAnonymousForm] = useState({
    amount: '',
    secret: '',
    nullifier: ''
  });

  const [interactions, setInteractions] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    if (privacySettings) {
      setSettingsForm({
        defaultPrivacyLevel: privacySettings.defaultPrivacyLevel,
        allowDataSharing: privacySettings.allowDataSharing,
        enableAnonymousMode: privacySettings.enableAnonymousMode,
        encryptionKey: privacySettings.encryptionKey
      });
    }
  }, [privacySettings]);

  const handleCreatePrivateINFT = async () => {
    try {
      await createPrivateINFT(
        createForm.secret,
        createForm.nullifier,
        createForm.privacyLevel,
        createForm.metadata
      );
      setShowCreateModal(false);
      setCreateForm({ secret: '', nullifier: '', privacyLevel: 2, metadata: '' });
    } catch (error) {
      console.error('Failed to create private INFT:', error);
    }
  };

  const handleShareData = async () => {
    try {
      await shareEncryptedData(
        shareForm.data,
        shareForm.authorizedUsers.filter(user => user.trim() !== '')
      );
      setShowShareModal(false);
      setShareForm({ data: '', authorizedUsers: [''] });
    } catch (error) {
      console.error('Failed to share data:', error);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await updatePrivacySettings(
        settingsForm.defaultPrivacyLevel,
        settingsForm.allowDataSharing,
        settingsForm.enableAnonymousMode,
        settingsForm.encryptionKey
      );
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleAnonymousTransaction = async () => {
    try {
      await executeAnonymousTransaction(
        anonymousForm.amount,
        anonymousForm.secret,
        anonymousForm.nullifier
      );
      setShowAnonymousModal(false);
      setAnonymousForm({ amount: '', secret: '', nullifier: '' });
    } catch (error) {
      console.error('Failed to execute anonymous transaction:', error);
    }
  };

  const loadInteractions = async (commitment: string) => {
    try {
      const interactionList = await getPrivateInteractions(commitment);
      setInteractions(prev => ({ ...prev, [commitment]: interactionList }));
    } catch (error) {
      console.error('Failed to load interactions:', error);
    }
  };

  const getPrivacyLevelLabel = (level: number) => {
    switch (level) {
      case 0: return 'Public';
      case 1: return 'Semi-Private';
      case 2: return 'Fully Private';
      default: return 'Unknown';
    }
  };

  const getPrivacyLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'text-green-600 bg-green-100';
      case 1: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Icon icon="mdi:shield-lock" className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
              Private
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">Private INFTs</p>
          <p className="text-2xl font-bold text-gray-900">{privateINFTs.length}</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Icon icon="mdi:eye-off" className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">Anonymous Mode</p>
          <p className="text-2xl font-bold text-gray-900">
            {privacySettings?.enableAnonymousMode ? 'ON' : 'OFF'}
          </p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Icon icon="mdi:key" className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
              Level {privacySettings?.defaultPrivacyLevel || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">Privacy Level</p>
          <p className="text-2xl font-bold text-gray-900">
            {getPrivacyLevelLabel(privacySettings?.defaultPrivacyLevel || 0)}
          </p>
        </motion.div>
      </div>

      {/* Private INFTs List */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Your Private INFTs</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Create Private INFT
          </button>
        </div>

        {privateINFTs.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="mdi:shield-lock-outline" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No private INFTs yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Create Your First Private INFT
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {privateINFTs.map((inft, index) => (
              <motion.div
                key={inft.commitment}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Icon icon="mdi:shield-lock" className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Private INFT</p>
                      <p className="text-xs text-gray-600">
                        Created {new Date(inft.createdAt * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPrivacyLevelColor(inft.privacyLevel)}`}>
                      {getPrivacyLevelLabel(inft.privacyLevel)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      inft.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                    }`}>
                      {inft.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 mb-3">
                  <p><span className="font-medium">Commitment:</span> {inft.commitment.slice(0, 20)}...</p>
                  <p><span className="font-medium">Nullifier:</span> {inft.nullifierHash.slice(0, 20)}...</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadInteractions(inft.commitment)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg transition-colors"
                  >
                    View Interactions
                  </button>
                  {interactions[inft.commitment] && (
                    <span className="text-xs text-gray-600">
                      {interactions[inft.commitment].length} interactions
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Privacy Settings</h3>
        
        <div className="space-y-6">
          {/* Default Privacy Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Privacy Level
            </label>
            <select
              value={settingsForm.defaultPrivacyLevel}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, defaultPrivacyLevel: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={0}>Public - Visible to everyone</option>
              <option value={1}>Semi-Private - Limited visibility</option>
              <option value={2}>Fully Private - Zero-knowledge privacy</option>
            </select>
          </div>

          {/* Data Sharing */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Allow Data Sharing</p>
              <p className="text-sm text-gray-600">Enable sharing encrypted data with authorized users</p>
            </div>
            <button
              onClick={() => setSettingsForm(prev => ({ ...prev, allowDataSharing: !prev.allowDataSharing }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settingsForm.allowDataSharing ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settingsForm.allowDataSharing ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Anonymous Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Anonymous Mode</p>
              <p className="text-sm text-gray-600">Hide your identity in transactions and interactions</p>
            </div>
            <button
              onClick={() => setSettingsForm(prev => ({ ...prev, enableAnonymousMode: !prev.enableAnonymousMode }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settingsForm.enableAnonymousMode ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settingsForm.enableAnonymousMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Encryption Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Encryption Key
            </label>
            <input
              type="password"
              value={settingsForm.encryptionKey}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, encryptionKey: e.target.value }))}
              placeholder="Enter your encryption key"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              This key will be used to encrypt your private data
            </p>
          </div>

          <button
            onClick={handleUpdateSettings}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
          >
            {loading ? 'Updating...' : 'Update Privacy Settings'}
          </button>
        </div>
      </div>

      {/* Fees Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Fees</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Private INFT Creation</p>
            <p className="text-lg font-bold text-gray-900">{fees.privateINFTFee} ETH</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">ZK Proof Verification</p>
            <p className="text-lg font-bold text-gray-900">{fees.zkProofFee} ETH</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Data Encryption</p>
            <p className="text-lg font-bold text-gray-900">{fees.dataEncryptionFee} ETH</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <motion.div 
        className="bg-white max-w-6xl w-full mx-4 rounded-2xl max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Icon icon="mdi:shield-lock" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Zero-Knowledge Privacy</h2>
              <p className="text-sm text-gray-600">Manage your private INFTs and privacy settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <Icon icon="mdi:close" className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: 'mdi:view-dashboard' },
            { id: 'create', label: 'Create Private', icon: 'mdi:plus-circle' },
            { id: 'share', label: 'Share Data', icon: 'mdi:share-variant' },
            { id: 'settings', label: 'Settings', icon: 'mdi:cog' },
            { id: 'anonymous', label: 'Anonymous', icon: 'mdi:incognito' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon icon={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'settings' && renderSettingsTab()}
                {/* Other tabs would be implemented similarly */}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Create Private INFT Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="bg-white max-w-md w-full mx-4 rounded-2xl p-6 border border-gray-200 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Private INFT</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secret</label>
                  <input
                    type="password"
                    value={createForm.secret}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, secret: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter secret value"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nullifier</label>
                  <input
                    type="password"
                    value={createForm.nullifier}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, nullifier: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter nullifier"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
                  <select
                    value={createForm.privacyLevel}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, privacyLevel: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={0}>Public</option>
                    <option value={1}>Semi-Private</option>
                    <option value={2}>Fully Private</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metadata</label>
                  <textarea
                    value={createForm.metadata}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, metadata: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Enter metadata"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePrivateINFT}
                    disabled={loading || !createForm.secret || !createForm.nullifier}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    {loading ? 'Creating...' : `Create (${fees.privateINFTFee} ETH)`}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}