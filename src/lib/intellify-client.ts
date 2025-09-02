/**
 * Intellify Wave 2 API Client
 * TypeScript client for integrating with Intellify's decentralized AI knowledge companion
 */

import { ethers } from 'ethers';
// import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk'; // Commented out due to package issues
import { appKit, ethersAdapter } from './reown-config';
import CryptoJS from 'crypto-js';

// Temporary type definitions for 0G SDK until package is available
interface Indexer {
  upload: (file: any) => Promise<string>;
  download: (hash: string) => Promise<Uint8Array>;
}

interface ZgFile {
  data: Uint8Array;
  name: string;
  type: string;
}

// Types and Interfaces
export interface WalletConnection {
  address: string;
  signer: ethers.Signer;
  provider: ethers.BrowserProvider;
}

export interface EncryptedData {
  data: Uint8Array;
  filename: string;
  contentType: string;
  owner: string;
  encryptionKey: string;
}

export interface AIRequest {
  type: 'summary' | 'qa';
  content: string;
  question?: string;
  context?: string[];
}

export interface AIResponse {
  response: string;
  confidence: number;
  tokens_used: number;
  timestamp: number;
}

export interface INFTMetadata {
  name: string;
  description: string;
  knowledge_hash: string;
  ai_state: {
    model_version: string;
    training_data_hashes: string[];
    interaction_count: number;
    last_updated: number;
  };
  owner: string;
}

export interface StorageUploadResult {
  hash: string;
  size: number;
  timestamp: number;
}

// Configuration
export interface IntellifyConfig {
  rpcUrl: string;
  indexerRpc: string;
  contractAddress: string;
  privateKey?: string;
  computeApiKey?: string;
}

// INFT Contract ABI (simplified for Wave 2)
const INFT_ABI = [
  "function mintINFT(address to, string memory metadataURI, string memory knowledgeHash, string memory modelVersion) public returns (uint256)",
  "function getAIState(uint256 tokenId) public view returns (tuple(string modelVersion, string[] knowledgeHashes, uint256 interactionCount, uint256 lastUpdated, bool isActive))",
  "function recordInteraction(uint256 tokenId, string memory interactionType) public",
  "function addKnowledge(uint256 tokenId, string memory knowledgeHash, tuple(string contentType, uint256 fileSize, string encryptionKey, uint256 uploadTimestamp, bool isEncrypted) metadata) public",
  "function getUserINFTs(address user) public view returns (uint256[])",
  "function totalSupply() public view returns (uint256)"
];

/**
 * Main Intellify Client Class
 */
export class IntellifyClient {
  private config: IntellifyConfig;
  private wallet: WalletConnection | null = null;
  private indexer: Indexer | null = null;
  private contract: ethers.Contract | null = null;

  constructor(config: IntellifyConfig) {
    this.config = config;
  }

  /**
   * Initialize the client with 0G indexer
   */
  async initialize(): Promise<void> {
    // Initialize 0G indexer
    // Note: Indexer initialization would be done with actual 0G SDK
    // this.indexer = new Indexer(this.config.indexerRpc);
  }

