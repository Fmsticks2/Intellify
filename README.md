# Intellify Wave 2 - Decentralized AI Knowledge Companion

A cutting-edge decentralized application that combines AI and blockchain technology to create intelligent NFTs (INFTs) on the 0G Network, implementing the revolutionary **ERC-7857 standard** for AI agents with private metadata.

## 🌟 Key Features

- 🤖 **ERC-7857 Compliant INFTs**: Full implementation of the ERC-7857 standard for AI agents with private metadata
- 🔐 **Private Metadata Management**: Secure handling of encrypted AI model data with verifiable ownership
- 👥 **Access Control System**: Role-based permissions and user authorization for AI agent data
- 🔗 **0G Network Integration**: Built on the high-performance 0G blockchain for optimal performance
- 🎨 **Professional UI**: Modern, responsive design with AI/ML themed professional icons
- 💼 **Advanced Wallet Integration**: Seamless wallet connection with comprehensive address management
- 📱 **Mobile Responsive**: Optimized for all device sizes with modern UX patterns
- 🔒 **Enhanced Security**: Privacy-first approach with encrypted data structures and secure transfer mechanisms

## 🚀 Deployed Contract

**Contract Address**: `0x37525E8B82C776F608eCA8A49C000b98a456fBdD`  
**Network**: 0G Testnet (Chain ID: 16601)  
**Transaction Hash**: `0xa1ef336432e58008a952d4009d8e95eff6bc1d9bb27dcc3037203f01e5cd7d48`  
**Block**: 5888073  

## 🔬 ERC-7857 Implementation

Intellify Wave 2 is one of the first platforms to implement the **ERC-7857 standard** for AI agents with private metadata. This revolutionary standard enables:

### 🧠 AI Agent Features
- **Private Metadata Storage**: Encrypted AI model data with secure access control
- **Verifiable Ownership**: Cryptographic proof of AI agent ownership and authenticity
- **Dynamic Knowledge Updates**: Real-time updates to AI knowledge base with immutable history
- **Sealed Executor Pattern**: Secure processing of AI requests with privacy guarantees

### 🔐 Security & Privacy
- **Access Control Lists**: Fine-grained permissions for AI agent data access
- **Encrypted Data Structures**: Private metadata protected with advanced encryption
- **Signature Verification**: Authentication via authorized public keys per token
- **Transfer Verification**: Secure ownership transfers with data integrity checks

### 📊 Smart Contract Capabilities
- **Knowledge Indexing**: Immutable knowledge hash tracking and deduplication
- **AI State Management**: Dynamic AI model versioning and interaction history
- **Metadata Interfaces**: Comprehensive metadata management with update events
- **User Authorization**: Multi-user access control with revocation capabilities

## 🛠 Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Wallet Integration**: Reown (WalletConnect v2)
- **Smart Contracts**: Solidity, OpenZeppelin v5, ERC-7857 Standard
- **Development Tools**: Foundry, Hardhat
- **Blockchain**: 0G Network Testnet
- **AI Integration**: Knowledge indexing, encrypted metadata, private AI states
- **SDK**: TypeScript SDK with 0G DA integration
- **Data Availability**: 0G Data Availability Layer for metadata storage

## 📦 SDK & Integration Updates

### Recent TypeScript Improvements (Latest Release)

The Intellify SDK has been significantly enhanced with comprehensive TypeScript fixes and improvements:

#### 🔧 Type Safety Enhancements
- **Fixed Re-export Issues**: Resolved `isolatedModules` compatibility by using `export type` for interface re-exports
- **Complete Type Definitions**: All interfaces now have proper type definitions with required properties
- **Strict Type Checking**: Eliminated unsafe type assertions and improved type conversion safety
- **Enhanced Metadata Validation**: Complete `INFTDAMetadata` objects with all required fields

#### 🏗️ SDK Architecture Improvements
- **0G DA Client Integration**: Full integration with 0G Data Availability layer for decentralized metadata storage
- **ZGDAConfig Interface**: Proper configuration interface with all required properties:
  - `rpcEndpoint`: 0G Network RPC endpoint
  - `daEntranceContract`: Data Availability entrance contract address
  - `daSignersContract`: DA signers contract address
  - `grpcEndpoint`: gRPC endpoint for DA operations
  - `gasLimit`: Transaction gas limit configuration
- **Enhanced Error Handling**: Comprehensive error handling for DA operations and blockchain interactions

#### 📋 Interface Standardization
- **INFTDAMetadata Structure**: Complete metadata interface including:
  ```typescript
  interface INFTDAMetadata {
    name: string;
    description: string;
    image: string;
    level: number;
    experience: number;
    attributes: Array<{ trait_type: string; value: string | number }>;
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
  ```

#### 🔄 Migration & Compatibility
- **Backward Compatibility**: Maintained compatibility with existing implementations
- **Deprecated Property Removal**: Removed obsolete `ai_personality` references
- **Updated Examples**: All SDK examples updated with correct interface usage
- **Comprehensive Testing**: All TypeScript compilation errors resolved across the entire codebase

#### 🚀 Performance Optimizations
- **Efficient Type Checking**: Optimized TypeScript compilation with `skipLibCheck` support
- **Reduced Bundle Size**: Eliminated unnecessary type assertions and improved tree-shaking
- **Better Development Experience**: Enhanced IDE support with proper type definitions

