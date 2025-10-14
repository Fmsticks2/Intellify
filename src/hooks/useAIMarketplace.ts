import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../components/WalletProvider';

// AI Model Marketplace ABI (simplified for key functions)
const AI_MARKETPLACE_ABI = [
  "function registerModel(string memory name, string memory description, string memory category, uint256 pricePerInference, string memory modelHash, string memory metadataURI) external",
  "function purchaseModelAccess(uint256 modelId) external payable",
  "function useInference(uint256 modelId, string memory inputData) external payable returns (uint256)",
  "function rateModel(uint256 modelId, uint8 rating) external",
  "function getModel(uint256 modelId) external view returns (tuple(uint256 id, address creator, string name, string description, string category, uint256 pricePerInference, uint256 totalInferences, uint256 totalRating, uint256 ratingCount, bool isActive, bool isVerified, string modelHash, string metadataURI))",
  "function getModelsByCategory(string memory category) external view returns (uint256[] memory)",
  "function getAllModels() external view returns (uint256[] memory)",
  "function hasAccess(address user, uint256 modelId) external view returns (bool)",
  "function getUserRating(address user, uint256 modelId) external view returns (uint8)",
  "function modelCount() external view returns (uint256)",
  "event ModelRegistered(uint256 indexed modelId, address indexed creator, string name, string category)",
  "event ModelAccessPurchased(uint256 indexed modelId, address indexed user, uint256 amount)",
  "event InferenceUsed(uint256 indexed modelId, address indexed user, uint256 inferenceId, uint256 cost)",
  "event ModelRated(uint256 indexed modelId, address indexed user, uint8 rating)"
];

const MARKETPLACE_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual deployed address

export interface AIModel {
  id: number;
  creator: string;
  name: string;
  description: string;
  category: string;
  pricePerInference: string;
  totalInferences: number;
  totalRating: number;
  ratingCount: number;
  isActive: boolean;
  isVerified: boolean;
  modelHash: string;
  metadataURI: string;
  averageRating: number;
}

export interface ModelFilters {
  category: string;
  minRating: number;
  maxPrice: string;
  searchTerm: string;
  sortBy: 'popularity' | 'rating' | 'price' | 'newest';
}