  /**
   * Connect user's wallet
   */
  async connectWallet(): Promise<WalletConnection> {
    try {
      // Open Reown modal for wallet connection
      await appKit.open();
      
      // Wait for connection
      // Note: In actual implementation, this would get the wallet provider
      const walletProvider = (window as any).ethereum;
      if (!walletProvider) {
        throw new Error('No wallet connected');
      }

      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      this.wallet = { address, signer, provider };
      
      // Initialize contract
      this.contract = new ethers.Contract(
        this.config.contractAddress,
        INFT_ABI,
        signer
      );

      return this.wallet;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${(error as Error).message}`);
    }
  }

  /**
   * Authenticate user with signature
   */
  async authenticateUser(): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const message = `Intellify Authentication\nTimestamp: ${Date.now()}\nAddress: ${this.wallet.address}`;
      const signature = await this.wallet.signer.signMessage(message);
      return signature;
    } catch (error) {
      throw new Error(`Authentication failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate encryption key for user
   */
  private generateUserKey(userAddress: string): string {
    return CryptoJS.SHA256(userAddress + process.env.NEXT_PUBLIC_ENCRYPTION_SALT).toString();
  }

  /**
   * Encrypt file data
   */
  async encryptFile(file: File): Promise<EncryptedData> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const fileBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);
      const encryptionKey = this.generateUserKey(this.wallet.address);
      
      // Convert to base64 for encryption
      const base64Data = btoa(String.fromCharCode(...fileData));
      const encrypted = CryptoJS.AES.encrypt(base64Data, encryptionKey).toString();
      
      return {
        data: new TextEncoder().encode(encrypted),
        filename: file.name,
        contentType: file.type,
        owner: this.wallet.address,
        encryptionKey: encryptionKey
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`File encryption failed: ${errorMessage}`);
    }
  }

  /**
   * Upload file to 0G Storage using the SDK
   */
  async uploadFile(file: File): Promise<string> {
    if (!this.indexer) {
      throw new StorageError('Client not initialized');
    }

    if (!this.wallet) {
      throw new StorageError('Wallet not connected');
    }

    try {
      // Note: ZgFile would be created with actual 0G SDK
      // const zgFile = await ZgFile.fromFile(file);
      const zgFile = { data: new Uint8Array(), name: file.name, type: file.type };
      
      // Note: In actual implementation, this would use 0G SDK
      // Generate a mock hash for now
      const mockHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      
      return mockHash;
    } catch (error) {
      throw new StorageError(`File upload failed: ${error}`);
    }
  }

  /**
   * Retrieve file from 0G Storage using the SDK
   */
  async retrieveFile(hash: string): Promise<Uint8Array> {
    if (!this.indexer) {
      throw new StorageError('Client not initialized');
    }

    try {
      // Note: In actual implementation, this would use 0G SDK to download
      // For now, return mock data
      return new TextEncoder().encode(`Mock file content for hash: ${hash}`);
    } catch (error) {
      throw new StorageError(`File retrieval failed: ${error}`);
    }
  }

  /**
   * Execute AI task using mock implementation (Wave 2)
   * In Wave 3, this will integrate with 0G Compute for real AI inference
   */
  async executeAITask(request: AIRequest): Promise<AIResponse> {
    // Mock implementation for Wave 2
    // TODO: Integrate with 0G Compute SDK in Wave 3
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      let mockResult: string;
      
      switch (request.type) {
        case 'summary':
          mockResult = `Summary: This document contains ${request.content.length} characters of content covering key topics and insights.`;
          break;
        case 'qa':
          mockResult = request.question ? 
            `Based on the provided content, here's a relevant answer to your question: "${request.question}"` :
            `Please provide a question to get a specific answer about the content.`;
          break;
        default:
          mockResult = `Processed ${request.type} task for content with ${request.content.length} characters.`;
      }

      return {
        response: mockResult,
        confidence: 0.85,
        tokens_used: Math.floor(Math.random() * 500 + 100),
        timestamp: Date.now()
      };
    } catch (error) {
      throw new ComputeError(`Failed to execute AI task: ${error}`);
    }
  }

  /**
   * Create INFT metadata
   */
  createINFTMetadata(storageHash: string): INFTMetadata {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    return {
      name: `Intellify AI Companion #${Date.now()}`,
      description: "Personalized AI knowledge companion with encrypted data storage and privacy-first interactions",
      knowledge_hash: storageHash,
      ai_state: {
        model_version: "intellify-v1.0",
        training_data_hashes: [storageHash],
        interaction_count: 0,
        last_updated: Date.now()
      },
      owner: this.wallet.address
    };
  }

  /**
   * Upload metadata to IPFS (mock implementation for Wave 2)
   */
  private async uploadMetadataToIPFS(metadata: INFTMetadata): Promise<string> {
    // Mock IPFS upload - in production, use actual IPFS service
    const metadataString = JSON.stringify(metadata);
    const hash = CryptoJS.SHA256(metadataString).toString();
    
    // Store in localStorage for Wave 2 demo
    localStorage.setItem(`ipfs_${hash}`, metadataString);
    
    return `ipfs://${hash}`;
  }

  /**
   * Mint INFT with AI state
   */
  async mintINFT(metadata: INFTMetadata): Promise<string> {
    if (!this.contract || !this.wallet) {
      throw new Error('Contract or wallet not initialized');
    }

    try {
      const metadataURI = await this.uploadMetadataToIPFS(metadata);
      
      const tx = await this.contract.mintINFT(
        metadata.owner,
        metadataURI,
        metadata.knowledge_hash,
        metadata.ai_state.model_version
      );

      const receipt = await tx.wait();
      const tokenId = receipt.events[0].args.tokenId.toString();

      return tokenId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`INFT minting failed: ${errorMessage}`);
    }
  }

  /**
   * Record AI interaction on-chain
   */
  async recordInteraction(tokenId: string, interactionType: string): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.recordInteraction(tokenId, interactionType);
      await tx.wait();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to record interaction: ${errorMessage}`);
    }
  }

  /**
   * Get user's INFTs
   */
  async getUserINFTs(): Promise<string[]> {
    if (!this.contract || !this.wallet) {
      throw new Error('Contract or wallet not initialized');
    }

    try {
      const tokenIds = await this.contract.getUserINFTs(this.wallet.address);
      return tokenIds.map((id: bigint) => id.toString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get user INFTs: ${errorMessage}`);
    }
  }

  /**
   * Get AI state for a token
   */
  async getAIState(tokenId: string): Promise<any> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.getAIState(tokenId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get AI state: ${errorMessage}`);
    }
  }

  /**
   * Complete workflow: Upload file, create AI, mint INFT
   */
  async createKnowledgeCompanion(file: File): Promise<{
    storageHash: string;
    tokenId: string;
    summary: AIResponse;
  }> {
    try {
      // 1. Encrypt and upload file
      const encryptedData = await this.encryptFile(file);
      
      // Convert EncryptedData to File-like object for upload
      const encryptedFile = new File(
        [encryptedData.data] as BlobPart[],
        encryptedData.filename,
        { type: encryptedData.contentType }
      );
      
      const uploadResult = await this.uploadFile(encryptedFile);
      
      // 2. Generate AI summary
      const fileContent = await file.text();
      const summaryRequest: AIRequest = {
        type: 'summary',
        content: fileContent
      };
      const summary = await this.executeAITask(summaryRequest);
      
      // 3. Create and mint INFT
      const metadata = this.createINFTMetadata(uploadResult);
      const tokenId = await this.mintINFT(metadata);
      
      // 4. Record initial interaction
      await this.recordInteraction(tokenId, 'summary');
      
      return {
        storageHash: uploadResult,
        tokenId,
        summary
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create knowledge companion: ${errorMessage}`);
    }
  }

  /**
   * Ask question about existing knowledge
   */
  async askQuestion(tokenId: string, question: string): Promise<AIResponse> {
    try {
      // Get AI state to retrieve knowledge hashes
      const aiState = await this.getAIState(tokenId);
      const knowledgeHashes = aiState.knowledgeHashes;
      
      // Retrieve and decrypt knowledge files
      let combinedContent = '';
      for (const hash of knowledgeHashes) {
        try {
          const fileData = await this.retrieveFile(hash);
          const fileContent = new TextDecoder().decode(fileData);
          combinedContent += fileContent + '\n\n';
        } catch (error) {
          console.warn(`Failed to retrieve knowledge hash ${hash}:`, error);
        }
      }
      
      // Execute Q&A
      const qaRequest: AIRequest = {
        type: 'qa',
        content: combinedContent,
        question
      };
      const answer = await this.executeAITask(qaRequest);
      
      // Record interaction
      await this.recordInteraction(tokenId, 'qa');
      
      return answer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to answer question: ${errorMessage}`);
    }
  }

  /**
   * Get wallet connection status
   */
  isWalletConnected(): boolean {
    return this.wallet !== null;
  }

  /**
   * Get current wallet address
   */
  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.wallet = null;
    this.contract = null;
  }
}

// Export utility functions
export const createIntellifyClient = (config: IntellifyConfig): IntellifyClient => {
  return new IntellifyClient(config);
};

// Default configuration using 0G testnet endpoints
export const defaultConfig: IntellifyConfig = {
  rpcUrl: process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai',
  indexerRpc: process.env.NEXT_PUBLIC_0G_INDEXER_RPC_URL || 'https://indexer-storage-testnet-turbo.0g.ai',
  contractAddress: process.env.NEXT_PUBLIC_INFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  privateKey: process.env.PRIVATE_KEY,
  computeApiKey: process.env.COMPUTE_API_KEY
};

// 0G Network configuration
export const ZG_CONFIG = {
  evmRpc: 'https://evmrpc-testnet.0g.ai',
  indexerRpc: 'https://indexer-storage-testnet-turbo.0g.ai'
};

// Error classes
export class IntellifyError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'IntellifyError';
  }
}

export class WalletError extends IntellifyError {
  constructor(message: string) {
    super(message, 'WALLET_ERROR');
    this.name = 'WalletError';
  }
}

export class StorageError extends IntellifyError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export class ComputeError extends IntellifyError {
  constructor(message: string) {
    super(message, 'COMPUTE_ERROR');
    this.name = 'ComputeError';
  }
}

export class ContractError extends IntellifyError {
  constructor(message: string) {
    super(message, 'CONTRACT_ERROR');
    this.name = 'ContractError';
  }
}