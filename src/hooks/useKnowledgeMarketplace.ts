import { useState, useEffect } from 'react';

export interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  type: 'dataset' | 'research' | 'model' | 'insight' | 'tutorial';
  price: number;
  currency: 'INFY' | 'ETH';
  seller: string;
  sellerAddress: string;
  rating: number;
  reviews: number;
  downloads: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  fileSize?: string;
  format?: string;
  license: 'MIT' | 'Apache' | 'Commercial' | 'Creative Commons';
  preview?: string;
  featured: boolean;
  verified: boolean;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  language?: string;
  framework?: string;
}

export interface Purchase {
  id: string;
  itemId: string;
  itemTitle: string;
  itemType: string;
  price: number;
  currency: string;
  buyerAddress: string;
  sellerAddress: string;
  purchasedAt: Date;
  downloadUrl: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transactionHash?: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt?: Date;
}

export interface MarketplaceStats {
  totalItems: number;
  totalVolume: number;
  totalUsers: number;
  averagePrice: number;
  topCategories: Array<{
    category: string;
    count: number;
    volume: number;
  }>;
  recentSales: Array<{
    itemTitle: string;
    price: number;
    currency: string;
    soldAt: Date;
  }>;
}

export interface ListingForm {
  title: string;
  description: string;
  type: 'dataset' | 'research' | 'model' | 'insight' | 'tutorial';
  price: number;
  currency: 'INFY' | 'ETH';
  tags: string[];
  license: 'MIT' | 'Apache' | 'Commercial' | 'Creative Commons';
  fileSize: string;
  format: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  language?: string;
  framework?: string;
  preview?: string;
}

export interface Review {
  id: string;
  itemId: string;
  reviewerAddress: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
  verified: boolean;
}

export interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  totalSales: number;
  averageRating: number;
  topSellingItems: Array<{
    id: string;
    title: string;
    sales: number;
    revenue: number;
  }>;
  earningsHistory: Array<{
    date: Date;
    amount: number;
    currency: string;
  }>;
}

