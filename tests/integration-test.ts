/**
 * Integration Tests for Intellify INFT with 0G DA Integration
 * 
 * This test suite verifies:
 * 1. 0G Data Availability integration
 * 2. INFT evolution system
 * 3. SDK functionality
 * 4. Backward compatibility
 * 5. Contract interactions
 */

import { IntellifyClient } from '../src/lib/intellify-client';
import { ZGDAClient } from '../src/lib/0g-da-client';
import { IntellifySDK, createTestnetSDK } from '../sdk/index';
import { ethers } from 'ethers';

// Test configuration
const TEST_CONFIG = {
  // Use test private key (DO NOT use in production)
  privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  contractAddress: '0x1234567890123456789012345678901234567890', // Replace with deployed contract
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  zgdaEndpoint: 'https://da-testnet.0g.ai'
};

/**
 * Test 1: 0G Data Availability Client Integration
 */
async function test0GDAIntegration(): Promise<boolean> {
  console.log('\n=== Testing 0G DA Integration ===');
  
  try {
    // Initialize 0G DA client
    const zgdaClient = new ZGDAClient({
      rpcEndpoint: TEST_CONFIG.rpcUrl,
      privateKey: TEST_CONFIG.privateKey,
      daEntranceContract: '0x857C0A28A8634614BB2C96039Cf1e5fb6402dF8B',
      daSignersContract: '0x0000000000000000000000000000000000001000',
      grpcEndpoint: 'localhost:51001',
      gasLimit: 2000000
    });
    
    console.log('✅ 0G DA client initialized');
    
    // Test metadata submission
    const testMetadata = {
      name: 'Test INFT',
      description: 'Test metadata for 0G DA',
      image: 'https://example.com/test.png',
      level: 1,
      experience: 0,
      attributes: [{ trait_type: 'Test', value: 'Value' }],
      ai_state: {
        model_version: 'v1.0',
        training_data_hashes: [],
        interaction_count: 0,
        last_updated: Date.now()
      },
      evolution_history: [{
        level: 1,
        timestamp: Date.now(),
        trigger_event: 'test_creation',
        metadata_hash: ''
      }]
    };
    
    const submitResult = await zgdaClient.submitMetadata(testMetadata);
    console.log('✅ Metadata submitted to 0G DA:', submitResult.blobHash);
    
    // Test metadata retrieval
    const retrievedMetadata = await zgdaClient.retrieveMetadata(submitResult.blobHash);
    console.log('✅ Metadata retrieved from 0G DA');
    
    // Verify data integrity
    if (retrievedMetadata.name === testMetadata.name && 
        retrievedMetadata.level === testMetadata.level) {
      console.log('✅ Data integrity verified');
      return true;
    } else {
      console.error('❌ Data integrity check failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 0G DA integration test failed:', error);
    return false;
  }
}

/**
 * Test 2: INFT Evolution System
 */
async function testEvolutionSystem(): Promise<boolean> {
  console.log('\n=== Testing INFT Evolution System ===');
  
  try {
    // Initialize Intellify client
    const client = new IntellifyClient({
      rpcUrl: TEST_CONFIG.rpcUrl,
      indexerRpc: 'https://indexer-storage-testnet-turbo.0g.ai',
      contractAddress: TEST_CONFIG.contractAddress,
      privateKey: TEST_CONFIG.privateKey
    });
    await client.initialize();
    console.log('✅ Intellify client initialized');
    
    // Create test file (mock)
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Create knowledge companion
    const companion = await client.createKnowledgeCompanion(testFile);
    console.log('✅ Knowledge companion created:', companion.tokenId);
    
    // Test multiple interactions to trigger evolution
    console.log('Testing interaction tracking and evolution...');
    let evolutionOccurred = false;
    
    for (let i = 0; i < 12; i++) {
      const interactionResult = await client.recordInteractionWithEvolution(
        companion.tokenId,
        `test_interaction_${i}`
      );
      
      console.log(`Interaction ${i + 1}: ${interactionResult.evolved ? 'EVOLVED!' : 'recorded'}`);
      
      if (interactionResult.evolved) {
        evolutionOccurred = true;
        console.log(`✅ Evolution detected at level ${interactionResult.newLevel}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check evolution status
    const evolutionStatus = await client.getINFTEvolutionStatus(companion.tokenId);
    console.log('✅ Evolution status retrieved:', {
      level: evolutionStatus.level,
      experience: evolutionStatus.experience,
      nextEvolutionAt: evolutionStatus.nextEvolutionAt
    });
    
    return evolutionOccurred && evolutionStatus.level > 1;
    
  } catch (error) {
    console.error('❌ Evolution system test failed:', error);
    return false;
  }
}

/**
 * Test 3: SDK Functionality
 */
async function testSDKFunctionality(): Promise<boolean> {
  console.log('\n=== Testing SDK Functionality ===');
  
  try {
    // Test testnet SDK helper
    const sdk = createTestnetSDK({
      privateKey: TEST_CONFIG.privateKey,
      contractAddress: TEST_CONFIG.contractAddress
    });
    
    await sdk.initialize();
    console.log('✅ SDK initialized with testnet helper');
    
    // Test INFT creation
    const inftResult = await sdk.createINFT({
      name: 'SDK Test INFT',
      description: 'Testing SDK functionality',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzQyODVmNCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+U0RLPC90ZXh0Pjwvc3ZnPg==',
      aiPersonality: 'SDK test personality'
    });
    
    console.log('✅ INFT created via SDK:', inftResult.tokenId);
    
    // Test interaction recording
    const interactionResult = await sdk.recordInteraction(inftResult.tokenId, 'sdk_test');
    console.log('✅ Interaction recorded via SDK');
    
    // Test status retrieval
    const status = await sdk.getEvolutionStatus(inftResult.tokenId);
    console.log('✅ Evolution status retrieved via SDK:', {
      level: status.level,
      experience: status.experience
    });
    
    // Test metadata retrieval
    const metadata = await sdk.getMetadata(inftResult.tokenId);
    console.log('✅ Metadata retrieved via SDK:', metadata.name);
    
    // Test owner retrieval
    const owner = await sdk.getOwner(inftResult.tokenId);
    console.log('✅ Owner retrieved via SDK:', owner);
    
    return true;
    
  } catch (error) {
    console.error('❌ SDK functionality test failed:', error);
    return false;
  }
}

/**
 * Test 4: Backward Compatibility
 */
async function testBackwardCompatibility(): Promise<boolean> {
  console.log('\n=== Testing Backward Compatibility ===');
  
  try {
    // Test that existing IntellifyClient methods still work
    const client = new IntellifyClient({
      rpcUrl: TEST_CONFIG.rpcUrl,
      indexerRpc: 'https://indexer-storage-testnet-turbo.0g.ai',
      contractAddress: TEST_CONFIG.contractAddress,
      privateKey: TEST_CONFIG.privateKey
    });
    await client.initialize();
    
    console.log('✅ Legacy client initialization works');
    
    // Test legacy file upload (should fallback gracefully)
    const testFile = new File(['legacy test'], 'legacy.txt', { type: 'text/plain' });
    
    try {
      const uploadResult = await client.uploadFile(testFile);
      console.log('✅ Legacy file upload works:', uploadResult);
    } catch (error) {
      console.log('⚠️ Legacy file upload failed (expected if not implemented):', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Test that new methods are available
    if (typeof client.recordInteractionWithEvolution === 'function') {
      console.log('✅ New evolution methods available');
    } else {
      console.error('❌ New evolution methods not available');
      return false;
    }
    
    if (typeof client.getINFTEvolutionStatus === 'function') {
      console.log('✅ New status methods available');
    } else {
      console.error('❌ New status methods not available');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Backward compatibility test failed:', error);
    return false;
  }
}

/**
 * Test 5: Error Handling and Edge Cases
 */
async function testErrorHandling(): Promise<boolean> {
  console.log('\n=== Testing Error Handling ===');
  
  try {
    // Test invalid configuration
    try {
      const invalidSDK = new IntellifySDK({
        provider: 'invalid-url',
        contractAddress: '0x0000000000000000000000000000000000000000'
      });
      await invalidSDK.initialize();
      console.error('❌ Should have failed with invalid config');
      return false;
    } catch (error) {
      console.log('✅ Invalid configuration properly rejected');
    }
    
    // Test operations without initialization
    try {
      const uninitializedSDK = new IntellifySDK({
        provider: TEST_CONFIG.rpcUrl,
        contractAddress: TEST_CONFIG.contractAddress
      });
      
      await uninitializedSDK.createINFT({
        name: 'Test',
        description: 'Test',
        image: 'test'
      });
      
      console.error('❌ Should have failed without initialization');
      return false;
    } catch (error) {
      console.log('✅ Uninitialized operations properly rejected');
    }
    
    // Test invalid token operations
    const sdk = createTestnetSDK({
      privateKey: TEST_CONFIG.privateKey,
      contractAddress: TEST_CONFIG.contractAddress
    });
    
    await sdk.initialize();
    
    try {
      await sdk.getOwner('999999'); // Non-existent token
      console.error('❌ Should have failed with non-existent token');
      return false;
    } catch (error) {
      console.log('✅ Non-existent token operations properly rejected');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
    return false;
  }
}

/**
 * Test 6: Performance and Gas Optimization
 */
async function testPerformance(): Promise<boolean> {
  console.log('\n=== Testing Performance ===');
  
  try {
    const sdk = createTestnetSDK({
      privateKey: TEST_CONFIG.privateKey,
      contractAddress: TEST_CONFIG.contractAddress
    });
    
    await sdk.initialize();
    
    // Test batch operations (if available)
    console.log('Testing batch operations...');
    
    // Create multiple INFTs for batch testing
    const tokenIds: string[] = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 3; i++) {
      const result = await sdk.createINFT({
        name: `Batch Test INFT ${i}`,
        description: `Batch test ${i}`,
        image: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1MCIgeT0iNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPiR7aX08L3RleHQ+PC9zdmc+`
      });
      tokenIds.push(result.tokenId);
    }
    
    const creationTime = Date.now() - startTime;
    console.log(`✅ Created ${tokenIds.length} INFTs in ${creationTime}ms`);
    
    // Test concurrent interactions
    const interactionPromises = tokenIds.map(tokenId => 
      sdk.recordInteraction(tokenId, 'performance_test')
    );
    
    const interactionStartTime = Date.now();
    await Promise.all(interactionPromises);
    const interactionTime = Date.now() - interactionStartTime;
    
    console.log(`✅ Recorded ${tokenIds.length} interactions concurrently in ${interactionTime}ms`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return false;
  }
}

/**
 * Main test runner
 */
async function runIntegrationTests(): Promise<void> {
  console.log('🚀 Starting Intellify INFT Integration Tests\n');
  console.log('⚠️  Note: These tests require a deployed contract and testnet access');
  console.log('⚠️  Update TEST_CONFIG with your actual contract address and private key\n');
  
  const tests = [
    { name: '0G DA Integration', fn: test0GDAIntegration },
    { name: 'Evolution System', fn: testEvolutionSystem },
    { name: 'SDK Functionality', fn: testSDKFunctionality },
    { name: 'Backward Compatibility', fn: testBackwardCompatibility },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Performance', fn: testPerformance }
  ];
  
  const results: { name: string; passed: boolean; error?: string }[] = [];
  
  for (const test of tests) {
    try {
      console.log(`\n--- Running ${test.name} Test ---`);
      const passed = await test.fn();
      results.push({ name: test.name, passed });
      
      if (passed) {
        console.log(`✅ ${test.name} test PASSED`);
      } else {
        console.log(`❌ ${test.name} test FAILED`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ name: test.name, passed: false, error: errorMessage });
      console.log(`❌ ${test.name} test FAILED with error: ${errorMessage}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const error = result.error ? ` (${result.error})` : '';
    console.log(`${status} - ${result.name}${error}`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 All integration tests passed! The system is ready for deployment.');
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues before deployment.');
  }
  
  console.log('\n✨ Integration testing completed!');
}

// Export for use in other test files
export {
  test0GDAIntegration,
  testEvolutionSystem,
  testSDKFunctionality,
  testBackwardCompatibility,
  testErrorHandling,
  testPerformance,
  runIntegrationTests
};

// Run tests if executed directly
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}