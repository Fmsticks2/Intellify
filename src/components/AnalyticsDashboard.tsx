'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useWallet } from './WalletProvider';
import { useIntellifyContract } from '../hooks/useIntellifyContract';

interface AnalyticsData {
  totalINFTs: number;
  activeINFTs: number;
  encryptedINFTs: number;
  totalInteractions: number;
  avgInteractionsPerINFT: number;
  growthRate: number;
  topPerformingINFTs: Array<{
    tokenId: string;
    name: string;
    interactions: number;
    performance: number;
  }>;
  interactionHistory: Array<{
    date: string;
    interactions: number;
  }>;
  encryptionStats: {
    encrypted: number;
    unencrypted: number;
  };
}

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userINFTs: any[];
}

export default function AnalyticsDashboard({ isOpen, onClose, userINFTs }: AnalyticsDashboardProps) {
  const { wallet } = useWallet();
  const contract = useIntellifyContract();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
    }
  }, [isOpen, userINFTs, selectedTimeframe]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Calculate analytics from user INFTs
      const totalINFTs = userINFTs.length;
      const activeINFTs = userINFTs.filter(inft => inft.isActive).length;
      const encryptedINFTs = userINFTs.filter(inft => inft.isEncrypted).length;
      const totalInteractions = userINFTs.reduce((sum, inft) => sum + (inft.interactionCount || 0), 0);
      const avgInteractionsPerINFT = totalINFTs > 0 ? totalInteractions / totalINFTs : 0;
      
      // Mock growth rate calculation
      const growthRate = Math.random() * 20 + 5; // 5-25% growth
      
      // Top performing INFTs
      const topPerformingINFTs = userINFTs
        .map(inft => ({
          tokenId: inft.tokenId,
          name: `INFT #${inft.tokenId}`,
          interactions: inft.interactionCount || 0,
          performance: (inft.interactionCount || 0) * 100 / Math.max(totalInteractions, 1)
        }))
        .sort((a, b) => b.interactions - a.interactions)
        .slice(0, 5);
      
      // Mock interaction history
      const interactionHistory = generateMockHistory(selectedTimeframe);
      
      const encryptionStats = {
        encrypted: encryptedINFTs,
        unencrypted: totalINFTs - encryptedINFTs
      };
      
      setAnalyticsData({
        totalINFTs,
        activeINFTs,
        encryptedINFTs,
        totalInteractions,
        avgInteractionsPerINFT,
        growthRate,
        topPerformingINFTs,
        interactionHistory,
        encryptionStats
      });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockHistory = (timeframe: string) => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const history = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toISOString().split('T')[0],
        interactions: Math.floor(Math.random() * 50) + 10
      });
    }
    
    return history;
  };

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 30 Days';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <motion.div 
        className="glass-strong max-w-6xl w-full mx-4 rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
              <Icon icon="mdi:chart-bar" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              <p className="text-gray-400">Comprehensive insights into your INFT performance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Timeframe Selector */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe((e.target as HTMLSelectElement).value as '7d' | '30d' | '90d')}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d" className="bg-gray-800">Last 7 Days</option>
              <option value="30d" className="bg-gray-800">Last 30 Days</option>
              <option value="90d" className="bg-gray-800">Last 90 Days</option>
            </select>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Icon icon="mdi:close" className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : analyticsData ? (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div 
                className="glass-subtle rounded-2xl p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Total INFTs</p>
                    <p className="text-3xl font-bold text-white mt-1">{analyticsData.totalINFTs}</p>
                    <p className="text-green-400 text-sm mt-1">+{analyticsData.growthRate.toFixed(1)}% growth</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Icon icon="mdi:brain" className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="glass-subtle rounded-2xl p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Active INFTs</p>
                    <p className="text-3xl font-bold text-white mt-1">{analyticsData.activeINFTs}</p>
                    <p className="text-green-400 text-sm mt-1">{((analyticsData.activeINFTs / analyticsData.totalINFTs) * 100).toFixed(1)}% active</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Icon icon="mdi:lightning-bolt" className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="glass-subtle rounded-2xl p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Total Interactions</p>
                    <p className="text-3xl font-bold text-white mt-1">{analyticsData.totalInteractions}</p>
                    <p className="text-green-400 text-sm mt-1">{analyticsData.avgInteractionsPerINFT.toFixed(1)} avg per INFT</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Icon icon="mdi:message-text" className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="glass-subtle rounded-2xl p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Encrypted INFTs</p>
                    <p className="text-3xl font-bold text-white mt-1">{analyticsData.encryptedINFTs}</p>
                    <p className="text-green-400 text-sm mt-1">{((analyticsData.encryptedINFTs / analyticsData.totalINFTs) * 100).toFixed(1)}% encrypted</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Icon icon="mdi:lock" className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Interaction History Chart */}
              <div className="glass-subtle rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Interaction History</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {analyticsData.interactionHistory.map((day, index) => {
                    const maxInteractions = Math.max(...analyticsData.interactionHistory.map(d => d.interactions));
                    const height = (day.interactions / maxInteractions) * 100;
                    
                    return (
                      <motion.div
                        key={day.date}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg relative group cursor-pointer"
                        style={{ height: `${height}%` }}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.interactions}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-4 text-gray-400 text-sm">
                  <span>{getTimeframeLabel(selectedTimeframe)}</span>
                  <span>Interactions</span>
                </div>
              </div>

              {/* Encryption Distribution */}
              <div className="glass-subtle rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Encryption Distribution</h3>
                <div className="flex items-center justify-center h-64">
                  <div className="relative w-48 h-48">
                    {/* Donut Chart */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="10"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#encryptedGradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(analyticsData.encryptedINFTs / analyticsData.totalINFTs) * 251.2} 251.2`}
                        initial={{ strokeDasharray: '0 251.2' }}
                        animate={{ strokeDasharray: `${(analyticsData.encryptedINFTs / analyticsData.totalINFTs) * 251.2} 251.2` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                      <defs>
                        <linearGradient id="encryptedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{analyticsData.encryptedINFTs}</p>
                        <p className="text-gray-400 text-sm">Encrypted</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
                    <span className="text-gray-300 text-sm">Encrypted ({analyticsData.encryptedINFTs})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-600" />
                    <span className="text-gray-300 text-sm">Unencrypted ({analyticsData.encryptionStats.unencrypted})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing INFTs */}
            <div className="glass-subtle rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Top Performing INFTs</h3>
              <div className="space-y-4">
                {analyticsData.topPerformingINFTs.map((inft, index) => (
                  <motion.div
                    key={inft.tokenId}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{inft.name}</p>
                        <p className="text-gray-400 text-sm">Token ID: {inft.tokenId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{inft.interactions} interactions</p>
                      <p className="text-gray-400 text-sm">{inft.performance.toFixed(1)}% of total</p>
                    </div>
                  </motion.div>
                ))}
                {analyticsData.topPerformingINFTs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No INFTs with interactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400">Failed to load analytics data</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}