export const useKnowledgeMarketplace = () => {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [userPurchases, setUserPurchases] = useState<Purchase[]>([]);
  const [userListings, setUserListings] = useState<KnowledgeItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<KnowledgeItem[]>([]);
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats | null>(null);
  const [userEarnings, setUserEarnings] = useState<EarningsData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockKnowledgeItems: KnowledgeItem[] = [
    {
      id: '1',
      title: 'Advanced Computer Vision Dataset',
      description: 'Comprehensive dataset with 100K+ labeled images for object detection, segmentation, and classification tasks. Includes rare objects and edge cases.',
      type: 'dataset',
      price: 299.99,
      currency: 'INFY',
      seller: 'Dr. Sarah Chen',
      sellerAddress: '0x1234...5678',
      rating: 4.8,
      reviews: 127,
      downloads: 1543,
      tags: ['Computer Vision', 'Object Detection', 'Deep Learning', 'PyTorch'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      fileSize: '15.2 GB',
      format: 'COCO, YOLO',
      license: 'Commercial',
      featured: true,
      verified: true,
      category: 'Computer Vision',
      difficulty: 'Advanced',
      language: 'Python',
      framework: 'PyTorch'
    },
    {
      id: '2',
      title: 'Transformer Architecture Research Paper',
      description: 'Novel transformer architecture achieving SOTA results on multiple NLP benchmarks. Includes implementation details and training strategies.',
      type: 'research',
      price: 49.99,
      currency: 'INFY',
      seller: 'Prof. Michael Zhang',
      sellerAddress: '0x2345...6789',
      rating: 4.9,
      reviews: 89,
      downloads: 2341,
      tags: ['NLP', 'Transformers', 'Research', 'BERT', 'Attention'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-12'),
      fileSize: '2.1 MB',
      format: 'PDF, LaTeX',
      license: 'Creative Commons',
      featured: true,
      verified: true,
      category: 'Natural Language Processing',
      difficulty: 'Advanced',
      language: 'Python'
    },
    {
      id: '3',
      title: 'Pre-trained GPT-4 Fine-tuned Model',
      description: 'GPT-4 model fine-tuned on domain-specific data for enhanced performance in technical documentation generation.',
      type: 'model',
      price: 899.99,
      currency: 'ETH',
      seller: 'AI Research Lab',
      sellerAddress: '0x3456...7890',
      rating: 4.7,
      reviews: 45,
      downloads: 234,
      tags: ['GPT-4', 'Fine-tuning', 'Language Model', 'Text Generation'],
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-08'),
      fileSize: '6.8 GB',
      format: 'PyTorch, ONNX',
      license: 'Commercial',
      featured: false,
      verified: true,
      category: 'Language Models',
      difficulty: 'Intermediate',
      language: 'Python',
      framework: 'Transformers'
    },
    {
      id: '4',
      title: 'Market Sentiment Analysis Insights',
      description: 'Comprehensive analysis of cryptocurrency market sentiment using social media data and news articles. Includes predictive models.',
      type: 'insight',
      price: 79.99,
      currency: 'INFY',
      seller: 'CryptoAnalytics',
      sellerAddress: '0x4567...8901',
      rating: 4.6,
      reviews: 156,
      downloads: 892,
      tags: ['Sentiment Analysis', 'Cryptocurrency', 'Social Media', 'Prediction'],
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-15'),
      fileSize: '45.3 MB',
      format: 'JSON, CSV',
      license: 'MIT',
      featured: false,
      verified: true,
      category: 'Financial Analysis',
      difficulty: 'Intermediate',
      language: 'Python'
    },
    {
      id: '5',
      title: 'Deep Learning Fundamentals Tutorial Series',
      description: 'Complete tutorial series covering deep learning from basics to advanced topics. Includes code examples, exercises, and projects.',
      type: 'tutorial',
      price: 129.99,
      currency: 'INFY',
      seller: 'EduTech Solutions',
      sellerAddress: '0x5678...9012',
      rating: 4.9,
      reviews: 312,
      downloads: 1876,
      tags: ['Deep Learning', 'Tutorial', 'Education', 'Neural Networks'],
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-18'),
      fileSize: '1.2 GB',
      format: 'Video, PDF, Code',
      license: 'Creative Commons',
      featured: true,
      verified: true,
      category: 'Education',
      difficulty: 'Beginner',
      language: 'Python',
      framework: 'TensorFlow'
    }
  ];

  const mockPurchases: Purchase[] = [
    {
      id: 'p1',
      itemId: '1',
      itemTitle: 'Advanced Computer Vision Dataset',
      itemType: 'dataset',
      price: 299.99,
      currency: 'INFY',
      buyerAddress: '0x9876...5432',
      sellerAddress: '0x1234...5678',
      purchasedAt: new Date('2024-01-20'),
      downloadUrl: 'https://marketplace.intellify.com/downloads/p1',
      status: 'completed',
      transactionHash: '0xabcd...1234',
      downloadCount: 3,
      maxDownloads: 5,
      expiresAt: new Date('2024-07-20')
    },
    {
      id: 'p2',
      itemId: '2',
      itemTitle: 'Transformer Architecture Research Paper',
      itemType: 'research',
      price: 49.99,
      currency: 'INFY',
      buyerAddress: '0x9876...5432',
      sellerAddress: '0x2345...6789',
      purchasedAt: new Date('2024-01-18'),
      downloadUrl: 'https://marketplace.intellify.com/downloads/p2',
      status: 'completed',
      transactionHash: '0xefgh...5678',
      downloadCount: 1,
      maxDownloads: 10
    }
  ];

  const mockStats: MarketplaceStats = {
    totalItems: 1247,
    totalVolume: 2456789.45,
    totalUsers: 8934,
    averagePrice: 156.78,
    topCategories: [
      { category: 'Computer Vision', count: 234, volume: 567890.12 },
      { category: 'Natural Language Processing', count: 189, volume: 445632.89 },
      { category: 'Machine Learning', count: 156, volume: 334521.67 },
      { category: 'Data Science', count: 134, volume: 289456.34 }
    ],
    recentSales: [
      { itemTitle: 'Advanced Computer Vision Dataset', price: 299.99, currency: 'INFY', soldAt: new Date() },
      { itemTitle: 'NLP Preprocessing Toolkit', price: 89.99, currency: 'INFY', soldAt: new Date() },
      { itemTitle: 'Time Series Analysis Model', price: 199.99, currency: 'ETH', soldAt: new Date() }
    ]
  };

  const mockEarnings: EarningsData = {
    totalEarnings: 4567.89,
    monthlyEarnings: 892.34,
    totalSales: 23,
    averageRating: 4.7,
    topSellingItems: [
      { id: '1', title: 'Advanced Computer Vision Dataset', sales: 8, revenue: 2399.92 },
      { id: '5', title: 'Deep Learning Tutorial Series', sales: 6, revenue: 779.94 }
    ],
    earningsHistory: [
      { date: new Date('2024-01-01'), amount: 299.99, currency: 'INFY' },
      { date: new Date('2024-01-05'), amount: 129.99, currency: 'INFY' },
      { date: new Date('2024-01-10'), amount: 49.99, currency: 'INFY' }
    ]
  };

  // Initialize data
  useEffect(() => {
    setKnowledgeItems(mockKnowledgeItems);
    setUserPurchases(mockPurchases);
    setUserListings(mockKnowledgeItems.slice(0, 2)); // User's own listings
    setFeaturedItems(mockKnowledgeItems.filter(item => item.featured));
    setMarketplaceStats(mockStats);
    setUserEarnings(mockEarnings);
  }, []);

  // Purchase an item
  const purchaseItem = async (itemId: string, price: number, currency: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const item = knowledgeItems.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');
      
      const newPurchase: Purchase = {
        id: `p${Date.now()}`,
        itemId,
        itemTitle: item.title,
        itemType: item.type,
        price,
        currency,
        buyerAddress: '0x9876...5432',
        sellerAddress: item.sellerAddress,
        purchasedAt: new Date(),
        downloadUrl: `https://marketplace.intellify.com/downloads/p${Date.now()}`,
        status: 'completed',
        transactionHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
        downloadCount: 0,
        maxDownloads: 5
      };
      
      setUserPurchases(prev => [newPurchase, ...prev]);
      
      // Update item download count
      setKnowledgeItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, downloads: item.downloads + 1 }
          : item
      ));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // List a new item
  const listItem = async (listing: ListingForm): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newItem: KnowledgeItem = {
        id: `item_${Date.now()}`,
        title: listing.title,
        description: listing.description,
        type: listing.type,
        price: listing.price,
        currency: listing.currency,
        seller: 'You',
        sellerAddress: '0x9876...5432',
        rating: 0,
        reviews: 0,
        downloads: 0,
        tags: listing.tags,
        createdAt: new Date(),
        updatedAt: new Date(),
        fileSize: listing.fileSize,
        format: listing.format,
        license: listing.license,
        featured: false,
        verified: false,
        category: listing.category,
        difficulty: listing.difficulty,
        language: listing.language,
        framework: listing.framework,
        preview: listing.preview
      };
      
      setKnowledgeItems(prev => [newItem, ...prev]);
      setUserListings(prev => [newItem, ...prev]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Listing failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Rate an item
  const rateItem = async (itemId: string, rating: number, comment: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newReview: Review = {
        id: `review_${Date.now()}`,
        itemId,
        reviewerAddress: '0x9876...5432',
        reviewerName: 'You',
        rating,
        comment,
        createdAt: new Date(),
        helpful: 0,
        verified: true
      };
      
      setReviews(prev => [newReview, ...prev]);
      
      // Update item rating
      setKnowledgeItems(prev => prev.map(item => {
        if (item.id === itemId) {
          const newReviewCount = item.reviews + 1;
          const newRating = ((item.rating * item.reviews) + rating) / newReviewCount;
          return {
            ...item,
            rating: Math.round(newRating * 10) / 10,
            reviews: newReviewCount
          };
        }
        return item;
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rating failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search items
  const searchItems = async (query: string, filters?: {
    type?: string;
    priceRange?: [number, number];
    rating?: number;
  }): Promise<KnowledgeItem[]> => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let results = knowledgeItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      
      if (filters?.type && filters.type !== 'all') {
        results = results.filter(item => item.type === filters.type);
      }
      
      if (filters?.priceRange) {
        results = results.filter(item => 
          item.price >= filters.priceRange![0] && item.price <= filters.priceRange![1]
        );
      }
      
      if (filters?.rating) {
        results = results.filter(item => item.rating >= filters.rating!);
      }
      
      return results;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get items by category
  const getItemsByCategory = async (category: string): Promise<KnowledgeItem[]> => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (category === 'all') {
        return knowledgeItems;
      }
      
      return knowledgeItems.filter(item => 
        item.type === category || item.category === category
      );
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get trending items
  const getTrendingItems = async (): Promise<KnowledgeItem[]> => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return knowledgeItems
        .sort((a, b) => (b.downloads * b.rating) - (a.downloads * a.rating))
        .slice(0, 10);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trending items');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get user's earnings data
  const getUserEarnings = async (): Promise<EarningsData | null> => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return userEarnings;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch earnings');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get marketplace statistics
  const getMarketplaceStats = async (): Promise<MarketplaceStats | null> => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return marketplaceStats;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Download purchased item
  const downloadItem = async (purchaseId: string): Promise<string> => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const purchase = userPurchases.find(p => p.id === purchaseId);
      if (!purchase) throw new Error('Purchase not found');
      
      if (purchase.downloadCount >= purchase.maxDownloads) {
        throw new Error('Download limit exceeded');
      }
      
      // Update download count
      setUserPurchases(prev => prev.map(p => 
        p.id === purchaseId 
          ? { ...p, downloadCount: p.downloadCount + 1 }
          : p
      ));
      
      return purchase.downloadUrl;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    // Data
    knowledgeItems,
    userPurchases,
    userListings,
    featuredItems,
    marketplaceStats,
    userEarnings,
    reviews,
    loading,
    error,
    
    // Actions
    purchaseItem,
    listItem,
    rateItem,
    searchItems,
    getItemsByCategory,
    getTrendingItems,
    getUserEarnings,
    getMarketplaceStats,
    downloadItem,
    
    // Utilities
    clearError: () => setError(null)
  };
};