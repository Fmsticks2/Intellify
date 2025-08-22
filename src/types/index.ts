// Smart Contract Types
export interface AIState {
  modelVersion: string;
  isActive: boolean;
  interactionCount: bigint;
  lastInteraction: bigint;
}

export interface KnowledgeMetadata {
  metadataURI: string;
  addedAt: bigint;
}

export interface INFT {
  tokenId: bigint;
  owner: string;
  aiState: AIState;
  knowledgeHashes: string[];
  knowledgeMetadata: { [hash: string]: KnowledgeMetadata };
  tokenURI: string;
}

// UI State Types
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

export interface TransactionState {
  status: 'idle' | 'pending' | 'success' | 'error';
  hash?: string;
  message?: string;
}

// Form Types
export interface MintINFTForm {
  modelVersion: string;
  knowledgeHash: string;
  metadataURI: string;
  description: string;
}

export interface AddKnowledgeForm {
  tokenId: string;
  knowledgeHash: string;
  metadataURI: string;
}

export interface RecordInteractionForm {
  tokenId: string;
  interactionData: string;
}

// Network Configuration
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Contract Configuration
export interface ContractConfig {
  address: string;
  abi: any[];
}

// Error Types
export interface ContractError {
  code: string;
  message: string;
  data?: any;
}

// Event Types
export interface INFTMintedEvent {
  tokenId: bigint;
  owner: string;
  knowledgeHash: string;
  modelVersion: string;
}

export interface KnowledgeAddedEvent {
  tokenId: bigint;
  knowledgeHash: string;
  metadataURI: string;
}

export interface InteractionRecordedEvent {
  tokenId: bigint;
  interactionCount: bigint;
  timestamp: bigint;
}

export interface INFTStatusChangedEvent {
  tokenId: bigint;
  isActive: boolean;
}

// API Response Types
export interface MetadataResponse {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// Component Props Types
export interface INFTCardProps {
  inft: INFT;
  onUpdate: () => void;
}

export interface MintINFTModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export interface TransactionStatusProps {
  status: 'pending' | 'success' | 'error' | 'idle';
  txHash?: string;
  message?: string;
  onClose?: () => void;
}

// Hook Return Types
export interface UseIntellifyContractReturn {
  // Read functions
  getAIState: (tokenId: bigint) => Promise<AIState>;
  getKnowledgeHashes: (tokenId: bigint) => Promise<string[]>;
  getKnowledgeMetadata: (tokenId: bigint, hash: string) => Promise<KnowledgeMetadata>;
  getUserINFTs: (owner: string) => Promise<bigint[]>;
  getTotalSupply: () => Promise<bigint>;
  isKnowledgeHashUsed: (hash: string) => Promise<boolean>;
  tokenURI: (tokenId: bigint) => Promise<string>;
  
  // Write functions
  mintINFT: (to: string, metadataURI: string, knowledgeHash: string, modelVersion: string) => Promise<any>;
  addKnowledge: (tokenId: bigint, knowledgeHash: string, metadataURI: string) => Promise<any>;
  recordInteraction: (tokenId: bigint) => Promise<any>;
  updateModelVersion: (tokenId: bigint, newVersion: string) => Promise<any>;
  deactivateINFT: (tokenId: bigint) => Promise<any>;
  reactivateINFT: (tokenId: bigint) => Promise<any>;
  burn: (tokenId: bigint) => Promise<any>;
  
  // State
  isLoading: boolean;
  error: string | null;
}

export interface UseWalletReturn {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToCorrectNetwork: () => Promise<void>;
  getBalance: () => Promise<void>;
  isCorrectNetwork: boolean;
}

export interface UseTransactionStatusReturn {
  status: 'pending' | 'success' | 'error' | 'idle';
  txHash?: string;
  message?: string;
  showPending: (hash?: string, msg?: string) => void;
  showSuccess: (hash?: string, msg?: string) => void;
  showError: (msg?: string) => void;
  reset: () => void;
}