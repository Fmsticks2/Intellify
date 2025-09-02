'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../components/WalletProvider';

// Contract ABI - only the functions we need
const INTELLIFY_ABI = [
  // View functions
  'function getUserINFTs(address user) view returns (uint256[])',
  'function getAIState(uint256 tokenId) view returns (tuple(string modelVersion, string[] knowledgeHashes, uint256 interactionCount, uint256 lastUpdated, bool isActive))',
  'function getKnowledgeHashes(uint256 tokenId) view returns (string[])',
  'function getKnowledgeMetadata(uint256 tokenId, string knowledgeHash) view returns (string metadataURI, uint256 addedAt)',
  'function totalSupply() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function isKnowledgeHashUsed(string knowledgeHash) view returns (bool)',
  
  // Enhanced encryption view functions
  'function getEncryptedKnowledgeIndex(uint256 tokenId) view returns (tuple(string[] contentHashes, string[] semanticHashes, string indexStructure, string encryptionKey))',
  'function getEncryptedModelState(uint256 tokenId) view returns (tuple(string stateHash, string parametersHash, string configHash, string encryptionKey))',
  'function getUserAccessKey(uint256 tokenId, address user) view returns (string)',
  'function isContentHashVerified(string contentHash) view returns (bool)',
  'function getEncryptionVersion(uint256 tokenId) view returns (uint256)',
  'function getKnowledgeIndexSummary(uint256 tokenId) view returns (uint256, uint256, uint256)',
  'function getModelStateSummary(uint256 tokenId) view returns (bool, bool, uint256)',
  
  // Write functions
  'function mintINFT(address to, string metadataURI, string knowledgeHash, string modelVersion) returns (uint256)',
  'function addKnowledge(uint256 tokenId, string knowledgeHash, tuple(string contentType, uint256 fileSize, string encryptionKey, uint256 uploadTimestamp, bool isEncrypted) metadata)',
  'function recordInteraction(uint256 tokenId, string interactionType)',
  'function updateModelVersion(uint256 tokenId, string newModelVersion)',
  'function deactivateINFT(uint256 tokenId)',
  'function reactivateINFT(uint256 tokenId)',
  'function burn(uint256 tokenId)',
  
  // Enhanced encryption write functions
  'function addEncryptedKnowledgeChunk(uint256 tokenId, string contentHash, string semanticHash)',
  'function updateEncryptedModelState(uint256 tokenId, string stateHash, string parametersHash, string configHash)',
  'function grantUserAccessKey(uint256 tokenId, address user, string accessKey)',
  'function revokeUserAccessKey(uint256 tokenId, address user)',
  'function updateEncryptionVersion(uint256 tokenId)',
  
  // Events
  'event INFTMinted(uint256 indexed tokenId, address indexed owner, string knowledgeHash)',
  'event AIStateUpdated(uint256 indexed tokenId, uint256 interactionCount)',
  'event KnowledgeAdded(uint256 indexed tokenId, string knowledgeHash)',
  'event AIInteraction(uint256 indexed tokenId, address indexed user, string interactionType)',
  'event EncryptedKnowledgeIndexed(uint256 indexed tokenId, string contentHash, string semanticHash)',
  'event EncryptedModelStateUpdated(uint256 indexed tokenId, string stateHash)',
  'event UserAccessKeyGranted(uint256 indexed tokenId, address indexed user)',
  'event UserAccessKeyRevoked(uint256 indexed tokenId, address indexed user)',
  'event EncryptionVersionUpdated(uint256 indexed tokenId, uint256 newVersion)',
  'event ContentHashVerified(string indexed contentHash, address indexed verifier)',
];

import { CONTRACT_ADDRESS } from '../constants';

// Contract address imported from constants

// 0G Testnet chain ID
const TARGET_CHAIN_ID = 16601;

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

  // Enhanced encryption read functions
  const getEncryptedKnowledgeIndex = async (tokenId: number | bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getEncryptedKnowledgeIndex(tokenId);
  };

  const getEncryptedModelState = async (tokenId: number | bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getEncryptedModelState(tokenId);
  };

  const getUserAccessKey = async (tokenId: number | bigint, userAddress: string): Promise<string> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getUserAccessKey(tokenId, userAddress);
  };

  const isContentHashVerified = async (contentHash: string): Promise<boolean> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.isContentHashVerified(contentHash);
  };

  const getEncryptionVersion = async (tokenId: number | bigint): Promise<bigint> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getEncryptionVersion(tokenId);
  };

  const getKnowledgeIndexSummary = async (tokenId: number | bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getKnowledgeIndexSummary(tokenId);
  };

  const getModelStateSummary = async (tokenId: number | bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getModelStateSummary(tokenId);
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

  // Enhanced encryption write functions
  const addEncryptedKnowledgeChunk = async (
    tokenId: number | bigint,
    contentHash: string,
    semanticHash: string
  ): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.addEncryptedKnowledgeChunk(tokenId, contentHash, semanticHash);
  };

  const updateEncryptedModelState = async (
    tokenId: number | bigint,
    stateHash: string,
    parametersHash: string,
    configHash: string
  ): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.updateEncryptedModelState(tokenId, stateHash, parametersHash, configHash);
  };

  const grantUserAccessKey = async (
    tokenId: number | bigint,
    userAddress: string,
    accessKey: string
  ): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.grantUserAccessKey(tokenId, userAddress, accessKey);
  };

  const revokeUserAccessKey = async (
    tokenId: number | bigint,
    userAddress: string
  ): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.revokeUserAccessKey(tokenId, userAddress);
  };

  const updateEncryptionVersion = async (
    tokenId: number | bigint
  ): Promise<ethers.ContractTransactionResponse> => {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.updateEncryptionVersion(tokenId);
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
    
    // Enhanced encryption read functions
    getEncryptedKnowledgeIndex,
    getEncryptedModelState,
    getUserAccessKey,
    isContentHashVerified,
    getEncryptionVersion,
    getKnowledgeIndexSummary,
    getModelStateSummary,
    
    // Write functions
    mintINFT,
    addKnowledge,
    recordInteraction,
    updateModelVersion,
    deactivateINFT,
    reactivateINFT,
    burnINFT,
    
    // Enhanced encryption write functions
    addEncryptedKnowledgeChunk,
    updateEncryptedModelState,
    grantUserAccessKey,
    revokeUserAccessKey,
    updateEncryptionVersion,
    
    // Utility functions
    waitForTransaction,
    estimateGas,
  };
}