export function useAIMarketplace() {
  const { wallet } = useWallet();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Initialize contract
  useEffect(() => {
    if (wallet.isConnected && wallet.provider) {
      try {
        const signer = wallet.provider.getSigner();
        const marketplaceContract = new ethers.Contract(
          MARKETPLACE_CONTRACT_ADDRESS,
          AI_MARKETPLACE_ABI,
          signer
        );
        setContract(marketplaceContract);
      } catch (err) {
        console.error('Failed to initialize marketplace contract:', err);
        setError('Failed to connect to marketplace contract');
      }
    }
  }, [wallet.isConnected, wallet.provider]);

  // Load all models
  const loadModels = async () => {
    if (!contract) return;

    setLoading(true);
    setError(null);

    try {
      const modelCount = await contract.modelCount();
      const modelPromises = [];

      for (let i = 1; i <= modelCount.toNumber(); i++) {
        modelPromises.push(contract.getModel(i));
      }

      const modelResults = await Promise.all(modelPromises);
      const formattedModels: AIModel[] = modelResults.map((model, index) => ({
        id: index + 1,
        creator: model.creator,
        name: model.name,
        description: model.description,
        category: model.category,
        pricePerInference: ethers.utils.formatEther(model.pricePerInference),
        totalInferences: model.totalInferences.toNumber(),
        totalRating: model.totalRating.toNumber(),
        ratingCount: model.ratingCount.toNumber(),
        isActive: model.isActive,
        isVerified: model.isVerified,
        modelHash: model.modelHash,
        metadataURI: model.metadataURI,
        averageRating: model.ratingCount.toNumber() > 0 
          ? model.totalRating.toNumber() / model.ratingCount.toNumber() 
          : 0
      }));

      setModels(formattedModels);
    } catch (err) {
      console.error('Failed to load models:', err);
      setError('Failed to load AI models');
    } finally {
      setLoading(false);
    }
  };

  // Register a new model
  const registerModel = async (
    name: string,
    description: string,
    category: string,
    pricePerInference: string,
    modelHash: string,
    metadataURI: string
  ) => {
    if (!contract) throw new Error('Contract not initialized');

    setLoading(true);
    try {
      const priceWei = ethers.utils.parseEther(pricePerInference);
      const tx = await contract.registerModel(
        name,
        description,
        category,
        priceWei,
        modelHash,
        metadataURI
      );
      await tx.wait();
      await loadModels(); // Refresh models list
      return tx.hash;
    } catch (err) {
      console.error('Failed to register model:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Purchase model access
  const purchaseModelAccess = async (modelId: number, price: string) => {
    if (!contract) throw new Error('Contract not initialized');

    setLoading(true);
    try {
      const priceWei = ethers.utils.parseEther(price);
      const tx = await contract.purchaseModelAccess(modelId, { value: priceWei });
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error('Failed to purchase model access:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Use model inference
  const useInference = async (modelId: number, inputData: string, price: string) => {
    if (!contract) throw new Error('Contract not initialized');

    setLoading(true);
    try {
      const priceWei = ethers.utils.parseEther(price);
      const tx = await contract.useInference(modelId, inputData, { value: priceWei });
      const receipt = await tx.wait();
      
      // Extract inference ID from events
      const inferenceEvent = receipt.events?.find((e: any) => e.event === 'InferenceUsed');
      const inferenceId = inferenceEvent?.args?.inferenceId?.toNumber();
      
      await loadModels(); // Refresh to update inference counts
      return { txHash: tx.hash, inferenceId };
    } catch (err) {
      console.error('Failed to use inference:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Rate a model
  const rateModel = async (modelId: number, rating: number) => {
    if (!contract) throw new Error('Contract not initialized');
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

    setLoading(true);
    try {
      const tx = await contract.rateModel(modelId, rating);
      await tx.wait();
      await loadModels(); // Refresh to update ratings
      return tx.hash;
    } catch (err) {
      console.error('Failed to rate model:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has access to a model
  const checkModelAccess = async (modelId: number): Promise<boolean> => {
    if (!contract || !wallet.address) return false;

    try {
      return await contract.hasAccess(wallet.address, modelId);
    } catch (err) {
      console.error('Failed to check model access:', err);
      return false;
    }
  };

  // Get user's rating for a model
  const getUserRating = async (modelId: number): Promise<number> => {
    if (!contract || !wallet.address) return 0;

    try {
      const rating = await contract.getUserRating(wallet.address, modelId);
      return rating;
    } catch (err) {
      console.error('Failed to get user rating:', err);
      return 0;
    }
  };

  // Filter and sort models
  const filterModels = (filters: ModelFilters): AIModel[] => {
    let filtered = models.filter(model => {
      // Category filter
      if (filters.category && filters.category !== 'all' && model.category !== filters.category) {
        return false;
      }

      // Rating filter
      if (model.averageRating < filters.minRating) {
        return false;
      }

      // Price filter
      if (filters.maxPrice && parseFloat(model.pricePerInference) > parseFloat(filters.maxPrice)) {
        return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          model.name.toLowerCase().includes(searchLower) ||
          model.description.toLowerCase().includes(searchLower) ||
          model.category.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Sort models
    switch (filters.sortBy) {
      case 'popularity':
        filtered.sort((a, b) => b.totalInferences - a.totalInferences);
        break;
      case 'rating':
        filtered.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'price':
        filtered.sort((a, b) => parseFloat(a.pricePerInference) - parseFloat(b.pricePerInference));
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
    }

    return filtered;
  };

  // Load models on contract initialization
  useEffect(() => {
    if (contract) {
      loadModels();
    }
  }, [contract]);

  return {
    models,
    loading,
    error,
    registerModel,
    purchaseModelAccess,
    useInference,
    rateModel,
    checkModelAccess,
    getUserRating,
    filterModels,
    loadModels
  };
}