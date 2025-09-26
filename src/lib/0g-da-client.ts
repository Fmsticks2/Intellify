import { ethers } from 'ethers';

/**
 * 0G Data Availability Client for storing and retrieving INFT metadata
 * Integrates with 0G DA network for decentralized metadata storage
 */

// 0G DA Configuration
export interface ZGDAConfig {
  rpcEndpoint: string;
  privateKey: string | undefined;
  daEntranceContract: string;
  daSignersContract: string;
  grpcEndpoint: string;
  gasLimit: number;
}

// Blob submission response
export interface BlobSubmissionResult {
  blobHash: string;
  commitmentHash: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

// Blob retrieval result
export interface BlobRetrievalResult {
  data: Uint8Array;
  metadata: {
    blobHash: string;
    size: number;
    timestamp: number;
    contentType: string;
  };
}

// INFT Metadata structure for 0G DA storage
export interface INFTDAMetadata {
  name: string;
  description: string;
  image: string;
  level: number;
  experience: number;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  ai_state: {
    model_version: string;
    training_data_hashes: string[];
    interaction_count: number;
    last_updated: number;
  };
  evolution_history: Array<{
    level: number;
    timestamp: number;
    trigger_event: string;
    metadata_hash: string;
  }>;
}

export class ZGDAClient {
  private config: ZGDAConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private daEntranceContract: ethers.Contract;

  // 0G DA Contract ABI (simplified)
  private static readonly DA_ENTRANCE_ABI = [
    'function submitBlob(bytes calldata data, uint256 quorumThreshold) external payable returns (bytes32)',
    'function getBlobStatus(bytes32 blobHash) external view returns (uint8, uint256, bytes32)',
    'function getBlobCommitment(bytes32 blobHash) external view returns (bytes32)',
    'event BlobSubmitted(bytes32 indexed blobHash, address indexed submitter, uint256 size)',
    'event BlobConfirmed(bytes32 indexed blobHash, bytes32 indexed commitmentHash)'
  ];

  constructor(config: ZGDAConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcEndpoint);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.daEntranceContract = new ethers.Contract(
      config.daEntranceContract,
      ZGDAClient.DA_ENTRANCE_ABI,
      this.wallet
    );
  }

