'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useWallet } from './WalletProvider';
import { useIntellifyContract } from '../hooks/useIntellifyContract';
import { useAIMarketplace } from '../hooks/useAIMarketplace';

interface EnhancedAnalyticsData {
  // Basic metrics
  totalINFTs: number;
  activeINFTs: number;
  encryptedINFTs: number;
  totalInteractions: number;
  avgInteractionsPerINFT: number;
  
  // Advanced metrics
  growthRate: number;
  engagementScore: number;
  performanceIndex: number;
  revenueGenerated: number;
  marketplaceActivity: number;
  
  // Time series data
  interactionHistory: Array<{
    date: string;
    interactions: number;
    revenue: number;
    newINFTs: number;
  }>;
  
  // Performance insights
  topPerformingINFTs: Array<{
    tokenId: string;
    name: string;
    interactions: number;
    revenue: number;
    performance: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  
  // Predictive analytics
  predictions: {
    nextWeekInteractions: number;
    nextMonthRevenue: number;
    growthForecast: number;
    riskScore: number;
  };
  
  // Network analytics
  networkStats: {
    totalModelsDeployed: number;
    totalInferences: number;
    networkUtilization: number;
    averageResponseTime: number;
  };
  
  // Social metrics
  socialMetrics: {
    shares: number;
    likes: number;
    comments: number;
    followers: number;
  };
}

interface EnhancedAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userINFTs: any[];
}

