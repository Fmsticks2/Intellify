# Intellify API Workflow Documentation

## Overview
Intellify is a decentralized AI knowledge companion built on 0G infrastructure, focusing on privacy-first, encrypted storage, and user-owned AI.

## Tech Stack
- **Frontend**: Next.js, Tailwind CSS, TypeScript
- **Storage**: 0G Storage API
- **Compute**: 0G Compute API
- **Blockchain**: 0G Chain, Solidity (ERC-7857 INFTs)
- **Authentication**: Wallet-based authentication

## Wave 2 Core Features
1. Wallet connection and authentication
2. File uploads using 0G Storage API
3. Basic AI interactions (summaries, Q&A) using 0G Compute API
4. Wrap initial AI state in a mock INFT (ERC-7857)

## API Workflow Architecture

### 1. User Authentication Flow

#### Step 1: Wallet Connection
```typescript
// Connect wallet and authenticate user
const connectWallet = async (): Promise<WalletConnection> => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  
  return {
    address,
    signer,
    provider
  };
};
```

#### Step 2: Generate Authentication Token
```typescript
// Sign authentication message
const authenticateUser = async (signer: ethers.Signer): Promise<string> => {
  const message = `Intellify Authentication\nTimestamp: ${Date.now()}`;
  const signature = await signer.signMessage(message);
  return signature;
};
```

### 2. File Upload & Storage Flow

#### Step 1: Encrypt File Data
```typescript
import { encrypt } from '@0g/encryption';

const encryptFile = async (file: File, userAddress: string): Promise<EncryptedData> => {
  const fileBuffer = await file.arrayBuffer();
  const encryptionKey = generateUserKey(userAddress);
  
  return await encrypt(fileBuffer, encryptionKey);
};
```

#### Step 2: Upload to 0G Storage
```typescript
import { ZgStorage } from '@0g/storage-sdk';

const uploadToStorage = async (encryptedData: EncryptedData): Promise<string> => {
  const storage = new ZgStorage({
    rpcUrl: process.env.NEXT_PUBLIC_0G_RPC_URL,
    privateKey: process.env.STORAGE_PRIVATE_KEY
  });
  
  const uploadResult = await storage.upload({
    data: encryptedData.data,
    metadata: {
      filename: encryptedData.filename,
      contentType: encryptedData.contentType,
      encrypted: true,
      owner: encryptedData.owner
    }
  });
  
  return uploadResult.hash; // Returns storage hash
};
```

### 3. AI Interaction Flow

#### Step 1: Prepare AI Request
```typescript
interface AIRequest {
  type: 'summary' | 'qa';
  content: string;
  question?: string;
  context?: string[];
}

const prepareAIRequest = (type: string, content: string, question?: string): AIRequest => {
  return {
    type: type as 'summary' | 'qa',
    content,
    question,
    context: [] // Will be populated from previous interactions
  };
};
```

#### Step 2: Execute AI Computation
```typescript
import { ZgCompute } from '@0g/compute-sdk';

const executeAITask = async (request: AIRequest): Promise<AIResponse> => {
  const compute = new ZgCompute({
    rpcUrl: process.env.NEXT_PUBLIC_0G_COMPUTE_RPC_URL,
    apiKey: process.env.COMPUTE_API_KEY
  });
  
  const computeResult = await compute.run({
    model: 'intellify-base-v1',
    task: request.type,
    input: {
      content: request.content,
      question: request.question,
      context: request.context
    },
    options: {
      maxTokens: 1000,
      temperature: 0.7
    }
  });
  
  return {
    response: computeResult.output,
    confidence: computeResult.confidence,
    tokens_used: computeResult.usage.total_tokens
  };
};
```

### 4. Mock INFT Creation Flow

