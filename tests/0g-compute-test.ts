import { expect } from 'chai';
import { ethers } from 'ethers';
import { ZGComputeClient, ComputeJobType, ComputeJobStatus } from '../src/lib/0g-compute-client';
import { IntellifyClient } from '../src/lib/intellify-client';

describe('0G Compute Integration Tests', () => {
  // Mock config for testing
  const mockConfig = {
    rpcUrl: 'https://testnet-rpc.0g.network',
    indexerRpc: 'https://testnet-indexer.0g.network',
    contractAddress: '0x37525E8B82C776F608eCA8A49C000b98a456fBdD',
    privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // Test private key
    computeContract: '0x9876543210fedcba9876543210fedcba98765432',
    computeNodeEndpoint: 'https://testnet-compute.0g.network',
    maxComputeUnits: 100
  };

  let computeClient: ZGComputeClient;
  let intellifyClient: IntellifyClient;

  before(() => {
    // Initialize compute client for testing
    computeClient = new ZGComputeClient({
      rpcEndpoint: mockConfig.rpcUrl,
      privateKey: mockConfig.privateKey,
      daEntranceContract: '0x1234567890123456789012345678901234567890',
      daSignersContract: '0x0987654321098765432109876543210987654321',
      grpcEndpoint: mockConfig.indexerRpc,
      gasLimit: 500000,
      computeContract: mockConfig.computeContract,
      computeNodeEndpoint: mockConfig.computeNodeEndpoint,
      maxComputeUnits: mockConfig.maxComputeUnits
    });

    // Initialize intellify client
    intellifyClient = new IntellifyClient(mockConfig);
  });

  describe('ZGComputeClient', () => {
    it('should initialize correctly', () => {
      expect(computeClient).to.not.be.undefined;
    });

    it('should mock submit a compute job', async () => {
      // Mock the contract call
      computeClient.computeContract = {
        submitComputeJob: async () => {
          return {
            wait: async () => {
              return {
                logs: [
                  {
                    fragment: { name: 'ComputeJobSubmitted' },
                    args: ['0x1234567890abcdef1234567890abcdef12345678'],
                    hash: '0xabcdef1234567890abcdef1234567890abcdef12'
                  }
                ],
                blockNumber: 12345
              };
            },
            hash: '0xabcdef1234567890abcdef1234567890abcdef12'
          };
        }
      } as any;

      const result = await computeClient.submitComputeJob({
        jobType: ComputeJobType.INFERENCE,
        modelId: 'intellify-v1.0',
        inputDataHash: '0x1234567890abcdef1234567890abcdef12345678',
        parameters: { max_tokens: 1000 }
      });

      expect(result).to.not.be.undefined;
      expect(result.jobId).to.equal('0x1234567890abcdef1234567890abcdef12345678');
      expect(result.status).to.equal(ComputeJobStatus.PENDING);
    });

    it('should mock get job status', async () => {
      // Mock the contract call
      computeClient.computeContract = {
        getJobStatus: async () => {
          return [
            ComputeJobStatus.COMPLETED,
            '0xabcdef1234567890abcdef1234567890abcdef12',
            100,
            ''
          ];
        }
      } as any;

      const result = await computeClient.getJobStatus('0x1234567890abcdef1234567890abcdef12345678');

      expect(result).to.not.be.undefined;
      expect(result.status).to.equal(ComputeJobStatus.COMPLETED);
      expect(result.resultHash).to.equal('0xabcdef1234567890abcdef1234567890abcdef12');
      expect(result.computeUnitsUsed).to.equal(100);
    });
  });

  describe('IntellifyClient with 0G Compute', () => {
    it('should handle AI requests with compute integration', async () => {
      // Mock the necessary methods
      intellifyClient.computeClient = {
        submitComputeJob: async () => {
          return {
            jobId: '0x1234567890abcdef1234567890abcdef12345678',
            status: ComputeJobStatus.COMPLETED,
            resultHash: '0xabcdef1234567890abcdef1234567890abcdef12',
            computeUnitsUsed: 50,
            output: 'This is a test AI response',
            tokensUsed: 150,
            transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
            blockNumber: 12345,
            timestamp: Date.now()
          };
        }
      } as any;

      // Mock other required methods
      intellifyClient.recordInteraction = async () => {};
      intellifyClient.getAIState = async () => ({
        modelVersion: 'intellify-v1.0',
        knowledgeHashes: ['hash1', 'hash2'],
        interactionCount: 5,
        lastUpdated: Date.now(),
        isActive: true
      });

      const response = await intellifyClient.getAIResponse('1', {
        type: 'qa',
        content: 'Test content',
        question: 'Test question?'
      });

      expect(response).to.not.be.undefined;
      expect(response.response).to.equal('This is a test AI response');
      expect(response.confidence).to.be.greaterThan(0);
      expect(response.tokens_used).to.equal(150);
    });
  });
});