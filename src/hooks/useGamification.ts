import { useState, useEffect } from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: string;
  requirement: number;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface LeaderboardEntry {
  address: string;
  username?: string;
  score: number;
  level: number;
  rank: number;
}

export interface UserStats {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalPoints: number;
  achievementsUnlocked: number;
  globalRank: number;
  weeklyRank: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'token' | 'nft' | 'boost' | 'badge';
  amount?: number;
  duration?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  available: boolean;
  claimed: boolean;
  claimedAt?: Date;
  requirements: string[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  target: number;
  currentProgress: number;
  reward: number;
  startDate: string;
  endDate: string;
  joined: boolean;
  completed: boolean;
}

export interface GamificationStats {
  totalUsers: number;
  totalAchievements: number;
  totalRewardsClaimed: number;
  activeChallenges: number;
}

export const useGamification = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboards, setLeaderboards] = useState<{ [key: string]: LeaderboardEntry[] }>({});
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockAchievements: Achievement[] = [
    {
      id: 'first_inft',
      title: 'First Steps',
      description: 'Create your first INFT',
      type: 'first_inft',
      requirement: 1,
      points: 100,
      rarity: 'common',
      category: 'Getting Started',
      unlocked: true,
      unlockedAt: new Date('2024-01-15')
    },
    {
      id: 'knowledge_collector',
      title: 'Knowledge Collector',
      description: 'Add 10 knowledge entries to your INFTs',
      type: 'knowledge_collector',
      requirement: 10,
      points: 250,
      rarity: 'uncommon',
      category: 'Learning',
      unlocked: true,
      unlockedAt: new Date('2024-01-20')
    },
    {
      id: 'social_butterfly',
      title: 'Social Butterfly',
      description: 'Participate in 5 community challenges',
      type: 'social_butterfly',
      requirement: 5,
      points: 300,
      rarity: 'rare',
      category: 'Social',
      unlocked: false
    },
    {
      id: 'ai_trainer',
      title: 'AI Trainer',
      description: 'Train your INFT 50 times',
      type: 'ai_trainer',
      requirement: 50,
      points: 500,
      rarity: 'epic',
      category: 'Training',
      unlocked: false
    },
    {
      id: 'marketplace_trader',
      title: 'Marketplace Master',
      description: 'Complete 20 marketplace transactions',
      type: 'marketplace_trader',
      requirement: 20,
      points: 400,
      rarity: 'rare',
      category: 'Trading',
      unlocked: false
    },
    {
      id: 'governance_participant',
      title: 'Governance Guardian',
      description: 'Vote on 10 governance proposals',
      type: 'governance_participant',
      requirement: 10,
      points: 600,
      rarity: 'epic',
      category: 'Governance',
      unlocked: false
    },
    {
      id: 'staking_master',
      title: 'Staking Sage',
      description: 'Stake tokens for 30 consecutive days',
      type: 'staking_master',
      requirement: 30,
      points: 750,
      rarity: 'legendary',
      category: 'Staking',
      unlocked: false
    },
    {
      id: 'breeding_expert',
      title: 'Breeding Expert',
      description: 'Successfully breed 5 INFTs',
      type: 'breeding_expert',
      requirement: 5,
      points: 450,
      rarity: 'epic',
      category: 'Breeding',
      unlocked: false
    },
    {
      id: 'evolution_catalyst',
      title: 'Evolution Catalyst',
      description: 'Evolve an INFT to level 10',
      type: 'evolution_catalyst',
      requirement: 1,
      points: 800,
      rarity: 'legendary',
      category: 'Evolution',
      unlocked: false
    },
    {
      id: 'fusion_master',
      title: 'Fusion Master',
      description: 'Perform 3 successful INFT fusions',
      type: 'fusion_master',
      requirement: 3,
      points: 900,
      rarity: 'legendary',
      category: 'Fusion',
      unlocked: false
    }
  ];

  const mockLeaderboards = {
    overall: [
      { address: '0x1234...5678', username: 'CryptoMaster', score: 15420, level: 25, rank: 1 },
      { address: '0x2345...6789', username: 'AIEnthusiast', score: 14850, level: 24, rank: 2 },
      { address: '0x3456...7890', username: 'BlockchainPro', score: 13920, level: 22, rank: 3 },
      { address: '0x4567...8901', username: 'NFTCollector', score: 12750, level: 21, rank: 4 },
      { address: '0x5678...9012', username: 'DeFiTrader', score: 11680, level: 19, rank: 5 },
      { address: '0x6789...0123', username: 'SmartContract', score: 10950, level: 18, rank: 6 },
      { address: '0x7890...1234', username: 'MetaverseFan', score: 9820, level: 17, rank: 7 },
      { address: '0x8901...2345', username: 'GameFiPlayer', score: 8750, level: 16, rank: 8 },
      { address: '0x9012...3456', username: 'DAOGovernor', score: 7680, level: 15, rank: 9 },
      { address: '0x0123...4567', username: 'StakingGuru', score: 6590, level: 14, rank: 10 }
    ],
    trading: [
      { address: '0x2345...6789', username: 'AIEnthusiast', score: 2450000, level: 24, rank: 1 },
      { address: '0x1234...5678', username: 'CryptoMaster', score: 2120000, level: 25, rank: 2 },
      { address: '0x4567...8901', username: 'NFTCollector', score: 1890000, level: 21, rank: 3 },
      { address: '0x5678...9012', username: 'DeFiTrader', score: 1650000, level: 19, rank: 4 },
      { address: '0x3456...7890', username: 'BlockchainPro', score: 1420000, level: 22, rank: 5 }
    ],
    staking: [
      { address: '0x0123...4567', username: 'StakingGuru', score: 500000, level: 14, rank: 1 },
      { address: '0x9012...3456', username: 'DAOGovernor', score: 450000, level: 15, rank: 2 },
      { address: '0x1234...5678', username: 'CryptoMaster', score: 420000, level: 25, rank: 3 },
      { address: '0x6789...0123', username: 'SmartContract', score: 380000, level: 18, rank: 4 },
      { address: '0x2345...6789', username: 'AIEnthusiast', score: 350000, level: 24, rank: 5 }
    ],
    social: [
      { address: '0x7890...1234', username: 'MetaverseFan', score: 1250, level: 17, rank: 1 },
      { address: '0x8901...2345', username: 'GameFiPlayer', score: 1180, level: 16, rank: 2 },
      { address: '0x2345...6789', username: 'AIEnthusiast', score: 1050, level: 24, rank: 3 },
      { address: '0x4567...8901', username: 'NFTCollector', score: 980, level: 21, rank: 4 },
      { address: '0x1234...5678', username: 'CryptoMaster', score: 920, level: 25, rank: 5 }
    ]
  };

  const mockUserStats: UserStats = {
    level: 12,
    currentXP: 2450,
    xpToNextLevel: 3000,
    totalPoints: 8750,
    achievementsUnlocked: 2,
    globalRank: 156,
    weeklyRank: 23
  };

  const mockRewards: Reward[] = [
    {
      id: 'daily_bonus',
      title: 'Daily Login Bonus',
      description: 'Claim your daily INTL tokens',
      type: 'token',
      amount: 10,
      rarity: 'common',
      available: true,
      claimed: false,
      requirements: ['Login daily']
    },
    {
      id: 'achievement_nft',
      title: 'Achievement Badge NFT',
      description: 'Special NFT for completing 5 achievements',
      type: 'nft',
      rarity: 'rare',
      available: false,
      claimed: false,
      requirements: ['Complete 5 achievements']
    },
    {
      id: 'xp_boost',
      title: '2x XP Boost',
      description: 'Double XP for 24 hours',
      type: 'boost',
      duration: 24,
      rarity: 'uncommon',
      available: true,
      claimed: false,
      requirements: ['Reach level 10']
    },
    {
      id: 'legendary_badge',
      title: 'Legendary Contributor',
      description: 'Exclusive badge for top contributors',
      type: 'badge',
      rarity: 'legendary',
      available: false,
      claimed: false,
      requirements: ['Top 10 global ranking', 'Complete legendary achievement']
    },
    {
      id: 'weekly_tokens',
      title: 'Weekly Reward Pool',
      description: 'Share of weekly reward distribution',
      type: 'token',
      amount: 100,
      rarity: 'epic',
      available: true,
      claimed: true,
      claimedAt: new Date('2024-01-22'),
      requirements: ['Active participation']
    }
  ];

  const mockChallenges: Challenge[] = [
    {
      id: 'daily_training',
      title: 'Daily AI Training',
      description: 'Train your INFT 3 times today',
      type: 'daily',
      target: 3,
      currentProgress: 1,
      reward: 50,
      startDate: '2024-01-25T00:00:00Z',
      endDate: '2024-01-25T23:59:59Z',
      joined: true,
      completed: false
    },
    {
      id: 'weekly_social',
      title: 'Social Engagement',
      description: 'Interact with 10 community members this week',
      type: 'weekly',
      target: 10,
      currentProgress: 4,
      reward: 200,
      startDate: '2024-01-22T00:00:00Z',
      endDate: '2024-01-28T23:59:59Z',
      joined: true,
      completed: false
    },
    {
      id: 'monthly_trader',
      title: 'Marketplace Trader',
      description: 'Complete 15 marketplace transactions this month',
      type: 'monthly',
      target: 15,
      currentProgress: 7,
      reward: 500,
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
      joined: true,
      completed: false
    },
    {
      id: 'special_evolution',
      title: 'Evolution Master',
      description: 'Evolve 2 INFTs during the special event',
      type: 'special',
      target: 2,
      currentProgress: 0,
      reward: 750,
      startDate: '2024-01-20T00:00:00Z',
      endDate: '2024-02-05T23:59:59Z',
      joined: false,
      completed: false
    },
    {
      id: 'governance_vote',
      title: 'Governance Participation',
      description: 'Vote on 3 active proposals',
      type: 'weekly',
      target: 3,
      currentProgress: 1,
      reward: 300,
      startDate: '2024-01-22T00:00:00Z',
      endDate: '2024-01-28T23:59:59Z',
      joined: false,
      completed: false
    }
  ];

  useEffect(() => {
    const loadGamificationData = async () => {
      try {
        setLoading(true);
        
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setAchievements(mockAchievements);
        setLeaderboards(mockLeaderboards);
        setUserStats(mockUserStats);
        setRewards(mockRewards);
        setChallenges(mockChallenges);
        
        setError(null);
      } catch (err) {
        setError('Failed to load gamification data');
        console.error('Error loading gamification data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGamificationData();
  }, []);

  const claimReward = async (rewardId: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRewards(prev => prev.map(reward => 
        reward.id === rewardId 
          ? { ...reward, claimed: true, claimedAt: new Date() }
          : reward
      ));
      
      // Update user stats
      const reward = rewards.find(r => r.id === rewardId);
      if (reward && reward.type === 'token' && reward.amount) {
        setUserStats(prev => prev ? {
          ...prev,
          totalPoints: prev.totalPoints + (reward.amount || 0)
        } : null);
      }
    } catch (error) {
      throw new Error('Failed to claim reward');
    }
  };

  const joinChallenge = async (challengeId: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setChallenges(prev => prev.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, joined: true }
          : challenge
      ));
    } catch (error) {
      throw new Error('Failed to join challenge');
    }
  };

  const getUserRank = (leaderboardType: string = 'overall'): number | null => {
    if (!userStats) return null;
    
    const userAddress = '0x1234...5678'; // Mock user address
    const leaderboard = leaderboards[leaderboardType];
    if (!leaderboard) return null;
    
    const userEntry = leaderboard.find(entry => entry.address === userAddress);
    return userEntry?.rank || null;
  };

  const getAchievementProgress = (achievementId: string): number => {
    // Mock progress data based on achievement type
    const progressMap: { [key: string]: number } = {
      'first_inft': 1,
      'knowledge_collector': 7,
      'social_butterfly': 2,
      'ai_trainer': 23,
      'marketplace_trader': 8,
      'governance_participant': 3,
      'staking_master': 12,
      'breeding_expert': 1,
      'evolution_catalyst': 0,
      'fusion_master': 0
    };
    
    return progressMap[achievementId] || 0;
  };

  const getGamificationStats = (): GamificationStats => {
    return {
      totalUsers: 15420,
      totalAchievements: achievements.length,
      totalRewardsClaimed: rewards.filter(r => r.claimed).length,
      activeChallenges: challenges.filter(c => !c.completed).length
    };
  };

  return {
    achievements,
    leaderboards,
    userStats,
    rewards,
    challenges,
    loading,
    error,
    claimReward,
    joinChallenge,
    getUserRank,
    getAchievementProgress,
    getGamificationStats
  };
};