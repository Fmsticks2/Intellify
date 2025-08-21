# Intellify Wave 2 - Prototype & MVP Development

> **Decentralized AI Knowledge Companion built on 0G Network**

Intellify is a privacy-first, decentralized AI knowledge companion that allows users to upload documents, interact with AI, and wrap their AI state in NFTs (INFTs) for true ownership and portability.

## 🚀 Wave 2 Features

- **Wallet Connection**: MetaMask integration with 0G Network
- **Encrypted File Upload**: Secure document storage using 0G Storage API
- **AI Interactions**: Document summaries and Q&A using 0G Compute API
- **Mock INFT Creation**: ERC-7857 compliant NFTs wrapping AI state
- **Privacy-First**: All data encrypted before storage

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   0G Network    │    │   Smart         │
│   (Next.js)     │◄──►│   APIs          │◄──►│   Contracts     │
│                 │    │                 │    │   (Solidity)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│                      │                      │
│ • Wallet Auth        │ • Storage API        │ • INFT Contract
│ • File Upload UI     │ • Compute API        │ • ERC-7857
│ • AI Chat Interface  │ • Encryption         │ • State Management
│ • INFT Management    │ • Decentralized      │ • Access Control
└──────────────────────┴──────────────────────┴─────────────────────
```

## 📋 Prerequisites

- Node.js 18+
- MetaMask wallet
- 0G Network testnet access
- Basic understanding of Web3 and React

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/intellify/wave2-prototype.git
cd intellify-wave2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

## ⚙️ Environment Configuration

Create `.env.local` file:

```env
# 0G Network Configuration
NEXT_PUBLIC_0G_STORAGE_URL=https://storage-testnet.0g.ai
NEXT_PUBLIC_0G_COMPUTE_URL=https://compute-testnet.0g.ai
NEXT_PUBLIC_0G_CHAIN_RPC=https://rpc-testnet.0g.ai
NEXT_PUBLIC_0G_CHAIN_ID=9000

# Contract Addresses (Deploy first)
NEXT_PUBLIC_INFT_CONTRACT_ADDRESS=0x...

# API Keys (if required)
0G_STORAGE_API_KEY=your_storage_api_key
0G_COMPUTE_API_KEY=your_compute_api_key

# Encryption
NEXT_PUBLIC_ENCRYPTION_KEY=your_32_byte_encryption_key
```

## 🔧 Smart Contract Deployment

```bash
# Compile contracts
npm run compile-contracts

# Start local hardhat node (for testing)
npm run node

# Deploy to local network
npm run deploy-contracts

# Deploy to 0G testnet
npx hardhat run scripts/deploy.js --network 0g-testnet
```

## 📚 API Reference

### Core Client Usage

```typescript
import { IntellifyClient } from './lib/intellify-client';

// Initialize client
const client = new IntellifyClient({
  storageUrl: process.env.NEXT_PUBLIC_0G_STORAGE_URL!,
  computeUrl: process.env.NEXT_PUBLIC_0G_COMPUTE_URL!,
  chainRpc: process.env.NEXT_PUBLIC_0G_CHAIN_RPC!,
  inftContractAddress: process.env.NEXT_PUBLIC_INFT_CONTRACT_ADDRESS!
});

// Connect wallet
await client.connectWallet();

// Upload and encrypt file
const fileHash = await client.uploadFile(file, {
  encrypt: true,
  metadata: { title: 'My Document' }
});

// Run AI task
const summary = await client.runAITask({
  type: 'summary',
  fileHash,
  prompt: 'Summarize this document'
});

// Mint INFT
const inftId = await client.mintINFT({
  knowledgeHashes: [fileHash],
  aiState: summary.aiState,
  metadata: { name: 'My AI Companion' }
});
```

### React Hooks Usage

```typescript
import { useIntellifyComplete } from './hooks/useIntellify';

