/**
 * Intellify INFT SDK
 * 
 * A comprehensive SDK for creating and managing evolving Intelligent NFTs (INFTs)
 * with 0G Data Availability integration and on-chain interaction tracking.
 * 
 * @version 1.0.0
 * @author Intellify Team
 */

import { ethers } from 'ethers';
import { ZGDAClient, ZGDAConfig, INFTDAMetadata } from '../src/lib/0g-da-client';

// Re-export core types for SDK users
export type { ZGDAConfig, INFTDAMetadata } from '../src/lib/0g-da-client';

/**
 * Configuration for the Intellify INFT SDK
 */
export interface IntellifySDKConfig {
  /** Ethereum provider or RPC URL */
  provider: ethers.Provider | string;
  /** Private key or signer for transactions */
  signer?: ethers.Signer | string;
  /** INFT contract address */
  contractAddress: string;
  /** 0G Data Availability configuration */
  zgdaConfig?: ZGDAConfig;
  /** Network configuration */
  network?: {
    chainId: number;
    name: string;
  };
}

/**
 * INFT creation parameters
 */
export interface CreateINFTParams {
  /** Name of the INFT */
  name: string;
  /** Description of the INFT */
  description: string;
  /** Initial image URL or base64 data */
  image: string;
  /** AI personality or characteristics */
  aiPersonality?: string;
  /** Custom attributes */
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * INFT interaction result
 */
export interface InteractionResult {
  transactionHash: string;
  evolved: boolean;
  newLevel?: number;
  newMetadataURI?: string;
}

/**
 * Evolution status of an INFT
 */
export interface EvolutionStatus {
  level: number;
  experience: number;
  nextEvolutionAt: number;
  evolutionHistory: Array<{
    level: number;
    timestamp: number;
    trigger_event: string;
  }>;
}

/**
 * Main Intellify INFT SDK class
 */
export class IntellifySDK {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;
  private contract?: ethers.Contract;
  private zgdaClient?: ZGDAClient;
  private config: IntellifySDKConfig;

  // INFT Contract ABI (minimal required functions)
  private static readonly CONTRACT_ABI = [
    'function mintINFT(address to, string memory metadataURI, string memory knowledgeHash, string memory modelVersion) public returns (uint256)',
    'function recordInteraction(uint256 tokenId, string memory interactionType) public',
    'function getAIState(uint256 tokenId) public view returns (tuple(string modelVersion, string[] knowledgeHashes, uint256 interactionCount, uint256 lastUpdated, bool isActive))',
    'function tokenURI(uint256 tokenId) public view returns (string)',
    'function ownerOf(uint256 tokenId) public view returns (address)',
    'function updateTokenURI(uint256 tokenId, string memory newURI) public',
    'function evolveINFT(uint256 tokenId, string memory newMetadataURI, uint256 newLevel) public',
    'function batchUpdateTokenURIs(uint256[] memory tokenIds, string[] memory newURIs) public',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event AIInteraction(uint256 indexed tokenId, address indexed user, string interactionType)',
    'event INFTEvolved(uint256 indexed tokenId, uint256 newLevel, string newMetadataURI)',
    'event MetadataURIUpdated(uint256 indexed tokenId, string newURI)'
  ];

  constructor(config: IntellifySDKConfig) {
    this.config = config;
    
    // Initialize provider
    if (typeof config.provider === 'string') {
      this.provider = new ethers.JsonRpcProvider(config.provider);
    } else {
      this.provider = config.provider;
    }

    // Initialize signer if provided
    if (config.signer) {
      if (typeof config.signer === 'string') {
        this.signer = new ethers.Wallet(config.signer, this.provider);
      } else {
        this.signer = config.signer;
      }
    }
  }

