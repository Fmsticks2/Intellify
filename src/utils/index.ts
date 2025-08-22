import { ZERO_G_TESTNET } from '../constants/index.js';

// Address formatting utilities
export function formatAddress(address: string, length: number = 6): string {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Hash formatting utilities
export function formatHash(hash: string, length: number = 8): string {
  if (!hash) return '';
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export function isValidHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

// Number formatting utilities
export function formatTokenId(tokenId: bigint | string | number): string {
  return `#${tokenId.toString()}`;
}

export function formatBalance(balance: string, decimals: number = 18, precision: number = 4): string {
  const balanceNum = parseFloat(balance);
  const divisor = Math.pow(10, decimals);
  const formatted = (balanceNum / divisor).toFixed(precision);
  return parseFloat(formatted).toString(); // Remove trailing zeros
}

export function formatNumber(num: number | bigint | string, precision: number = 2): string {
  const numValue = typeof num === 'bigint' ? Number(num) : Number(num);
  if (numValue >= 1000000) {
    return (numValue / 1000000).toFixed(precision) + 'M';
  } else if (numValue >= 1000) {
    return (numValue / 1000).toFixed(precision) + 'K';
  }
  return numValue.toFixed(precision);
}

// Time formatting utilities
export function formatTimestamp(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export function formatTimeAgo(timestamp: bigint | number): string {
  const now = Date.now();
  const time = Number(timestamp) * 1000;
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

// URL utilities
export function getExplorerUrl(type: 'tx' | 'address' | 'token', value: string): string {
  const baseUrl = ZERO_G_TESTNET.blockExplorerUrl;
  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${value}`;
    case 'address':
      return `${baseUrl}/address/${value}`;
    case 'token':
      return `${baseUrl}/token/${value}`;
    default:
      return baseUrl;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isIpfsUrl(url: string): boolean {
  return url.startsWith('ipfs://') || url.includes('ipfs.io') || url.includes('gateway.pinata.cloud');
}

// Validation utilities
export function validateTokenId(tokenId: string): boolean {
  try {
    const id = BigInt(tokenId);
    return id >= 0;
  } catch {
    return false;
  }
}

export function validateModelVersion(version: string): boolean {
  return version.trim().length > 0 && version.trim().length <= 50;
}

export function validateDescription(description: string): boolean {
  return description.trim().length >= 10 && description.trim().length <= 500;
}

export function validateMetadataURI(uri: string): boolean {
  return isValidUrl(uri) && (uri.startsWith('https://') || uri.startsWith('ipfs://'));
}

// Error handling utilities
export function parseContractError(error: any): string {
  if (typeof error === 'string') return error;
  
  // Handle MetaMask/wallet errors
  if (error?.code === 4001) {
    return 'Transaction was rejected by user';
  }
  
  if (error?.code === -32603) {
    return 'Internal JSON-RPC error';
  }
  
  // Handle contract revert errors
  if (error?.reason) {
    return error.reason;
  }
  
  if (error?.message) {
    // Extract revert reason from error message
    const revertMatch = error.message.match(/revert (.+)/);
    if (revertMatch) {
      return revertMatch[1];
    }
    
    // Handle common error patterns
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    
    if (error.message.includes('user rejected')) {
      return 'Transaction was rejected by user';
    }
    
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection.';
    }
    
    return error.message;
  }
  
  return 'An unknown error occurred';
}

// Local storage utilities
export function saveToLocalStorage(key: string, value: any): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    }
    return defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

// Clipboard utilities
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && navigator?.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// Object utilities
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}