  /**
   * Submit INFT metadata to 0G DA network
   */
  async submitMetadata(metadata: INFTDAMetadata): Promise<BlobSubmissionResult> {
    try {
      // Serialize metadata to JSON
      const metadataJson = JSON.stringify(metadata, null, 2);
      const metadataBytes = ethers.toUtf8Bytes(metadataJson);

      // Submit blob to 0G DA network
      const tx = await this.daEntranceContract.submitBlob(
        metadataBytes,
        1, // Quorum threshold
        {
          gasLimit: this.config.gasLimit,
          value: ethers.parseEther('0.001') // Small fee for DA storage
        }
      );

      const receipt = await tx.wait();
      const blobSubmittedEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'BlobSubmitted'
      );

      if (!blobSubmittedEvent) {
        throw new Error('BlobSubmitted event not found in transaction receipt');
      }

      const blobHash = blobSubmittedEvent.args[0];
      const commitmentHash = await this.daEntranceContract.getBlobCommitment(blobHash);

      return {
        blobHash,
        commitmentHash,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to submit metadata to 0G DA: ${errorMessage}`);
    }
  }

  /**
   * Retrieve INFT metadata from 0G DA network
   */
  async retrieveMetadata(blobHash: string): Promise<INFTDAMetadata> {
    try {
      // Check blob status first
      const [status, size, commitmentHash] = await this.daEntranceContract.getBlobStatus(blobHash);
      
      if (status === 0) {
        throw new Error('Blob not found or not confirmed');
      }

      // For now, we'll use a mock retrieval since the full 0G DA retriever setup
      // requires additional infrastructure. In production, this would use the
      // 0G DA retriever gRPC API to fetch the actual blob data.
      const mockRetrievalResult = await this.mockRetrieveBlob(blobHash);
      
      if (!mockRetrievalResult) {
        throw new Error('Failed to retrieve blob data');
      }

      // Parse the retrieved data as JSON
      const metadataJson = ethers.toUtf8String(mockRetrievalResult.data);
      const metadata = JSON.parse(metadataJson) as INFTDAMetadata;

      return metadata;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve metadata from 0G DA: ${errorMessage}`);
    }
  }

  /**
   * Update INFT metadata with evolution data
   */
  async updateMetadataWithEvolution(
    currentMetadata: INFTDAMetadata,
    newLevel: number,
    triggerEvent: string
  ): Promise<BlobSubmissionResult> {
    // Create updated metadata with evolution history
    const updatedMetadata: INFTDAMetadata = {
      ...currentMetadata,
      level: newLevel,
      experience: currentMetadata.experience + 100, // Add experience points
      image: this.generateLevelImage(newLevel), // Generate new image for level
      attributes: [
        ...currentMetadata.attributes.filter(attr => attr.trait_type !== 'Level'),
        { trait_type: 'Level', value: newLevel },
        { trait_type: 'Experience', value: currentMetadata.experience + 100 }
      ],
      evolution_history: [
        ...currentMetadata.evolution_history,
        {
          level: newLevel,
          timestamp: Date.now(),
          trigger_event: triggerEvent,
          metadata_hash: '' // Will be filled after submission
        }
      ]
    };

    // Submit updated metadata
    const result = await this.submitMetadata(updatedMetadata);
    
    // Update the metadata hash in evolution history
    updatedMetadata.evolution_history[updatedMetadata.evolution_history.length - 1].metadata_hash = result.blobHash;
    
    return result;
  }

  /**
   * Generate level-specific image URL (placeholder implementation)
   */
  private generateLevelImage(level: number): string {
    // In production, this would generate or fetch level-specific images
    // For now, return a placeholder with level indicator
    return `https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Intellify+INFT+Level+${level}`;
  }

  /**
   * Mock blob retrieval (placeholder for actual 0G DA retriever)
   * In production, this would use the 0G DA retriever gRPC API
   */
  private async mockRetrieveBlob(blobHash: string): Promise<BlobRetrievalResult | null> {
    // For Wave 2 demo, store blob data in localStorage with hash as key
    const storedData = localStorage.getItem(`0g_da_blob_${blobHash}`);
    
    if (!storedData) {
      return null;
    }

    const data = ethers.toUtf8Bytes(storedData);
    
    return {
      data,
      metadata: {
        blobHash,
        size: data.length,
        timestamp: Date.now(),
        contentType: 'application/json'
      }
    };
  }

  /**
   * Store blob data locally for demo purposes
   */
  async storeBlobLocally(blobHash: string, data: string): Promise<void> {
    localStorage.setItem(`0g_da_blob_${blobHash}`, data);
  }

  /**
   * Get blob status from 0G DA network
   */
  async getBlobStatus(blobHash: string): Promise<{
    status: number;
    size: number;
    commitmentHash: string;
  }> {
    try {
      const [status, size, commitmentHash] = await this.daEntranceContract.getBlobStatus(blobHash);
      return {
        status: Number(status),
        size: Number(size),
        commitmentHash
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get blob status: ${errorMessage}`);
    }
  }

  /**
   * Create initial INFT metadata structure
   */
  static createInitialMetadata(
    name: string,
    description: string,
    knowledgeHash: string,
    modelVersion: string,
    owner: string
  ): INFTDAMetadata {
    return {
      name,
      description,
      image: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Intellify+INFT+Level+1',
      level: 1,
      experience: 0,
      attributes: [
        { trait_type: 'Level', value: 1 },
        { trait_type: 'Experience', value: 0 },
        { trait_type: 'Model Version', value: modelVersion },
        { trait_type: 'Knowledge Hash', value: knowledgeHash },
        { trait_type: 'Owner', value: owner },
        { trait_type: 'Created', value: new Date().toISOString() }
      ],
      ai_state: {
        model_version: modelVersion,
        training_data_hashes: [knowledgeHash],
        interaction_count: 0,
        last_updated: Date.now()
      },
      evolution_history: [
        {
          level: 1,
          timestamp: Date.now(),
          trigger_event: 'initial_creation',
          metadata_hash: ''
        }
      ]
    };
  }
}

// Default 0G DA configuration for testnet
export const DEFAULT_ZGDA_CONFIG: ZGDAConfig = {
  rpcEndpoint: 'https://evmrpc-testnet.0g.ai',
  privateKey: process.env.PRIVATE_KEY || '',
  daEntranceContract: '0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9', // 0G DA testnet contract
  daSignersContract: '0x0000000000000000000000000000000000001000',
  grpcEndpoint: 'localhost:51001', // Local 0G DA client gRPC endpoint
  gasLimit: 2000000
};

/**
 * Create a new 0G DA client instance
 */
export const createZGDAClient = (config?: Partial<ZGDAConfig>): ZGDAClient => {
  const finalConfig = { ...DEFAULT_ZGDA_CONFIG, ...config };
  return new ZGDAClient(finalConfig);
};