  /**
   * Initialize the SDK - must be called before using other methods
   */
  async initialize(): Promise<void> {
    try {
      // Initialize contract
      if (this.signer) {
        this.contract = new ethers.Contract(
          this.config.contractAddress,
          IntellifySDK.CONTRACT_ABI,
          this.signer
        );
      } else {
        this.contract = new ethers.Contract(
          this.config.contractAddress,
          IntellifySDK.CONTRACT_ABI,
          this.provider
        );
      }

      // Initialize 0G DA client if config provided
      if (this.config.zgdaConfig) {
        this.zgdaClient = new ZGDAClient(this.config.zgdaConfig);
        // ZGDAClient is ready to use after construction
      }

      console.log('Intellify SDK initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize SDK: ${errorMessage}`);
    }
  }

  /**
   * Create and mint a new INFT
   */
  async createINFT(params: CreateINFTParams, recipientAddress?: string): Promise<{
    tokenId: string;
    transactionHash: string;
    metadataURI: string;
  }> {
    if (!this.contract || !this.signer) {
      throw new Error('SDK not initialized or signer not provided');
    }

    try {
      // Prepare metadata
      const metadata: INFTDAMetadata = {
        name: params.name,
        description: params.description,
        image: params.image,
        level: 1,
        experience: 0,
        attributes: [
          { trait_type: 'Level', value: 1 },
          { trait_type: 'Experience', value: 0 },
          { trait_type: 'Evolution Stage', value: 'Genesis' },
          ...(params.attributes || [])
        ],
        ai_state: {
          model_version: 'v1.0',
          training_data_hashes: [],
          interaction_count: 0,
          last_updated: Date.now()
        },
        evolution_history: [{
          level: 1,
          timestamp: Date.now(),
          trigger_event: 'initial_creation',
          metadata_hash: ''
        }]
      };

      // Upload metadata to 0G DA or fallback storage
      let metadataURI: string;
      if (this.zgdaClient) {
        const result = await this.zgdaClient.submitMetadata(metadata);
        metadataURI = `0g-da://${result.blobHash}`;
      } else {
        // Fallback to simple hash-based storage
        const metadataString = JSON.stringify(metadata);
        const hash = ethers.keccak256(ethers.toUtf8Bytes(metadataString));
        localStorage.setItem(`inft_metadata_${hash}`, metadataString);
        metadataURI = `local://${hash}`;
      }

      // Mint the INFT
      const recipient = recipientAddress || await this.signer.getAddress();
      const knowledgeHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadata)));
      const tx = await this.contract.mintINFT(
        recipient,
        metadataURI,
        knowledgeHash,
        'v1.0.0' // Default model version
      );
      
      const receipt = await tx.wait();
      
