'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../components/WalletProvider.js';

// Contract ABI - only the functions we need
const INTELLIFY_ABI = [
  // View functions
  'function getUserINFTs(address user) view returns (uint256[])',
  'function getAIState(uint256 tokenId) view returns (tuple(string modelVersion, string[] knowledgeHashes, uint256 interactionCount, uint256 lastUpdated, bool isActive, address owner))',
  'function getKnowledgeHashes(uint256 tokenId) view returns (string[])',
  'function getKnowledgeMetadata(uint256 tokenId) view returns (tuple(string contentType, uint256 fileSize, string encryptionKey, uint256 uploadTimestamp, bool isEncrypted)[])',
  'function totalSupply() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function isKnowledgeHashUsed(string knowledgeHash) view returns (bool)',
  
  // Write functions
  'function mintINFT(address to, string metadataURI, string knowledgeHash, string modelVersion) returns (uint256)',
  'function addKnowledge(uint256 tokenId, string knowledgeHash, tuple(string contentType, uint256 fileSize, string encryptionKey, uint256 uploadTimestamp, bool isEncrypted) metadata)',
  'function recordInteraction(uint256 tokenId, string interactionType)',
  'function updateModelVersion(uint256 tokenId, string newModelVersion)',
  'function deactivateINFT(uint256 tokenId)',
  'function reactivateINFT(uint256 tokenId)',
  'function burn(uint256 tokenId)',
  
  // Events
  'event INFTMinted(uint256 indexed tokenId, address indexed owner, string knowledgeHash)',
  'event AIStateUpdated(uint256 indexed tokenId, uint256 interactionCount)',
  'event KnowledgeAdded(uint256 indexed tokenId, string knowledgeHash)',
  'event AIInteraction(uint256 indexed tokenId, address indexed user, string interactionType)',
];

// Contract address - you'll need to update this after deployment
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Placeholder

// 0G Testnet chain ID
const TARGET_CHAIN_ID = 16641;

export function useIntellifyContract() {
  const { wallet } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    initializeContract();
  }, [wallet.isConnected, wallet.chainId]);

  const initializeContract = async () => {
    if (typeof window !== 'undefined' && window.ethereum && wallet.isConnected) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await browserProvider.getSigner();
        
        setProvider(browserProvider);
        setSigner(signer);
        setIsCorrectNetwork(wallet.chainId === TARGET_CHAIN_ID);
        
        if (wallet.chainId === TARGET_CHAIN_ID) {
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, INTELLIFY_ABI, signer);
          setContract(contractInstance);
        } else {
          setContract(null);
        }
      } catch (error) {
        console.error('Error initializing contract:', error);
        setContract(null);
        setProvider(null);
        setSigner(null);
      }
    } else {
      setContract(null);
      setProvider(null);
      setSigner(null);
      setIsCorrectNetwork(false);
    }
  };

  // Read functions
  const getUserINFTs = async (userAddress: string): Promise<bigint[]> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getUserINFTs(userAddress);
  };

  const getAIState = async (tokenId: number | bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getAIState(tokenId);
  };

  const getKnowledgeHashes = async (tokenId: number | bigint): Promise<string[]> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getKnowledgeHashes(tokenId);
  };

  const getKnowledgeMetadata = async (tokenId: number | bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getKnowledgeMetadata(tokenId);
  };

  const getTotalSupply = async (): Promise<bigint> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.totalSupply();
  };

  const getTokenURI = async (tokenId: number | bigint): Promise<string> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.tokenURI(tokenId);
  };

  const getOwnerOf = async (tokenId: number | bigint): Promise<string> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.ownerOf(tokenId);
  };

  const isKnowledgeHashUsed = async (knowledgeHash: string): Promise<boolean> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.isKnowledgeHashUsed(knowledgeHash);
  };

  // Write functions
  const mintINFT = async (
    to: string,
    metadataURI: string,
    knowledgeHash: string,
    modelVersion: string
  ): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.mintINFT(to, metadataURI, knowledgeHash, modelVersion);
  };

  const addKnowledge = async (
    tokenId: number | bigint,
    knowledgeHash: string,
    metadata: {
      contentType: string;
      fileSize: number;
      encryptionKey: string;
      uploadTimestamp: number;
      isEncrypted: boolean;
    }
  ): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.addKnowledge(tokenId, knowledgeHash, metadata);
  };

  const recordInteraction = async (
    tokenId: number | bigint,
    interactionType: string
  ): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.recordInteraction(tokenId, interactionType);
  };

  const updateModelVersion = async (
    tokenId: number | bigint,
    newModelVersion: string
  ): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.updateModelVersion(tokenId, newModelVersion);
  };

  const deactivateINFT = async (tokenId: number | bigint): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.deactivateINFT(tokenId);
  };

  const reactivateINFT = async (tokenId: number | bigint): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.reactivateINFT(tokenId);
  };

  const burnINFT = async (tokenId: number | bigint): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.burn(tokenId);
  };

  // Utility functions
  const waitForTransaction = async (txHash: string) => {
    if (!provider) throw new Error('Provider not initialized');
    return await provider.waitForTransaction(txHash);
  };

  const estimateGas = async (method: string, ...args: any[]) => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract[method].estimateGas(...args);
  };

  return {
    contract,
    provider,
    signer,
    isCorrectNetwork,
    
    // Read functions
    getUserINFTs,
    getAIState,
    getKnowledgeHashes,
    getKnowledgeMetadata,
    getTotalSupply,
    getTokenURI,
    getOwnerOf,
    isKnowledgeHashUsed,
    
    // Write functions
    mintINFT,
    addKnowledge,
    recordInteraction,
    updateModelVersion,
    deactivateINFT,
    reactivateINFT,
    burnINFT,
    
    // Utility functions
    waitForTransaction,
    estimateGas,
  };
}