### SDK Usage Examples

#### Basic INFT Creation
```typescript
import { IntellifySDK, ZGDAConfig } from '@intellify/sdk';

const zgdaConfig: ZGDAConfig = {
  rpcEndpoint: 'https://evmrpc-testnet.0g.ai',
  privateKey: process.env.PRIVATE_KEY!,
  daEntranceContract: '0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9',
  daSignersContract: '0x0000000000000000000000000000000000001000',
  grpcEndpoint: 'localhost:51001',
  gasLimit: 2000000
};

const sdk = new IntellifySDK({
  provider: 'https://evmrpc-testnet.0g.ai',
  signer: process.env.PRIVATE_KEY!,
  contractAddress: '0x37525E8B82C776F608eCA8A49C000b98a456fBdD',
  zgdaConfig
});

const result = await sdk.createINFT({
  name: 'My AI Companion',
  description: 'An intelligent NFT with evolving capabilities',
  image: 'https://example.com/image.png',
  attributes: [
    { trait_type: 'Intelligence', value: 85 },
    { trait_type: 'Creativity', value: 92 }
  ]
});
```

#### Evolution Status Tracking
```typescript
const evolutionStatus = await sdk.getEvolutionStatus(tokenId);
console.log(`Level: ${evolutionStatus.level}`);
console.log(`Experience: ${evolutionStatus.experience}`);
console.log(`Next Evolution: ${evolutionStatus.nextEvolutionAt}`);
```

### Testing & Validation
- ✅ All TypeScript compilation errors resolved
- ✅ SDK examples compile successfully
- ✅ Integration tests pass with new type definitions
- ✅ Backward compatibility maintained
- ✅ 0G DA integration fully functional

## 📋 Core Functionality

### 🎨 INFT Creation & Management
- **ERC-7857 Compliant Minting**: Create AI agents with private metadata and encrypted data
- **Knowledge Hash Integration**: Immutable AI knowledge tracking with deduplication
- **Dynamic AI State Updates**: Real-time AI model versioning and interaction history
- **Private Metadata Management**: Secure handling of encrypted AI model configurations

### 🔐 Access Control & Security
- **User Authorization System**: Grant and revoke access to AI agent data
- **Ownership Verification**: Cryptographic proof of AI agent ownership
- **Secure Transfer Mechanisms**: Verified ownership transfers with data integrity
- **Encrypted Data Storage**: Private AI model data protected with advanced encryption

### 🌐 Blockchain Integration
- **0G Network Optimization**: High-performance blockchain for AI workloads
- **Seamless Wallet Connection**: Advanced Reown integration with multi-wallet support
- **Gas-Efficient Operations**: Optimized smart contract functions for cost-effective usage
- **Event-Driven Architecture**: Real-time updates via blockchain events

## 📖 Smart Contract API

### ERC-7857 Core Functions

```solidity
// Metadata Management
function getDataHashes(uint256 tokenId) external view returns (string[] memory)
function updateMetadata(uint256 tokenId, string[] memory newDataHashes, string memory newMetadataURI) external
function getMetadataURI(uint256 tokenId) external view returns (string memory)
function setMetadataURI(uint256 tokenId, string memory metadataURI) external

// Access Control
function authorizeUser(uint256 tokenId, address user) external
function revokeUser(uint256 tokenId, address user) external
function isAuthorized(uint256 tokenId, address user) external view returns (bool)
function getAuthorizedUsers(uint256 tokenId) external view returns (address[] memory)

// Verification
function verifyOwnership(uint256 tokenId, address claimedOwner) external view returns (bool)
function verifyTransfer(uint256 tokenId, address from, address to) external view returns (bool)
```

### INFT Specific Functions

```solidity
// INFT Management
function mintINFT(string memory knowledgeHash, string memory initialMetadataURI) external returns (uint256)
function addKnowledge(uint256 tokenId, string memory knowledgeHash) external
function recordInteraction(uint256 tokenId, string memory interactionData) external
function updateAIModel(uint256 tokenId, string memory newModelVersion) external

// Query Functions
function getAIState(uint256 tokenId) external view returns (AIState memory)
function getUserINFTs(address user) external view returns (uint256[] memory)
function getPrivateMetadata(uint256 tokenId) external view returns (PrivateMetadata memory)
function isMetadataEncrypted(uint256 tokenId) external view returns (bool)
```

## 🏗 Development Tools

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## 📚 Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
# Deploy to 0G testnet
$ forge script script/Deploy.s.sol:DeployScript --rpc-url 0g_testnet --broadcast --private-key <your_private_key>

```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask wallet
- 0G Network testnet tokens

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd intellify
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update the environment variables in `.env.local` with your configuration.

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment to Vercel

### Automatic Deployment (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on every push

### Manual Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Environment Variables for Vercel

Configure these environment variables in your Vercel dashboard:

- `NEXT_PUBLIC_0G_RPC_URL`
- `NEXT_PUBLIC_INTELLIFY_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (optional)
- Other variables from `.env.example`

### Frontend Development

```shell
# Install dependencies
$ npm install

# Start development server
$ npm run dev

# Build for production
$ npm run build
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