      // Extract token ID from Transfer event
      const transferEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log);
          return parsed?.name === 'Transfer';
        } catch {
          return false;
        }
      });
      
      let tokenId = '0';
      if (transferEvent) {
        const parsed = this.contract.interface.parseLog(transferEvent);
        tokenId = parsed?.args?.tokenId?.toString() || '0';
      }

      return {
        tokenId,
        transactionHash: tx.hash,
        metadataURI
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create INFT: ${errorMessage}`);
    }
  }

  /**
   * Record an interaction with an INFT and potentially trigger evolution
   */
  async recordInteraction(tokenId: string, interactionType: string): Promise<InteractionResult> {
    if (!this.contract || !this.signer) {
      throw new Error('SDK not initialized or signer not provided');
    }

    try {
      // Record the interaction on-chain
      const tx = await this.contract.recordInteraction(tokenId, interactionType);
      await tx.wait();

      // Get current AI state to check for evolution
      const aiState = await this.contract.getAIState(tokenId);
      const currentInteractionCount = Number(aiState.interactionCount);
      
      // Check if INFT should evolve (every 10 interactions)
      const shouldEvolve = currentInteractionCount > 0 && currentInteractionCount % 10 === 0;
      
      if (shouldEvolve && this.zgdaClient) {
        try {
          // Calculate new level
          const newLevel = Math.floor(currentInteractionCount / 10) + 1;
          
          // Get and update metadata
          const currentMetadataURI = await this.contract.tokenURI(tokenId);
          let currentMetadata: INFTDAMetadata;
          
          if (currentMetadataURI.startsWith('0g-da://')) {
            const blobHash = currentMetadataURI.replace('0g-da://', '');
            currentMetadata = await this.zgdaClient.retrieveMetadata(blobHash);
          } else {
            // Handle other storage types
            throw new Error('Metadata evolution only supported with 0G DA storage');
          }
          
          // Update metadata with evolution
          const evolutionResult = await this.zgdaClient.updateMetadataWithEvolution(
            currentMetadata,
            newLevel,
            `interaction_milestone_${currentInteractionCount}`
          );
          
          const newMetadataURI = `0g-da://${evolutionResult.blobHash}`;
          
          // Update the contract with the new evolved metadata
          const evolutionTx = await this.contract.evolveINFT(
            tokenId,
            newMetadataURI,
            newLevel
          );
          await evolutionTx.wait();
          
          return {
            transactionHash: tx.hash,
            evolved: true,
            newLevel,
            newMetadataURI
          };
        } catch (evolutionError) {
          console.warn('Evolution failed:', evolutionError);
        }
      }
      
      return {
        transactionHash: tx.hash,
        evolved: false
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to record interaction: ${errorMessage}`);
    }
  }

  /**
   * Get the evolution status of an INFT
   */
  async getEvolutionStatus(tokenId: string): Promise<EvolutionStatus> {
    if (!this.contract) {
      throw new Error('SDK not initialized');
    }

    try {
      // Get AI state from contract
      const aiState = await this.contract.getAIState(tokenId);
      const interactionCount = Number(aiState.interactionCount);
      
      // Get metadata
      const metadataURI = await this.contract.tokenURI(tokenId);
      let metadata: INFTDAMetadata;
      
      if (metadataURI.startsWith('0g-da://') && this.zgdaClient) {
        const blobHash = metadataURI.replace('0g-da://', '');
        metadata = await this.zgdaClient.retrieveMetadata(blobHash);
      } else if (metadataURI.startsWith('local://')) {
        const hash = metadataURI.replace('local://', '');
        const storedData = localStorage.getItem(`inft_metadata_${hash}`);
        if (storedData) {
          metadata = JSON.parse(storedData) as INFTDAMetadata;
        } else {
          throw new Error('Could not retrieve metadata');
        }
      } else {
        // Create default metadata structure
        metadata = {
          name: `INFT #${tokenId}`,
          description: 'Default INFT metadata',
          image: '',
          level: Math.floor(interactionCount / 10) + 1,
          experience: interactionCount * 10,
          attributes: [
            { trait_type: 'Level', value: Math.floor(interactionCount / 10) + 1 },
            { trait_type: 'Experience', value: interactionCount * 10 }
          ],
          ai_state: {
            model_version: 'v1.0',
            training_data_hashes: [],
            interaction_count: interactionCount,
            last_updated: Date.now()
          },
          evolution_history: []
        };
      }
      
      const currentLevel = metadata.level || Math.floor(interactionCount / 10) + 1;
      const experience = metadata.experience || interactionCount * 10;
      const nextEvolutionAt = Math.max(0, (currentLevel * 10) - (interactionCount % 10));
      
      return {
        level: currentLevel,
        experience,
        nextEvolutionAt,
        evolutionHistory: metadata.evolution_history || []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get evolution status: ${errorMessage}`);
    }
  }

  /**
   * Get INFT metadata
   */
  async getMetadata(tokenId: string): Promise<INFTDAMetadata> {
    if (!this.contract) {
      throw new Error('SDK not initialized');
    }

    try {
      const metadataURI = await this.contract.tokenURI(tokenId);
      
      if (metadataURI.startsWith('0g-da://') && this.zgdaClient) {
        const blobHash = metadataURI.replace('0g-da://', '');
        return await this.zgdaClient.retrieveMetadata(blobHash);
      } else if (metadataURI.startsWith('local://')) {
        const hash = metadataURI.replace('local://', '');
        const storedData = localStorage.getItem(`inft_metadata_${hash}`);
        if (storedData) {
          return JSON.parse(storedData) as INFTDAMetadata;
        }
      }
      
      throw new Error('Could not retrieve metadata');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get metadata: ${errorMessage}`);
    }
  }

  /**
   * Check if an address owns a specific INFT
   */
  async getOwner(tokenId: string): Promise<string> {
    if (!this.contract) {
      throw new Error('SDK not initialized');
    }

    try {
      return await this.contract.ownerOf(tokenId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get owner: ${errorMessage}`);
    }
  }
}

/**
 * Utility function to create a pre-configured SDK instance for 0G testnet
 */
export function createTestnetSDK(config: {
  privateKey: string;
  contractAddress: string;
  rpcUrl?: string;
}): IntellifySDK {
  const defaultConfig: IntellifySDKConfig = {
    provider: config.rpcUrl || 'https://evmrpc-testnet.0g.ai',
    signer: config.privateKey,
    contractAddress: config.contractAddress,
    zgdaConfig: {
      rpcEndpoint: config.rpcUrl || 'https://evmrpc-testnet.0g.ai',
      privateKey: config.privateKey,
      daEntranceContract: '0x857C0A28A8634614BB2C96039Cf1e5fb6402dF8B',
      daSignersContract: '0x0000000000000000000000000000000000001000',
      grpcEndpoint: 'localhost:51001',
      gasLimit: 2000000
    },
    network: {
      chainId: 16600,
      name: '0G Testnet'
    }
  };

  return new IntellifySDK(defaultConfig);
}

// Default export
export default IntellifySDK;