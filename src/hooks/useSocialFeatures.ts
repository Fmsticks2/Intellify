import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../components/WalletProvider';

interface SharedINFT {
  id: string;
  name: string;
  description: string;
  owner: string;
  sharedAt: Date;
  likes: number;
  comments: number;
  category: string;
  isLiked: boolean;
  imageUrl?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  creator: string;
  participants: number;
  reward: string;
  deadline: Date;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Active' | 'Completed' | 'Upcoming';
  category: string;
}

interface CollaborativeProject {
  id: string;
  title: string;
  description: string;
  creator: string;
  collaborators: string[];
  progress: number;
  targetGoal: string;
  createdAt: Date;
  status: 'Open' | 'In Progress' | 'Completed';
  requiredSkills: string[];
}

interface ChallengeForm {
  title: string;
  description: string;
  reward: string;
  deadline: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
}

interface CollaborationForm {
  title: string;
  description: string;
  targetGoal: string;
  requiredSkills: string[];
  maxCollaborators: number;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: number;
}

interface SocialStats {
  totalShares: number;
  totalLikes: number;
  totalComments: number;
  activeChallenges: number;
  completedChallenges: number;
  activeCollaborations: number;
  communityRank: number;
  reputationScore: number;
}

export const useSocialFeatures = () => {
  const { wallet } = useWallet();
  const address = wallet.address;
  const isConnected = wallet.isConnected;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for social data
  const [sharedINFTs, setSharedINFTs] = useState<SharedINFT[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [collaborativeProjects, setCollaborativeProjects] = useState<CollaborativeProject[]>([]);
  const [socialStats, setSocialStats] = useState<SocialStats>({
    totalShares: 0,
    totalLikes: 0,
    totalComments: 0,
    activeChallenges: 0,
    completedChallenges: 0,
    activeCollaborations: 0,
    communityRank: 0,
    reputationScore: 0
  });

  // Mock data for demonstration
  const generateMockData = useCallback(() => {
    const mockSharedINFTs: SharedINFT[] = [
      {
        id: '1',
        name: 'Advanced Neural Network',
        description: 'A sophisticated neural network trained on computer vision tasks. Achieved 95% accuracy on image classification.',
        owner: '0x1234...5678',
        sharedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        likes: 24,
        comments: 8,
        category: 'Computer Vision',
        isLiked: false,
        imageUrl: '/api/placeholder/300/200'
      },
      {
        id: '2',
        name: 'NLP Sentiment Analyzer',
        description: 'Real-time sentiment analysis model for social media content. Supports multiple languages and emoji interpretation.',
        owner: '0x9876...4321',
        sharedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        likes: 18,
        comments: 12,
        category: 'NLP',
        isLiked: true,
        imageUrl: '/api/placeholder/300/200'
      },
      {
        id: '3',
        name: 'Reinforcement Learning Agent',
        description: 'Game-playing AI that masters complex strategy games through self-play and reinforcement learning.',
        owner: '0x5555...7777',
        sharedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        likes: 31,
        comments: 15,
        category: 'AI Training',
        isLiked: false,
        imageUrl: '/api/placeholder/300/200'
      }
    ];

    const mockChallenges: Challenge[] = [
      {
        id: '1',
        title: 'Image Classification Challenge',
        description: 'Build the most accurate image classifier for a custom dataset of 10,000 images across 50 categories.',
        creator: '0x1111...2222',
        participants: 45,
        reward: '500 INFY tokens',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        difficulty: 'Medium',
        status: 'Active',
        category: 'Computer Vision'
      },
      {
        id: '2',
        title: 'Zero-Shot Learning Competition',
        description: 'Create a model that can classify objects it has never seen before using only textual descriptions.',
        creator: '0x3333...4444',
        participants: 28,
        reward: '1000 INFY tokens',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        difficulty: 'Hard',
        status: 'Active',
        category: 'AI Training'
      },
      {
        id: '3',
        title: 'Efficient Model Architecture',
        description: 'Design the most parameter-efficient model that maintains high accuracy on benchmark datasets.',
        creator: '0x5555...6666',
        participants: 67,
        reward: '750 INFY tokens',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        difficulty: 'Hard',
        status: 'Active',
        category: 'Neural Networks'
      },
      {
        id: '4',
        title: 'Beginner\'s First Model',
        description: 'Perfect for newcomers! Build your first machine learning model with guided tutorials and community support.',
        creator: '0x7777...8888',
        participants: 156,
        reward: '100 INFY tokens',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        difficulty: 'Easy',
        status: 'Active',
        category: 'AI Training'
      }
    ];

    const mockCollaborativeProjects: CollaborativeProject[] = [
      {
        id: '1',
        title: 'Open Source Medical AI',
        description: 'Developing an open-source AI system for medical image analysis to help diagnose diseases in underserved communities.',
        creator: '0x1234...abcd',
        collaborators: ['0x1234...abcd', '0x5678...efgh', '0x9012...ijkl'],
        progress: 65,
        targetGoal: 'Deploy working prototype for 3 medical conditions',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'In Progress',
        requiredSkills: ['Machine Learning', 'Computer Vision', 'Python', 'TensorFlow']
      },
      {
        id: '2',
        title: 'Climate Change Prediction Model',
        description: 'Building a comprehensive climate model using satellite data and machine learning to predict environmental changes.',
        creator: '0x2468...1357',
        collaborators: ['0x2468...1357', '0x1357...2468'],
        progress: 30,
        targetGoal: 'Accurate 10-year climate predictions for 5 regions',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'Open',
        requiredSkills: ['Data Analysis', 'Deep Learning', 'Python', 'Climate Science']
      },
      {
        id: '3',
        title: 'Educational AI Tutor',
        description: 'Creating an AI-powered personalized tutoring system that adapts to individual learning styles and pace.',
        creator: '0x9999...0000',
        collaborators: ['0x9999...0000', '0x1111...2222', '0x3333...4444', '0x5555...6666', '0x7777...8888'],
        progress: 85,
        targetGoal: 'Launch beta version for 1000 students',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        status: 'In Progress',
        requiredSkills: ['NLP', 'Machine Learning', 'Education Technology', 'Python']
      },
      {
        id: '4',
        title: 'Decentralized AI Training Network',
        description: 'Building a peer-to-peer network for distributed AI model training using blockchain incentives.',
        creator: '0xaaaa...bbbb',
        collaborators: ['0xaaaa...bbbb'],
        progress: 15,
        targetGoal: 'Functional P2P training network with 100 nodes',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'Open',
        requiredSkills: ['Blockchain', 'Distributed Systems', 'Machine Learning', 'Cryptography']
      }
    ];

    setSharedINFTs(mockSharedINFTs);
    setChallenges(mockChallenges);
    setCollaborativeProjects(mockCollaborativeProjects);

    // Update social stats
    setSocialStats({
      totalShares: mockSharedINFTs.length,
      totalLikes: mockSharedINFTs.reduce((sum, inft) => sum + inft.likes, 0),
      totalComments: mockSharedINFTs.reduce((sum, inft) => sum + inft.comments, 0),
      activeChallenges: mockChallenges.filter(c => c.status === 'Active').length,
      completedChallenges: mockChallenges.filter(c => c.status === 'Completed').length,
      activeCollaborations: mockCollaborativeProjects.filter(p => p.status !== 'Completed').length,
      communityRank: Math.floor(Math.random() * 1000) + 1,
      reputationScore: Math.floor(Math.random() * 5000) + 1000
    });
  }, []);

  // Load social data
  useEffect(() => {
    if (isConnected) {
      generateMockData();
    }
  }, [isConnected, generateMockData]);

  // Share INFT function
  const shareINFT = useCallback(async (inftId: string, description: string) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newSharedINFT: SharedINFT = {
        id: Date.now().toString(),
        name: `INFT #${inftId}`,
        description,
        owner: address,
        sharedAt: new Date(),
        likes: 0,
        comments: 0,
        category: 'AI Training',
        isLiked: false
      };

      setSharedINFTs(prev => [newSharedINFT, ...prev]);
      
      // Update stats
      setSocialStats(prev => ({
        ...prev,
        totalShares: prev.totalShares + 1
      }));

      console.log('INFT shared successfully');
    } catch (err) {
      setError('Failed to share INFT');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  // Like INFT function
  const likeINFT = useCallback(async (inftId: string) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setSharedINFTs(prev => prev.map(inft => {
        if (inft.id === inftId) {
          const newLiked = !inft.isLiked;
          return {
            ...inft,
            isLiked: newLiked,
            likes: newLiked ? inft.likes + 1 : inft.likes - 1
          };
        }
        return inft;
      }));

      // Update stats
      setSocialStats(prev => ({
        ...prev,
        totalLikes: prev.totalLikes + 1
      }));

      console.log('INFT liked/unliked');
    } catch (err) {
      setError('Failed to like INFT');
      throw err;
    }
  }, [isConnected]);

  // Comment on INFT function
  const commentOnINFT = useCallback(async (inftId: string, comment: string) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setSharedINFTs(prev => prev.map(inft => {
        if (inft.id === inftId) {
          return {
            ...inft,
            comments: inft.comments + 1
          };
        }
        return inft;
      }));

      // Update stats
      setSocialStats(prev => ({
        ...prev,
        totalComments: prev.totalComments + 1
      }));

      console.log('Comment added successfully');
    } catch (err) {
      setError('Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  // Join challenge function
  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setChallenges(prev => prev.map(challenge => {
        if (challenge.id === challengeId) {
          return {
            ...challenge,
            participants: challenge.participants + 1
          };
        }
        return challenge;
      }));

      console.log('Joined challenge successfully');
    } catch (err) {
      setError('Failed to join challenge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  // Create challenge function
  const createChallenge = useCallback(async (challengeData: ChallengeForm) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newChallenge: Challenge = {
        id: Date.now().toString(),
        title: challengeData.title,
        description: challengeData.description,
        creator: address,
        participants: 1,
        reward: challengeData.reward,
        deadline: new Date(challengeData.deadline),
        difficulty: challengeData.difficulty,
        status: 'Active',
        category: challengeData.category
      };

      setChallenges(prev => [newChallenge, ...prev]);

      // Update stats
      setSocialStats(prev => ({
        ...prev,
        activeChallenges: prev.activeChallenges + 1
      }));

      console.log('Challenge created successfully');
    } catch (err) {
      setError('Failed to create challenge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  // Join collaboration function
  const joinCollaboration = useCallback(async (projectId: string) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCollaborativeProjects(prev => prev.map(project => {
        if (project.id === projectId && !project.collaborators.includes(address)) {
          return {
            ...project,
            collaborators: [...project.collaborators, address],
            status: project.collaborators.length === 0 ? 'In Progress' : project.status
          };
        }
        return project;
      }));

      console.log('Joined collaboration successfully');
    } catch (err) {
      setError('Failed to join collaboration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  // Create collaboration function
  const createCollaboration = useCallback(async (collabData: CollaborationForm) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newProject: CollaborativeProject = {
        id: Date.now().toString(),
        title: collabData.title,
        description: collabData.description,
        creator: address,
        collaborators: [address],
        progress: 0,
        targetGoal: collabData.targetGoal,
        createdAt: new Date(),
        status: 'Open',
        requiredSkills: collabData.requiredSkills
      };

      setCollaborativeProjects(prev => [newProject, ...prev]);

      // Update stats
      setSocialStats(prev => ({
        ...prev,
        activeCollaborations: prev.activeCollaborations + 1
      }));

      console.log('Collaboration created successfully');
    } catch (err) {
      setError('Failed to create collaboration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  // Get user's social activity
  const getUserActivity = useCallback(async (userAddress: string) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const userShares = sharedINFTs.filter(inft => inft.owner === userAddress);
      const userChallenges = challenges.filter(challenge => challenge.creator === userAddress);
      const userCollaborations = collaborativeProjects.filter(project => 
        project.collaborators.includes(userAddress)
      );

      return {
        shares: userShares,
        challenges: userChallenges,
        collaborations: userCollaborations,
        stats: {
          totalShares: userShares.length,
          totalLikes: userShares.reduce((sum, inft) => sum + inft.likes, 0),
          challengesCreated: userChallenges.length,
          collaborationsJoined: userCollaborations.length
        }
      };
    } catch (err) {
      setError('Failed to get user activity');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, sharedINFTs, challenges, collaborativeProjects]);

  // Get trending content
  const getTrendingContent = useCallback(() => {
    const trendingINFTs = [...sharedINFTs]
      .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
      .slice(0, 5);

    const popularChallenges = [...challenges]
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 3);

    const activeCollaborations = collaborativeProjects
      .filter(project => project.status !== 'Completed')
      .sort((a, b) => b.collaborators.length - a.collaborators.length)
      .slice(0, 3);

    return {
      trendingINFTs,
      popularChallenges,
      activeCollaborations
    };
  }, [sharedINFTs, challenges, collaborativeProjects]);

  return {
    // Data
    sharedINFTs,
    challenges,
    collaborativeProjects,
    socialStats,
    
    // State
    loading,
    error,
    
    // Functions
    shareINFT,
    likeINFT,
    commentOnINFT,
    joinChallenge,
    createChallenge,
    joinCollaboration,
    createCollaboration,
    getUserActivity,
    getTrendingContent,
    
    // Utilities
    clearError: () => setError(null)
  };
};