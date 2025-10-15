'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useWallet } from './WalletProvider';
import { useKnowledgeMarketplace } from '../hooks/useKnowledgeMarketplace';

interface KnowledgeMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  type: 'dataset' | 'research' | 'model' | 'insight' | 'tutorial';
  price: number;
  currency: 'INFY' | 'ETH';
  seller: string;
  rating: number;
  reviews: number;
  downloads: number;
  tags: string[];
  createdAt: Date;
  fileSize?: string;
  format?: string;
  license: 'MIT' | 'Apache' | 'Commercial' | 'Creative Commons';
  preview?: string;
  featured: boolean;
}

interface Purchase {
  id: string;
  itemId: string;
  itemTitle: string;
  price: number;
  currency: string;
  purchasedAt: Date;
  downloadUrl: string;
  status: 'completed' | 'pending' | 'failed';
}

const KnowledgeMarketplace: React.FC<KnowledgeMarketplaceProps> = ({ isOpen, onClose }) => {
  const { wallet } = useWallet();
  const isConnected = wallet.isConnected;
  const address = wallet.address;
  const {
    knowledgeItems,
    userPurchases,
    userListings,
    featuredItems,
    purchaseItem,
    listItem,
    rateItem,
    searchItems,
    getItemsByCategory,
    loading
  } = useKnowledgeMarketplace();

  const [activeTab, setActiveTab] = useState<'browse' | 'sell' | 'purchases' | 'analytics'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price-low' | 'price-high' | 'rating'>('newest');
  const [showListingModal, setShowListingModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  // Listing form state
  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    type: 'dataset' as const,
    price: 0,
    currency: 'INFY' as const,
    tags: [] as string[],
    license: 'MIT' as const,
    fileSize: '',
    format: ''
  });

  const categories = [
    { id: 'all', label: 'All Categories', icon: 'mdi:view-grid' },
    { id: 'dataset', label: 'Datasets', icon: 'mdi:database' },
    { id: 'research', label: 'Research Papers', icon: 'mdi:file-document' },
    { id: 'model', label: 'AI Models', icon: 'mdi:brain' },
    { id: 'insight', label: 'Insights', icon: 'mdi:lightbulb' },
    { id: 'tutorial', label: 'Tutorials', icon: 'mdi:school' }
  ];

  const itemTypes = ['dataset', 'research', 'model', 'insight', 'tutorial'];
  const currencies = ['INFY', 'ETH'];
  const licenses = ['MIT', 'Apache', 'Commercial', 'Creative Commons'];
  const popularTags = ['Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'Data Science', 'PyTorch', 'TensorFlow', 'Python'];

  // Filter and sort items
  const filteredItems = knowledgeItems
    .filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'popular':
          return b.downloads - a.downloads;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const handlePurchase = async (item: KnowledgeItem) => {
    if (!isConnected || !address) return;
    
    try {
      await purchaseItem(item.id, item.price, item.currency);
      setShowPurchaseModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const handleListItem = async () => {
    if (!isConnected || !address) return;
    
    try {
      await listItem({
        ...listingForm,
        category: 'AI Models',
        difficulty: 'Intermediate'
      });
      setShowListingModal(false);
      setListingForm({
        title: '',
        description: '',
        type: 'dataset',
        price: 0,
        currency: 'INFY',
        tags: [],
        license: 'MIT',
        fileSize: '',
        format: ''
      });
    } catch (error) {
      console.error('Listing failed:', error);
    }
  };

  const addTag = (tag: string) => {
    if (!listingForm.tags.includes(tag)) {
      setListingForm({
        ...listingForm,
        tags: [...listingForm.tags, tag]
      });
    }
  };

  const removeTag = (tag: string) => {
    setListingForm({
      ...listingForm,
      tags: listingForm.tags.filter(t => t !== tag)
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Icon icon="mdi:store" className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Marketplace</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Icon icon="mdi:close" className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'browse', label: 'Browse', icon: 'mdi:magnify' },
              { id: 'sell', label: 'Sell Knowledge', icon: 'mdi:upload' },
              { id: 'purchases', label: 'My Purchases', icon: 'mdi:shopping' },
              { id: 'analytics', label: 'Analytics', icon: 'mdi:chart-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon icon={tab.icon} className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!isConnected ? (
              <div className="text-center py-12">
                <Icon icon="mdi:wallet" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect your wallet to access the Knowledge Marketplace.
                </p>
              </div>
            ) : (
              <>
                {/* Browse Tab */}
                {activeTab === 'browse' && (
                  <div className="p-6">
                    {/* Search and Filters */}
                    <div className="mb-6 space-y-4">
                      <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            placeholder="Search knowledge items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="newest">Newest First</option>
                          <option value="popular">Most Popular</option>
                          <option value="price-low">Price: Low to High</option>
                          <option value="price-high">Price: High to Low</option>
                          <option value="rating">Highest Rated</option>
                        </select>
                      </div>

                      {/* Category Filters */}
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                              selectedCategory === category.id
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            <Icon icon={category.icon} className="w-4 h-4" />
                            <span>{category.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Featured Items */}
                    {featuredItems.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Featured Items</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {featuredItems.slice(0, 3).map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-xl p-6 border-2 border-green-200 dark:border-green-700"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Icon icon="mdi:star" className="w-5 h-5 text-yellow-500" />
                                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Featured</span>
                                </div>
                                <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                                  {item.type}
                                </span>
                              </div>
                              
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {item.title}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                {item.description}
                              </p>
                              
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Icon icon="mdi:star" className="w-4 h-4 text-yellow-500" />
                                    <span>{item.rating}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Icon icon="mdi:download" className="w-4 h-4" />
                                    <span>{item.downloads}</span>
                                  </div>
                                </div>
                                <div className="text-lg font-bold text-green-600">
                                  {item.price} {item.currency}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowPurchaseModal(true);
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
                              >
                                Purchase
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                              {item.type}
                            </span>
                            {item.featured && (
                              <Icon icon="mdi:star" className="w-5 h-5 text-yellow-500" />
                            )}
                          </div>
                          
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {item.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                            {item.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mb-4">
                            {item.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{item.tags.length - 3}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1">
                                <Icon icon="mdi:star" className="w-4 h-4 text-yellow-500" />
                                <span>{item.rating}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Icon icon="mdi:download" className="w-4 h-4" />
                                <span>{item.downloads}</span>
                              </div>
                            </div>
                            {item.fileSize && (
                              <span className="text-xs">{item.fileSize}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-green-600">
                              {item.price} {item.currency}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setShowPurchaseModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              Buy
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sell Tab */}
                {activeTab === 'sell' && (
                  <div className="p-6">
                    <div className="max-w-2xl mx-auto">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Share Your Knowledge
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Monetize your AI expertise by selling datasets, research, models, and insights.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowListingModal(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-medium mb-8 transition-colors"
                      >
                        <Icon icon="mdi:plus" className="w-5 h-5 inline mr-2" />
                        Create New Listing
                      </button>

                      {/* User's Listings */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Your Listings ({userListings.length})
                        </h4>
                        
                        {userListings.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Icon icon="mdi:package-variant" className="w-12 h-12 mx-auto mb-2" />
                            <p>No listings yet. Create your first listing to start earning!</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {userListings.map((item) => (
                              <div
                                key={item.id}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900 dark:text-white">
                                      {item.title}
                                    </h5>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                      {item.description}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                      <span>{item.downloads} downloads</span>
                                      <span>{item.rating} ⭐</span>
                                      <span>{item.price} {item.currency}</span>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg">
                                      <Icon icon="mdi:pencil" className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg">
                                      <Icon icon="mdi:delete" className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Purchases Tab */}
                {activeTab === 'purchases' && (
                  <div className="p-6">
                    <div className="max-w-4xl mx-auto">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Your Purchases ({userPurchases.length})
                      </h3>
                      
                      {userPurchases.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Icon icon="mdi:shopping-outline" className="w-16 h-16 mx-auto mb-4" />
                          <h4 className="text-lg font-medium mb-2">No purchases yet</h4>
                          <p>Browse the marketplace to find valuable knowledge items.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {userPurchases.map((purchase) => (
                            <div
                              key={purchase.id}
                              className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {purchase.itemTitle}
                                  </h4>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                    <span>Purchased: {purchase.purchasedAt.toLocaleDateString()}</span>
                                    <span>{purchase.price} {purchase.currency}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {purchase.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  {purchase.status === 'completed' && (
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                                      <Icon icon="mdi:download" className="w-4 h-4 inline mr-1" />
                                      Download
                                    </button>
                                  )}
                                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                                    <Icon icon="mdi:star" className="w-4 h-4 inline mr-1" />
                                    Rate
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="p-6">
                    <div className="max-w-6xl mx-auto">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Marketplace Analytics
                      </h3>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                          { label: 'Total Items', value: knowledgeItems.length, icon: 'mdi:package-variant', color: 'blue' },
                          { label: 'Your Listings', value: userListings.length, icon: 'mdi:upload', color: 'green' },
                          { label: 'Your Purchases', value: userPurchases.length, icon: 'mdi:shopping', color: 'purple' },
                          { label: 'Total Revenue', value: '$2,450', icon: 'mdi:currency-usd', color: 'yellow' }
                        ].map((stat, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                              </div>
                              <div className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900`}>
                                <Icon icon={stat.icon} className={`w-6 h-6 text-${stat.color}-600`} />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Category Distribution */}
                      <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Category Distribution
                        </h4>
                        <div className="space-y-3">
                          {categories.slice(1).map((category) => {
                            const count = knowledgeItems.filter(item => item.type === category.id).length;
                            const percentage = knowledgeItems.length > 0 ? (count / knowledgeItems.length) * 100 : 0;
                            
                            return (
                              <div key={category.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Icon icon={category.icon} className="w-5 h-5 text-gray-500" />
                                  <span className="text-gray-900 dark:text-white">{category.label}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Purchase Modal */}
        {showPurchaseModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
            onClick={() => setShowPurchaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Purchase Confirmation</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{selectedItem.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedItem.description}</p>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="font-medium">Price:</span>
                  <span className="text-lg font-bold text-green-600">
                    {selectedItem.price} {selectedItem.currency}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePurchase(selectedItem)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Purchase
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Listing Modal */}
        {showListingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
            onClick={() => setShowListingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-6">Create New Listing</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={listingForm.title}
                      onChange={(e) => setListingForm({...listingForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Knowledge item title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={listingForm.type}
                      onChange={(e) => setListingForm({...listingForm, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {itemTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={listingForm.description}
                    onChange={(e) => setListingForm({...listingForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-24 resize-none"
                    placeholder="Describe your knowledge item..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={listingForm.price}
                      onChange={(e) => setListingForm({...listingForm, price: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <select
                      value={listingForm.currency}
                      onChange={(e) => setListingForm({...listingForm, currency: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {currencies.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">License</label>
                    <select
                      value={listingForm.license}
                      onChange={(e) => setListingForm({...listingForm, license: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {licenses.map(license => (
                        <option key={license} value={license}>{license}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">File Size</label>
                    <input
                      type="text"
                      value={listingForm.fileSize}
                      onChange={(e) => setListingForm({...listingForm, fileSize: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="e.g., 2.5 GB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Format</label>
                    <input
                      type="text"
                      value={listingForm.format}
                      onChange={(e) => setListingForm({...listingForm, format: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="e.g., CSV, JSON, PDF"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {listingForm.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Icon icon="mdi:close" className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.filter(tag => !listingForm.tags.includes(tag)).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowListingModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleListItem}
                    disabled={!listingForm.title || !listingForm.description || listingForm.price <= 0}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    Create Listing
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default KnowledgeMarketplace;