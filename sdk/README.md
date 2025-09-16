# Intellify INFT SDK

[![npm version](https://badge.fury.io/js/%40intellify%2Finft-sdk.svg)](https://badge.fury.io/js/%40intellify%2Finft-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive TypeScript SDK for creating and managing evolving Intelligent NFTs (INFTs) with 0G Data Availability integration and on-chain interaction tracking.

## 🌟 Features

- **Evolving INFTs**: Create NFTs that evolve based on user interactions
- **0G Data Availability**: Decentralized metadata storage using 0G DA
- **On-chain Tracking**: Track interactions and evolution on-chain
- **TypeScript Support**: Full type safety and IntelliSense support
- **Easy Integration**: Simple API for quick integration
- **Testnet Ready**: Pre-configured for 0G testnet development

## 📦 Installation

```bash
npm install @intellify/inft-sdk ethers
```

```bash
yarn add @intellify/inft-sdk ethers
```

```bash
pnpm add @intellify/inft-sdk ethers
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { IntellifySDK, createTestnetSDK } from '@intellify/inft-sdk';

// Option 1: Use testnet helper (recommended for development)
const sdk = createTestnetSDK({
  privateKey: 'your-private-key',
  contractAddress: 'deployed-contract-address'
});

// Option 2: Custom configuration
const sdk = new IntellifySDK({
  provider: 'https://evmrpc-testnet.0g.ai',
  signer: 'your-private-key',
  contractAddress: 'deployed-contract-address',
  zgdaConfig: {
    endpoint: 'https://da-testnet.0g.ai',
    privateKey: 'your-private-key',
    chainId: 16600,
    contractAddress: '0x857C0A28a8634614BB2C96039Cf1e5fb6402dF8B'
  }
});

// Initialize the SDK
await sdk.initialize();

// Create an evolving INFT
const result = await sdk.createINFT({
  name: 'My AI Companion',
  description: 'An evolving AI companion',
  image: 'https://example.com/image.png',
  aiPersonality: 'Friendly and helpful'
});

console.log('INFT created:', result.tokenId);

// Record interactions (triggers evolution every 10 interactions)
const interaction = await sdk.recordInteraction(result.tokenId, 'chat');
if (interaction.evolved) {
  console.log('INFT evolved to level', interaction.newLevel);
}

// Check evolution status
const status = await sdk.getEvolutionStatus(result.tokenId);
console.log('Current level:', status.level);
console.log('Experience:', status.experience);
console.log('Next evolution in:', status.nextEvolutionAt, 'interactions');
```

## 📚 API Reference

### IntellifySDK

Main SDK class for interacting with Intellify INFTs.

#### Constructor

```typescript
new IntellifySDK(config: IntellifySDKConfig)
```

**Parameters:**
- `config`: Configuration object for the SDK

#### Methods

##### `initialize(): Promise<void>`

Initializes the SDK. Must be called before using other methods.

```typescript
await sdk.initialize();
```

##### `createINFT(params: CreateINFTParams, recipientAddress?: string): Promise<CreateINFTResult>`

Creates and mints a new INFT.

```typescript
const result = await sdk.createINFT({
  name: 'My INFT',
  description: 'An evolving NFT',
  image: 'https://example.com/image.png',
  aiPersonality: 'Curious and friendly',
  attributes: [
    { trait_type: 'Species', value: 'Digital Companion' }
  ]
});
```

**Parameters:**
- `params`: INFT creation parameters
- `recipientAddress` (optional): Address to mint to (defaults to signer address)

**Returns:**
- `tokenId`: The minted token ID
- `transactionHash`: Transaction hash of the mint
- `metadataURI`: URI of the stored metadata

##### `recordInteraction(tokenId: string, interactionType: string): Promise<InteractionResult>`

Records an interaction with an INFT and potentially triggers evolution.

```typescript
const result = await sdk.recordInteraction('1', 'chat');
if (result.evolved) {
  console.log('Evolved to level', result.newLevel);
}
```

**Parameters:**
- `tokenId`: The token ID to interact with
- `interactionType`: Type of interaction (e.g., 'chat', 'game', 'question')

**Returns:**
- `transactionHash`: Transaction hash
- `evolved`: Whether the INFT evolved
- `newLevel` (optional): New level if evolved
- `newMetadataURI` (optional): New metadata URI if evolved

##### `getEvolutionStatus(tokenId: string): Promise<EvolutionStatus>`

Gets the current evolution status of an INFT.

```typescript
const status = await sdk.getEvolutionStatus('1');
console.log('Level:', status.level);
console.log('Experience:', status.experience);
console.log('Evolution history:', status.evolutionHistory);
```

##### `getMetadata(tokenId: string): Promise<INFTDAMetadata>`

Retrieves the full metadata of an INFT.

```typescript
const metadata = await sdk.getMetadata('1');
console.log('Name:', metadata.name);
console.log('Level:', metadata.level);
console.log('AI Personality:', metadata.ai_personality);
```

##### `getOwner(tokenId: string): Promise<string>`

Gets the owner address of an INFT.

```typescript
const owner = await sdk.getOwner('1');
console.log('Owner:', owner);
```

### Helper Functions

#### `createTestnetSDK(config): IntellifySDK`

Creates a pre-configured SDK instance for 0G testnet.

```typescript
const sdk = createTestnetSDK({
  privateKey: 'your-private-key',
  contractAddress: 'deployed-contract-address',
  rpcUrl: 'https://evmrpc-testnet.0g.ai' // optional
});
```

## 🔧 Configuration

### IntellifySDKConfig

```typescript
interface IntellifySDKConfig {
  provider: ethers.Provider | string;     // Ethereum provider or RPC URL
  signer?: ethers.Signer | string;       // Signer for transactions
  contractAddress: string;               // INFT contract address
  zgdaConfig?: ZGDAConfig;              // 0G DA configuration
  network?: {                           // Network info
    chainId: number;
    name: string;
  };
}
```

### ZGDAConfig

```typescript
interface ZGDAConfig {
  endpoint: string;        // 0G DA endpoint
  privateKey: string;      // Private key for DA operations
  chainId: number;         // Chain ID
  contractAddress: string; // DA contract address
}
```

### CreateINFTParams

```typescript
interface CreateINFTParams {
  name: string;                    // INFT name
  description: string;             // INFT description
  image: string;                   // Image URL or base64 data
  aiPersonality?: string;          // AI personality description
  attributes?: Array<{             // Custom attributes
    trait_type: string;
    value: string | number;
  }>;
}
```

## 🌐 Network Configuration

### 0G Testnet

- **RPC URL**: `https://evmrpc-testnet.0g.ai`
- **Chain ID**: `16600`
- **DA Endpoint**: `https://da-testnet.0g.ai`
- **DA Contract**: `0x857C0A28a8634614BB2C96039Cf1e5fb6402dF8B`

### Environment Variables

For security, use environment variables for sensitive data:

```bash
# .env
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=deployed_contract_address
RPC_URL=https://evmrpc-testnet.0g.ai
```

```typescript
import dotenv from 'dotenv';
dotenv.config();

const sdk = createTestnetSDK({
  privateKey: process.env.PRIVATE_KEY!,
  contractAddress: process.env.CONTRACT_ADDRESS!,
  rpcUrl: process.env.RPC_URL
});
```

## 📖 Examples

### Creating Multiple INFTs

```typescript
const companions = [
  {
    name: 'Aria the Wise',
    description: 'A knowledgeable AI companion',
    aiPersonality: 'Wise and patient teacher'
  },
  {
    name: 'Zyx the Playful',
    description: 'A fun-loving AI companion',
    aiPersonality: 'Playful and energetic'
  }
];

for (const companion of companions) {
  const result = await sdk.createINFT({
    ...companion,
    image: `https://api.example.com/generate-avatar/${companion.name}`
  });
  console.log(`Created ${companion.name} with ID: ${result.tokenId}`);
}
```

### Batch Interactions

```typescript
async function simulateUserSession(tokenId: string) {
  const interactions = ['greeting', 'question', 'chat', 'compliment', 'goodbye'];
  
  for (const interaction of interactions) {
    const result = await sdk.recordInteraction(tokenId, interaction);
    console.log(`${interaction}: ${result.evolved ? 'EVOLVED!' : 'recorded'}`);
    
    // Small delay between interactions
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Check final status
  const status = await sdk.getEvolutionStatus(tokenId);
  console.log(`Session complete. Level: ${status.level}, Experience: ${status.experience}`);
}
```

### Read-Only Operations

```typescript
// Initialize without signer for read-only operations
const readOnlySDK = new IntellifySDK({
  provider: 'https://evmrpc-testnet.0g.ai',
  contractAddress: 'deployed-contract-address'
});

await readOnlySDK.initialize();

// Query operations don't require a signer
const owner = await readOnlySDK.getOwner('1');
const status = await readOnlySDK.getEvolutionStatus('1');
const metadata = await readOnlySDK.getMetadata('1');
```

## 🧪 Testing

The SDK includes comprehensive examples in the `examples/` directory:

```bash
# Install dependencies
npm install

# Run basic example
npx ts-node examples/basic-usage.ts

# Build the SDK
npm run build
```

## 🔒 Security Best Practices

1. **Never expose private keys** in client-side code
2. **Use environment variables** for sensitive configuration
3. **Validate inputs** before calling SDK methods
4. **Handle errors gracefully** with try-catch blocks
5. **Test on testnet** before mainnet deployment
6. **Monitor gas costs** for production usage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/intellify/inft-sdk.git
cd inft-sdk

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.intellify.ai](https://docs.intellify.ai)
- **Issues**: [GitHub Issues](https://github.com/intellify/inft-sdk/issues)
- **Discord**: [Join our community](https://discord.gg/intellify)
- **Email**: support@intellify.ai

## 🗺️ Roadmap

- [ ] **v1.1**: Enhanced evolution algorithms
- [ ] **v1.2**: Multi-chain support
- [ ] **v1.3**: Advanced AI personality system
- [ ] **v2.0**: Visual evolution with AI-generated images
- [ ] **v2.1**: Social interactions between INFTs

---

**Built with ❤️ by the Intellify Team**

*Empowering developers to create the next generation of intelligent, evolving digital assets.*