function MyComponent() {
  const {
    client,
    isConnected,
    connectWallet,
    uploadFile,
    runAITask,
    mintINFT,
    loading,
    error
  } = useIntellifyComplete();

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadFile(file, { encrypt: true });
      console.log('File uploaded:', result.hash);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div>
      {!isConnected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />
          {loading && <p>Processing...</p>}
          {error && <p>Error: {error}</p>}
        </div>
      )}
    </div>
  );
}
```

## 🔄 Complete User Flow

### 1. Wallet Connection
```typescript
// User clicks "Connect Wallet"
const wallet = await client.connectWallet();
// Returns: { address: '0x...', chainId: 9000 }
```

### 2. File Upload & Encryption
```typescript
// User selects file
const file = document.getElementById('fileInput').files[0];

// Upload with encryption
const uploadResult = await client.uploadFile(file, {
  encrypt: true,
  metadata: { title: file.name, uploadedAt: Date.now() }
});
// Returns: { hash: 'QmXXX...', encryptedHash: 'QmYYY...', size: 1024 }
```

### 3. AI Interaction
```typescript
// Generate summary
const summaryResult = await client.runAITask({
  type: 'summary',
  fileHash: uploadResult.hash,
  prompt: 'Create a concise summary'
});

// Ask questions
const qaResult = await client.runAITask({
  type: 'qa',
  fileHash: uploadResult.hash,
  prompt: 'What are the main topics discussed?'
});
```

### 4. INFT Creation
```typescript
// Mint INFT with AI state
const inftResult = await client.mintINFT({
  knowledgeHashes: [uploadResult.hash],
  aiState: summaryResult.aiState,
  metadata: {
    name: 'My AI Knowledge Companion',
    description: 'AI trained on my documents',
    image: 'ipfs://QmXXX...' // Optional
  }
});
// Returns: { tokenId: 1, transactionHash: '0x...' }
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📊 Wave 2 Feature Mapping

| Feature | API Endpoint | Smart Contract | Status |
|---------|-------------|----------------|--------|
| Wallet Connection | `client.connectWallet()` | - | ✅ Ready |
| File Upload | `storage.upload()` | - | ✅ Ready |
| File Encryption | `crypto.encrypt()` | - | ✅ Ready |
| AI Summary | `compute.run('summary')` | - | 🔄 Mock |
| AI Q&A | `compute.run('qa')` | - | 🔄 Mock |
| INFT Minting | `client.mintINFT()` | `IntellifyINFT.mint()` | ✅ Ready |
| INFT Metadata | `client.getINFTMetadata()` | `IntellifyINFT.getAIState()` | ✅ Ready |
| Knowledge Storage | `client.addKnowledge()` | `IntellifyINFT.addKnowledge()` | ✅ Ready |

## 🔐 Security Considerations

- **Client-side Encryption**: All files encrypted before upload
- **Private Key Management**: Never expose private keys
- **Access Control**: INFT ownership controls access
- **Data Privacy**: No plaintext data stored on-chain
- **Secure Communication**: HTTPS/WSS for all API calls

## 🚧 Known Limitations (Wave 2)

- AI responses are mocked (real 0G Compute integration in Wave 3)
- Basic INFT implementation (full ERC-7857 in Wave 3)
- Limited error handling and retry logic
- No advanced RAG pipeline (Wave 4)
- No monetization features (Wave 5)

## 🛣️ Roadmap to Wave 3

- [ ] Implement full ERC-7857 INFT standard
- [ ] Real 0G Compute API integration
- [ ] Advanced knowledge indexing
- [ ] Improved error handling
- [ ] Performance optimizations
- [ ] Enhanced UI/UX

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.intellify.ai](https://docs.intellify.ai)
- **Discord**: [discord.gg/intellify](https://discord.gg/intellify)
- **Issues**: [GitHub Issues](https://github.com/intellify/wave2-prototype/issues)
- **Email**: support@intellify.ai

---

**Built with ❤️ by the Intellify Team**

*Empowering users with truly owned, privacy-first AI companions on the decentralized web.*