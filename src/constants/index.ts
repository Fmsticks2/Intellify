import { NetworkConfig } from '../types/index';

// 0G Network Configuration
export const ZERO_G_TESTNET: NetworkConfig = {
  chainId: 16601,
  name: '0G-Galileo-Testnet',
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  blockExplorerUrl: 'https://chainscan-galileo.0g.ai',
  nativeCurrency: {
    name: 'OG Token',
    symbol: 'OG',
    decimals: 18,
  },
};

// Contract Configuration
export const CONTRACT_ADDRESS = '0x37525E8B82C776F608eCA8A49C000b98a456fBdD'; // Deployed INFT contract address

// Contract ABI (from IntellifyINFT.sol)
export const CONTRACT_ABI = [
  // Constructor
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "knowledgeHash", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "KnowledgeAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "interactionCount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "InteractionRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "knowledgeHash", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "modelVersion", "type": "string" }
    ],
    "name": "INFTMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "name": "INFTStatusChanged",
    "type": "event"
  },
  // Read Functions
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getAIState",
    "outputs": [
      { "internalType": "string", "name": "modelVersion", "type": "string" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      { "internalType": "uint256", "name": "interactionCount", "type": "uint256" },
      { "internalType": "uint256", "name": "lastInteraction", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getKnowledgeHashes",
    "outputs": [{ "internalType": "string[]", "name": "", "type": "string[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "string", "name": "knowledgeHash", "type": "string" }
    ],
    "name": "getKnowledgeMetadata",
    "outputs": [
      { "internalType": "string", "name": "metadataURI", "type": "string" },
      { "internalType": "uint256", "name": "addedAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "getUserINFTs",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "knowledgeHash", "type": "string" }],
    "name": "isKnowledgeHashUsed",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Write Functions
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "metadataURI", "type": "string" },
      { "internalType": "string", "name": "knowledgeHash", "type": "string" },
      { "internalType": "string", "name": "modelVersion", "type": "string" }
    ],
    "name": "mintINFT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "string", "name": "knowledgeHash", "type": "string" },
      { "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "addKnowledge",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "recordInteraction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "string", "name": "newVersion", "type": "string" }
    ],
    "name": "updateModelVersion",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "deactivateINFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "reactivateINFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Standard ERC721 functions
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "ownerOf",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// UI Constants
export const SUPPORTED_MODEL_VERSIONS = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3',
  'llama-2',
  'custom'
];

export const TRANSACTION_TIMEOUT = 60000; // 60 seconds
export const POLLING_INTERVAL = 2000; // 2 seconds

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  WRONG_NETWORK: 'Please switch to 0G-Galileo-Testnet',
  INSUFFICIENT_BALANCE: 'Insufficient balance for transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  CONTRACT_ERROR: 'Smart contract error occurred',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_TOKEN_ID: 'Invalid token ID',
  KNOWLEDGE_HASH_EXISTS: 'This knowledge hash has already been used',
  UNAUTHORIZED: 'You are not authorized to perform this action',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  INFT_MINTED: 'INFT minted successfully!',
  KNOWLEDGE_ADDED: 'Knowledge added to INFT successfully!',
  INTERACTION_RECORDED: 'Interaction recorded successfully!',
  MODEL_UPDATED: 'AI model version updated successfully!',
  INFT_DEACTIVATED: 'INFT deactivated successfully!',
  INFT_REACTIVATED: 'INFT reactivated successfully!',
  INFT_BURNED: 'INFT burned successfully!',
  WALLET_CONNECTED: 'Wallet connected successfully!',
  NETWORK_SWITCHED: 'Network switched successfully!',
};

// Default Values
export const DEFAULT_VALUES = {
  MODEL_VERSION: 'gpt-4',
  METADATA_URI_PREFIX: 'https://ipfs.io/ipfs/',
  PLACEHOLDER_IMAGE: 'https://via.placeholder.com/400x400?text=Intellify+INFT',
  MAX_KNOWLEDGE_FILES: 10,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 500,
};