/**
 * Basic Usage Example for Intellify INFT SDK
 * 
 * This example demonstrates how to:
 * 1. Initialize the SDK
 * 2. Create an evolving INFT
 * 3. Record interactions
 * 4. Check evolution status
 */

import { IntellifySDK, createTestnetSDK, CreateINFTParams } from '../index';
import { ethers } from 'ethers';

// Example 1: Basic SDK initialization
async function basicExample() {
  console.log('=== Basic Intellify INFT SDK Example ===');
  
  // Initialize SDK with custom configuration
  const sdk = new IntellifySDK({
    provider: 'https://evmrpc-testnet.0g.ai',
    signer: 'YOUR_PRIVATE_KEY_HERE', // Replace with your private key
    contractAddress: '0x1234567890123456789012345678901234567890', // Replace with deployed contract
    zgdaConfig: {
      endpoint: 'https://da-testnet.0g.ai',
      privateKey: 'YOUR_PRIVATE_KEY_HERE',
      chainId: 16600,
      contractAddress: '0x857C0A28a8634614BB2C96039Cf1e5fb6402dF8B'
    }
  });

  try {
    // Initialize the SDK
    await sdk.initialize();
    console.log('✅ SDK initialized successfully');

    // Create a new INFT
    const inftParams: CreateINFTParams = {
      name: 'My AI Companion',
      description: 'An evolving AI companion that grows with interactions',
      image: 'https://example.com/genesis-image.png',
      aiPersonality: 'Friendly, curious, and eager to learn',
      attributes: [
        { trait_type: 'Species', value: 'Digital Companion' },
        { trait_type: 'Rarity', value: 'Genesis' }
      ]
    };

    const result = await sdk.createINFT(inftParams);
    console.log('✅ INFT created:', {
      tokenId: result.tokenId,
      transactionHash: result.transactionHash,
      metadataURI: result.metadataURI
    });

    // Record some interactions
    console.log('\n=== Recording Interactions ===');
    const interactions = ['chat', 'question', 'compliment', 'game', 'learning'];
    
    for (let i = 0; i < 12; i++) { // 12 interactions to trigger evolution
      const interactionType = interactions[i % interactions.length];
      const interactionResult = await sdk.recordInteraction(result.tokenId, interactionType);
      
      console.log(`Interaction ${i + 1} (${interactionType}):`, {
        evolved: interactionResult.evolved,
        newLevel: interactionResult.newLevel
      });
      
      if (interactionResult.evolved) {
        console.log('🎉 INFT evolved to level', interactionResult.newLevel);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check final evolution status
    const evolutionStatus = await sdk.getEvolutionStatus(result.tokenId);
    console.log('\n=== Final Evolution Status ===');
    console.log({
      level: evolutionStatus.level,
      experience: evolutionStatus.experience,
      nextEvolutionAt: evolutionStatus.nextEvolutionAt,
      evolutionHistory: evolutionStatus.evolutionHistory
    });

    // Get current metadata
    const metadata = await sdk.getMetadata(result.tokenId);
    console.log('\n=== Current Metadata ===');
    console.log({
      name: metadata.name,
      level: metadata.level,
      experience: metadata.experience,
      aiPersonality: metadata.ai_personality
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 2: Using the testnet helper
async function testnetExample() {
  console.log('\n=== Testnet Helper Example ===');
  
  // Create SDK instance for 0G testnet with minimal configuration
  const sdk = createTestnetSDK({
    privateKey: 'YOUR_PRIVATE_KEY_HERE', // Replace with your private key
    contractAddress: '0x1234567890123456789012345678901234567890' // Replace with deployed contract
  });

  try {
    await sdk.initialize();
    console.log('✅ Testnet SDK initialized');

    // Create a simple INFT
    const result = await sdk.createINFT({
      name: 'Testnet Companion',
      description: 'A test INFT on 0G testnet',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzQyODVmNCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+QUk8L3RleHQ+PC9zdmc+'
    });

    console.log('✅ Testnet INFT created:', result.tokenId);

    // Record a few interactions
    for (let i = 0; i < 5; i++) {
      await sdk.recordInteraction(result.tokenId, 'test_interaction');
      console.log(`✅ Recorded interaction ${i + 1}`);
    }

    // Check status
    const status = await sdk.getEvolutionStatus(result.tokenId);
    console.log('Current status:', {
      level: status.level,
      experience: status.experience,
      nextEvolutionAt: status.nextEvolutionAt
    });

  } catch (error) {
    console.error('❌ Testnet error:', error);
  }
}

// Example 3: Read-only operations (no signer required)
async function readOnlyExample() {
  console.log('\n=== Read-Only Example ===');
  
  // Initialize SDK without signer for read-only operations
  const sdk = new IntellifySDK({
    provider: 'https://evmrpc-testnet.0g.ai',
    contractAddress: '0x1234567890123456789012345678901234567890', // Replace with deployed contract
    zgdaConfig: {
      endpoint: 'https://da-testnet.0g.ai',
      privateKey: '', // Empty for read-only
      chainId: 16600,
      contractAddress: '0x857C0A28a8634614BB2C96039Cf1e5fb6402dF8B'
    }
  });

  try {
    await sdk.initialize();
    console.log('✅ Read-only SDK initialized');

    // Example token ID (replace with actual token ID)
    const tokenId = '1';

    // Get owner
    const owner = await sdk.getOwner(tokenId);
    console.log('Token owner:', owner);

    // Get evolution status
    const status = await sdk.getEvolutionStatus(tokenId);
    console.log('Evolution status:', status);

    // Get metadata
    const metadata = await sdk.getMetadata(tokenId);
    console.log('Metadata:', {
      name: metadata.name,
      description: metadata.description,
      level: metadata.level
    });

  } catch (error) {
    console.error('❌ Read-only error:', error);
  }
}

// Example 4: Error handling and best practices
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');
  
  const sdk = createTestnetSDK({
    privateKey: 'invalid_key', // Intentionally invalid
    contractAddress: '0x0000000000000000000000000000000000000000' // Invalid contract
  });

  try {
    await sdk.initialize();
    
    // This will fail due to invalid configuration
    await sdk.createINFT({
      name: 'Test',
      description: 'Test',
      image: 'test'
    });
    
  } catch (error) {
    console.log('✅ Properly caught error:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Best practices:
  console.log('\n=== Best Practices ===');
  console.log('1. Always call initialize() before using other methods');
  console.log('2. Handle errors appropriately with try-catch blocks');
  console.log('3. Use read-only mode when you only need to query data');
  console.log('4. Store private keys securely (use environment variables)');
  console.log('5. Test on testnet before mainnet deployment');
  console.log('6. Monitor gas costs for interactions and minting');
}

// Run examples
async function runExamples() {
  console.log('🚀 Starting Intellify INFT SDK Examples\n');
  
  // Uncomment the examples you want to run:
  // await basicExample();
  // await testnetExample();
  // await readOnlyExample();
  await errorHandlingExample();
  
  console.log('\n✨ Examples completed!');
}

// Execute if run directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  basicExample,
  testnetExample,
  readOnlyExample,
  errorHandlingExample
};