export default function EnhancedAnalyticsDashboard({ isOpen, onClose, userINFTs }: EnhancedAnalyticsDashboardProps) {
  const { wallet } = useWallet();
  const contract = useIntellifyContract();
  const { models } = useAIMarketplace();
  
  const [analyticsData, setAnalyticsData] = useState<EnhancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'performance' | 'predictions' | 'network'>('overview');
  const [realTimeData, setRealTimeData] = useState<any>(null);

  // Real-time data updates
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Simulate real-time updates
      setRealTimeData({
        currentInteractions: Math.floor(Math.random() * 100) + 50,
        activeUsers: Math.floor(Math.random() * 20) + 10,
        networkLoad: Math.random() * 100,
        lastUpdate: new Date().toLocaleTimeString()
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadEnhancedAnalyticsData();
    }
  }, [isOpen, userINFTs, selectedTimeframe, models]);

  const loadEnhancedAnalyticsData = async () => {
    setLoading(true);
    try {
      // Basic calculations
      const totalINFTs = userINFTs.length;
      const activeINFTs = userINFTs.filter(inft => inft.isActive).length;
      const encryptedINFTs = userINFTs.filter(inft => inft.isEncrypted).length;
      const totalInteractions = userINFTs.reduce((sum, inft) => sum + (inft.interactionCount || 0), 0);
      const avgInteractionsPerINFT = totalINFTs > 0 ? totalInteractions / totalINFTs : 0;

      // Advanced metrics calculations
      const growthRate = calculateGrowthRate(userINFTs);
      const engagementScore = calculateEngagementScore(userINFTs);
      const performanceIndex = calculatePerformanceIndex(userINFTs);
      const revenueGenerated = calculateRevenue(userINFTs);
      const marketplaceActivity = models.length;

      // Generate time series data
      const interactionHistory = generateTimeSeriesData(selectedTimeframe);

      // Top performing INFTs with trends
      const topPerformingINFTs = calculateTopPerformers(userINFTs);

      // Predictive analytics
      const predictions = generatePredictions(userINFTs, interactionHistory);

      // Network statistics
      const networkStats = await calculateNetworkStats();

      // Social metrics (mock data)
      const socialMetrics = generateSocialMetrics(userINFTs);

      setAnalyticsData({
        totalINFTs,
        activeINFTs,
        encryptedINFTs,
        totalInteractions,
        avgInteractionsPerINFT,
        growthRate,
        engagementScore,
        performanceIndex,
        revenueGenerated,
        marketplaceActivity,
        interactionHistory,
        topPerformingINFTs,
        predictions,
        networkStats,
        socialMetrics
      });
    } catch (error) {
      console.error('Failed to load enhanced analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowthRate = (infts: any[]) => {
    // Mock growth calculation based on creation dates
    const recentINFTs = infts.filter(inft => {
      const createdDate = new Date(inft.createdAt || Date.now());
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return createdDate > thirtyDaysAgo;
    });
    return (recentINFTs.length / Math.max(infts.length, 1)) * 100;
  };

  const calculateEngagementScore = (infts: any[]) => {
    if (infts.length === 0) return 0;
    const totalEngagement = infts.reduce((sum, inft) => {
      return sum + (inft.interactionCount || 0) + (inft.shares || 0) + (inft.likes || 0);
    }, 0);
    return Math.min(100, (totalEngagement / infts.length) * 2);
  };

  const calculatePerformanceIndex = (infts: any[]) => {
    if (infts.length === 0) return 0;
    const activeRatio = infts.filter(inft => inft.isActive).length / infts.length;
    const avgInteractions = infts.reduce((sum, inft) => sum + (inft.interactionCount || 0), 0) / infts.length;
    return Math.min(100, (activeRatio * 50) + (Math.min(avgInteractions, 50)));
  };

  const calculateRevenue = (infts: any[]) => {
    return infts.reduce((sum, inft) => {
      return sum + ((inft.interactionCount || 0) * 0.001); // Mock revenue calculation
    }, 0);
  };

  const generateTimeSeriesData = (timeframe: string) => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        interactions: Math.floor(Math.random() * 100) + 20,
        revenue: Math.random() * 10 + 1,
        newINFTs: Math.floor(Math.random() * 5)
      });
    }
    
    return data;
  };

  const calculateTopPerformers = (infts: any[]) => {
    return infts
      .map(inft => {
        const interactions = inft.interactionCount || 0;
        const revenue = interactions * 0.001;
        const performance = interactions * 10; // Mock performance score
        const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';
        
        return {
          tokenId: inft.tokenId,
          name: `INFT #${inft.tokenId}`,
          interactions,
          revenue,
          performance,
          trend: trend as 'up' | 'down' | 'stable'
        };
      })
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);
  };

  const generatePredictions = (infts: any[], history: any[]) => {
    const avgGrowth = history.length > 1 ? 
      (history[history.length - 1].interactions - history[0].interactions) / history.length : 0;
    
    return {
      nextWeekInteractions: Math.max(0, Math.floor(avgGrowth * 7 + Math.random() * 50)),
      nextMonthRevenue: Math.max(0, avgGrowth * 0.001 * 30 + Math.random() * 20),
      growthForecast: Math.min(100, Math.max(-50, avgGrowth * 2 + (Math.random() - 0.5) * 20)),
      riskScore: Math.floor(Math.random() * 30) + 10 // Low risk score
    };
  };

  const calculateNetworkStats = async () => {
    // Mock network statistics
    return {
      totalModelsDeployed: models.length,
      totalInferences: models.reduce((sum, model) => sum + model.totalInferences, 0),
      networkUtilization: Math.random() * 100,
      averageResponseTime: Math.random() * 500 + 100
    };
  };

  const generateSocialMetrics = (infts: any[]) => {
    return {
      shares: infts.reduce((sum, inft) => sum + (inft.shares || 0), 0),
      likes: infts.reduce((sum, inft) => sum + (inft.likes || 0), 0),
      comments: infts.reduce((sum, inft) => sum + (inft.comments || 0), 0),
      followers: Math.floor(Math.random() * 1000) + 100
    };
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Real-time Status */}
      {realTimeData && (
        <motion.div 
          className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-900">Live Data</span>
            </div>
            <span className="text-xs text-gray-600">Last updated: {realTimeData.lastUpdate}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-600">Current Interactions</p>
              <p className="text-lg font-bold text-blue-600">{realTimeData.currentInteractions}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Active Users</p>
              <p className="text-lg font-bold text-green-600">{realTimeData.activeUsers}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Network Load</p>
              <p className="text-lg font-bold text-purple-600">{realTimeData.networkLoad.toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {analyticsData && [
          {
            label: 'Total INFTs',
            value: analyticsData.totalINFTs,
            change: `+${analyticsData.growthRate.toFixed(1)}%`,
            icon: 'mdi:brain',
            color: 'from-blue-500 to-purple-500',
            changeColor: 'text-green-600'
          },
          {
            label: 'Engagement Score',
            value: analyticsData.engagementScore.toFixed(0),
            change: 'High',
            icon: 'mdi:heart',
            color: 'from-pink-500 to-red-500',
            changeColor: 'text-green-600'
          },
          {
            label: 'Performance Index',
            value: analyticsData.performanceIndex.toFixed(0),
            change: 'Excellent',
            icon: 'mdi:trending-up',
            color: 'from-green-500 to-emerald-500',
            changeColor: 'text-green-600'
          },
          {
            label: 'Revenue Generated',
            value: `$${analyticsData.revenueGenerated.toFixed(2)}`,
            change: '+12.5%',
            icon: 'mdi:currency-usd',
            color: 'from-yellow-500 to-orange-500',
            changeColor: 'text-green-600'
          },
          {
            label: 'Network Activity',
            value: analyticsData.marketplaceActivity,
            change: 'Active',
            icon: 'mdi:network',
            color: 'from-indigo-500 to-blue-500',
            changeColor: 'text-blue-600'
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                <Icon icon={metric.icon} className="w-4 h-4 text-white" />
              </div>
              <span className={`text-xs font-medium ${metric.changeColor}`}>
                {metric.change}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
            <p className="text-xl font-bold text-gray-900">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interaction Trends */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interaction Trends</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analyticsData?.interactionHistory.slice(-7).map((day, index) => (
              <motion.div
                key={day.date}
                className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg flex-1 min-w-0"
                style={{ height: `${(day.interactions / 100) * 100}%` }}
                initial={{ height: 0 }}
                animate={{ height: `${(day.interactions / 100) * 100}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            {analyticsData?.interactionHistory.slice(-7).map(day => (
              <span key={day.date}>{new Date(day.date).getDate()}</span>
            ))}
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-3">
            {analyticsData?.topPerformingINFTs.map((inft, index) => (
              <motion.div
                key={inft.tokenId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{inft.name}</p>
                    <p className="text-xs text-gray-600">{inft.interactions} interactions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    ${inft.revenue.toFixed(3)}
                  </span>
                  <Icon 
                    icon={inft.trend === 'up' ? 'mdi:trending-up' : inft.trend === 'down' ? 'mdi:trending-down' : 'mdi:minus'} 
                    className={`w-4 h-4 ${
                      inft.trend === 'up' ? 'text-green-500' : 
                      inft.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                    }`} 
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPredictionsTab = () => (
    <div className="space-y-6">
      {analyticsData && (
        <>
          {/* Prediction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Next Week Interactions',
                value: analyticsData.predictions.nextWeekInteractions,
                icon: 'mdi:calendar-week',
                color: 'from-blue-500 to-cyan-500',
                confidence: '85%'
              },
              {
                label: 'Next Month Revenue',
                value: `$${analyticsData.predictions.nextMonthRevenue.toFixed(2)}`,
                icon: 'mdi:currency-usd',
                color: 'from-green-500 to-emerald-500',
                confidence: '78%'
              },
              {
                label: 'Growth Forecast',
                value: `${analyticsData.predictions.growthForecast.toFixed(1)}%`,
                icon: 'mdi:trending-up',
                color: 'from-purple-500 to-pink-500',
                confidence: '72%'
              },
              {
                label: 'Risk Score',
                value: `${analyticsData.predictions.riskScore}/100`,
                icon: 'mdi:shield-check',
                color: 'from-orange-500 to-red-500',
                confidence: '90%'
              }
            ].map((prediction, index) => (
              <motion.div
                key={prediction.label}
                className="bg-white border border-gray-200 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${prediction.color} flex items-center justify-center`}>
                    <Icon icon={prediction.icon} className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {prediction.confidence} confidence
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{prediction.label}</p>
                <p className="text-2xl font-bold text-gray-900">{prediction.value}</p>
              </motion.div>
            ))}
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:robot" className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Optimization Recommendations</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Increase INFT interaction frequency by 15%</li>
                  <li>• Focus on high-performing categories</li>
                  <li>• Consider encryption for sensitive data</li>
                </ul>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Market Opportunities</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• NLP models showing 23% growth</li>
                  <li>• Computer Vision demand increasing</li>
                  <li>• New deployment opportunities available</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderNetworkTab = () => (
    <div className="space-y-6">
      {analyticsData && (
        <>
          {/* Network Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Models Deployed',
                value: analyticsData.networkStats.totalModelsDeployed,
                icon: 'mdi:rocket-launch',
                color: 'from-blue-500 to-indigo-500'
              },
              {
                label: 'Total Inferences',
                value: analyticsData.networkStats.totalInferences.toLocaleString(),
                icon: 'mdi:brain',
                color: 'from-green-500 to-teal-500'
              },
              {
                label: 'Network Utilization',
                value: `${analyticsData.networkStats.networkUtilization.toFixed(1)}%`,
                icon: 'mdi:server-network',
                color: 'from-purple-500 to-pink-500'
              },
              {
                label: 'Avg Response Time',
                value: `${analyticsData.networkStats.averageResponseTime.toFixed(0)}ms`,
                icon: 'mdi:speedometer',
                color: 'from-orange-500 to-red-500'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="bg-white border border-gray-200 rounded-xl p-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <Icon icon={stat.icon} className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Network Health */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Network Health Monitor</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray={`${analyticsData.networkStats.networkUtilization}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">
                      {analyticsData.networkStats.networkUtilization.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">CPU Usage</p>
                <p className="text-xs text-gray-600">Optimal</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray="75, 100"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">75%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">Memory Usage</p>
                <p className="text-xs text-gray-600">Good</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeDasharray="45, 100"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">45%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">Storage Usage</p>
                <p className="text-xs text-gray-600">Excellent</p>
              </div>
            </div>
          </div>
        </>
      )}
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Icon icon="mdi:chart-line" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enhanced Analytics Dashboard</h2>
              <p className="text-sm text-gray-600">Advanced insights and predictive analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Timeframe Selector */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Icon icon="mdi:close" className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: 'mdi:view-dashboard' },
            { id: 'performance', label: 'Performance', icon: 'mdi:trending-up' },
            { id: 'predictions', label: 'Predictions', icon: 'mdi:crystal-ball' },
            { id: 'network', label: 'Network', icon: 'mdi:network' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                selectedView === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
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
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {selectedView === 'overview' && renderOverviewTab()}
                {selectedView === 'predictions' && renderPredictionsTab()}
                {selectedView === 'network' && renderNetworkTab()}
                {selectedView === 'performance' && renderOverviewTab()} {/* Reuse overview for now */}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}