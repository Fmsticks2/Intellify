import { ethers } from 'ethers';
import { ZGDAConfig, INFTDAMetadata } from './0g-da-client';

/**
 * 0G Compute Client for executing AI computations on the 0G Network
 * Integrates with 0G Compute network for decentralized AI processing
 */

// 0G Compute Configuration extends DA Configuration
export interface ZGComputeConfig extends ZGDAConfig {
  computeContract: string;
  computeNodeEndpoint: string;
  maxComputeUnits: number;
}

// Compute Job Types
export enum ComputeJobType {
  INFERENCE = 'inference',
  TRAINING = 'training',
  FINE_TUNING = 'fine_tuning',
  EMBEDDING = 'embedding'
}

// Compute Job Status
export enum ComputeJobStatus {
  PENDING = 0,
  RUNNING = 1,
  COMPLETED = 2,
  FAILED = 3
}

// Compute Job Request
export interface ComputeJobRequest {
  jobType: ComputeJobType;
  modelId: string;
  inputDataHash: string;
  parameters: Record<string, any>;
  callbackAddress?: string;
}

// Compute Job Result
export interface ComputeJobResult {
  jobId: string;
  status: ComputeJobStatus;
  resultHash?: string;
  errorMessage?: string;
  computeUnitsUsed: number;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export class ZGComputeClient {
  private config: ZGComputeConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private computeContract: ethers.Contract;

  // 0G Compute Contract ABI
  private static readonly COMPUTE_ABI = [
    'function submitComputeJob(uint8 jobType, string calldata modelId, bytes32 inputDataHash, bytes calldata parameters, address callbackAddress) external payable returns (bytes32)',
    'function getJobStatus(bytes32 jobId) external view returns (uint8, bytes32, uint256, string memory)',
    'function cancelJob(bytes32 jobId) external returns (bool)',
    'event ComputeJobSubmitted(bytes32 indexed jobId, address indexed submitter, uint8 jobType)',
    'event ComputeJobCompleted(bytes32 indexed jobId, bytes32 indexed resultHash, uint256 computeUnitsUsed)',
    'event ComputeJobFailed(bytes32 indexed jobId, string reason)'
  ];

  constructor(config: ZGComputeConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcEndpoint);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.computeContract = new ethers.Contract(
      config.computeContract,
      ZGComputeClient.COMPUTE_ABI,
      this.wallet
    );
  }

  /**
   * Submit a compute job to the 0G Network
   */
  async submitComputeJob(request: ComputeJobRequest): Promise<ComputeJobResult> {
    try {
      // Convert job type to uint8
      const jobTypeValue = Object.values(ComputeJobType).indexOf(request.jobType);
      if (jobTypeValue === -1) {
        throw new Error(`Invalid job type: ${request.jobType}`);
      }

      // Serialize parameters
      const parametersBytes = ethers.toUtf8Bytes(JSON.stringify(request.parameters));

      // Submit compute job
      const tx = await this.computeContract.submitComputeJob(
        jobTypeValue,
        request.modelId,
        request.inputDataHash,
        parametersBytes,
        request.callbackAddress || ethers.ZeroAddress,
        {
          gasLimit: this.config.gasLimit,
          value: ethers.parseEther('0.01') // Fee for compute resources
        }
      );

      const receipt = await tx.wait();
      const jobSubmittedEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'ComputeJobSubmitted'
      );

      if (!jobSubmittedEvent) {
        throw new Error('ComputeJobSubmitted event not found in transaction receipt');
      }

      const jobId = jobSubmittedEvent.args[0];

      return {
        jobId,
        status: ComputeJobStatus.PENDING,
        computeUnitsUsed: 0,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to submit compute job: ${errorMessage}`);
    }
  }

  /**
   * Check the status of a compute job
   */
  async getJobStatus(jobId: string): Promise<ComputeJobResult> {
    try {
      const [status, resultHash, computeUnitsUsed, errorMessage] = 
        await this.computeContract.getJobStatus(jobId);

      return {
        jobId,
        status,
        resultHash: resultHash !== ethers.ZeroHash ? resultHash : undefined,
        errorMessage: errorMessage || undefined,
        computeUnitsUsed: Number(computeUnitsUsed),
        transactionHash: '', // Not available in status check
        blockNumber: 0,      // Not available in status check
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get job status: ${errorMessage}`);
    }
  }

  /**
   * Cancel a running compute job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const tx = await this.computeContract.cancelJob(jobId, {
        gasLimit: this.config.gasLimit
      });
      
      await tx.wait();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to cancel job: ${errorMessage}`);
    }
  }

  /**
   * Run AI inference on INFT metadata
   */
  async runInference(metadata: INFTDAMetadata, prompt: string): Promise<string> {
    try {
      // Create input data with metadata and prompt
      const inputData = {
        metadata,
        prompt,
        timestamp: Date.now()
      };

      // Hash the input data
      const inputDataJson = JSON.stringify(inputData);
      const inputDataHash = ethers.keccak256(ethers.toUtf8Bytes(inputDataJson));

      // Submit inference job
      const jobResult = await this.submitComputeJob({
        jobType: ComputeJobType.INFERENCE,
        modelId: metadata.ai_state.model_version,
        inputDataHash,
        parameters: {
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9
        }
      });

      // Poll for job completion
      let result = await this.pollJobCompletion(jobResult.jobId);
      
      if (result.status === ComputeJobStatus.FAILED) {
        throw new Error(`Inference failed: ${result.errorMessage}`);
      }

      // In a real implementation, we would retrieve the result data using the resultHash
      // For now, we'll return a mock result
      return `AI response to "${prompt}" based on INFT knowledge at level ${metadata.level}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to run inference: ${errorMessage}`);
    }
  }

  /**
   * Poll for job completion with timeout
   */
  private async pollJobCompletion(jobId: string, timeoutMs = 30000): Promise<ComputeJobResult> {
    const startTime = Date.now();
    let lastResult: ComputeJobResult | null = null;

    while (Date.now() - startTime < timeoutMs) {
      const result = await this.getJobStatus(jobId);
      lastResult = result;

      if (result.status === ComputeJobStatus.COMPLETED || result.status === ComputeJobStatus.FAILED) {
        return result;
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!lastResult) {
      throw new Error('Failed to get job status within timeout period');
    }

    return lastResult;
  }
}