#### Step 1: Prepare INFT Metadata
```typescript
interface INFTMetadata {
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

const createINFTMetadata = (storageHash: string, userAddress: string): INFTMetadata => {
  return {
    name: `Intellify AI Companion #${Date.now()}`,
    description: "Personalized AI knowledge companion with encrypted data",
    knowledge_hash: storageHash,
    ai_state: {
      model_version: "intellify-v1.0",
      training_data_hashes: [storageHash],
      interaction_count: 0,
      last_updated: Date.now()
    },
    owner: userAddress
  };
};
```

#### Step 2: Mint Mock INFT
```typescript
const mintMockINFT = async (metadata: INFTMetadata, signer: ethers.Signer): Promise<string> => {
  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_INFT_CONTRACT_ADDRESS,
    INFT_ABI,
    signer
  );
  
  const metadataURI = await uploadMetadataToIPFS(metadata);
  
  const tx = await contract.mintINFT(
    metadata.owner,
    metadataURI,
    metadata.knowledge_hash
  );
  
  const receipt = await tx.wait();
  const tokenId = receipt.events[0].args.tokenId.toString();
  
  return tokenId;
};
```

## API Endpoints Summary

| Feature | API Method | Endpoint/Function | Input | Output |
|---------|------------|-------------------|-------|--------|
| Wallet Auth | `connectWallet()` | Web3 Provider | - | `{address, signer, provider}` |
| File Upload | `storage.upload()` | 0G Storage API | `{data, metadata}` | `{hash}` |
| AI Summary | `compute.run()` | 0G Compute API | `{model, task: 'summary', input}` | `{output, confidence, usage}` |
| AI Q&A | `compute.run()` | 0G Compute API | `{model, task: 'qa', input}` | `{output, confidence, usage}` |
| Mint INFT | `contract.mintINFT()` | Smart Contract | `{owner, metadataURI, knowledgeHash}` | `{tokenId}` |

## Complete User Journey Example

### Scenario: User uploads a document and asks questions about it

1. **Connect Wallet**
   ```typescript
   const wallet = await connectWallet();
   const authToken = await authenticateUser(wallet.signer);
   ```

2. **Upload Document**
   ```typescript
   const file = document.getElementById('fileInput').files[0];
   const encryptedData = await encryptFile(file, wallet.address);
   const storageHash = await uploadToStorage(encryptedData);
   ```

3. **Generate Summary**
   ```typescript
   const summaryRequest = prepareAIRequest('summary', fileContent);
   const summary = await executeAITask(summaryRequest);
   ```

4. **Ask Questions**
   ```typescript
   const qaRequest = prepareAIRequest('qa', fileContent, "What are the key points?");
   const answer = await executeAITask(qaRequest);
   ```

5. **Create INFT**
   ```typescript
   const metadata = createINFTMetadata(storageHash, wallet.address);
   const tokenId = await mintMockINFT(metadata, wallet.signer);
   ```

## Error Handling

```typescript
const handleAPIError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  
  if (error.code === 'NETWORK_ERROR') {
    throw new Error('Network connection failed. Please check your internet connection.');
  }
  
  if (error.code === 'INSUFFICIENT_FUNDS') {
    throw new Error('Insufficient funds for transaction. Please add funds to your wallet.');
  }
  
  if (error.code === 'USER_REJECTED') {
    throw new Error('Transaction was rejected by user.');
  }
  
  throw new Error(`Unexpected error: ${error.message}`);
};
```

## Environment Configuration

```typescript
// .env.local
NEXT_PUBLIC_0G_RPC_URL=https://rpc.0g.ai
NEXT_PUBLIC_0G_COMPUTE_RPC_URL=https://compute.0g.ai
NEXT_PUBLIC_INFT_CONTRACT_ADDRESS=0x...
STORAGE_PRIVATE_KEY=0x...
COMPUTE_API_KEY=...
```

## Next Steps for Next Wave
- Implement full ERC-7857 INFT standard
- Add access control logic on 0G Chain
- Store knowledge index & model state inside INFT
- Enhanced encryption and privacy features

---

*This documentation serves as the foundation for Intellify development. All APIs are designed to be privacy-first and user-owned.*