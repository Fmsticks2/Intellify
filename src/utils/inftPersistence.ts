// INFT Persistence Utility
// Manages localStorage operations for INFT data persistence

interface INFT {
  tokenId: number;
  owner: string;
  modelVersion: string;
  knowledgeHashes: string[];
  interactionCount: number;
  lastUpdated: number;
  isActive: boolean;
  tokenURI: string;
  isEncrypted?: boolean;
}

interface PersistedINFTData {
  walletAddress: string;
  infts: INFT[];
  lastUpdated: number;
}

const STORAGE_KEY = 'intellify_user_infts';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class INFTPersistence {
  /**
   * Save INFTs to localStorage for a specific wallet address
   */
  static saveINFTs(walletAddress: string, infts: INFT[]): void {
    try {
      const data: PersistedINFTData = {
        walletAddress: walletAddress.toLowerCase(),
        infts,
        lastUpdated: Date.now()
      };
      
      localStorage.setItem(`${STORAGE_KEY}_${walletAddress.toLowerCase()}`, JSON.stringify(data));
      console.log(`Saved ${infts.length} INFTs for wallet ${walletAddress}`);
    } catch (error) {
      console.error('Failed to save INFTs to localStorage:', error);
    }
  }

  /**
   * Load INFTs from localStorage for a specific wallet address
   */
  static loadINFTs(walletAddress: string): INFT[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${walletAddress.toLowerCase()}`);
      if (!stored) {
        return [];
      }

      const data: PersistedINFTData = JSON.parse(stored);
      
      // Check if data is still valid (not expired)
      const isExpired = Date.now() - data.lastUpdated > CACHE_DURATION;
      if (isExpired) {
        console.log('Cached INFT data expired, will fetch fresh data');
        this.clearINFTs(walletAddress);
        return [];
      }

      // Verify the data belongs to the correct wallet
      if (data.walletAddress !== walletAddress.toLowerCase()) {
        console.warn('Wallet address mismatch in cached data');
        return [];
      }

      console.log(`Loaded ${data.infts.length} INFTs from cache for wallet ${walletAddress}`);
      return data.infts;
    } catch (error) {
      console.error('Failed to load INFTs from localStorage:', error);
      return [];
    }
  }

  /**
   * Clear INFTs from localStorage for a specific wallet address
   */
  static clearINFTs(walletAddress: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${walletAddress.toLowerCase()}`);
      console.log(`Cleared cached INFTs for wallet ${walletAddress}`);
    } catch (error) {
      console.error('Failed to clear INFTs from localStorage:', error);
    }
  }

  /**
   * Check if cached INFTs exist for a wallet address
   */
  static hasCache(walletAddress: string): boolean {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${walletAddress.toLowerCase()}`);
      if (!stored) return false;

      const data: PersistedINFTData = JSON.parse(stored);
      const isExpired = Date.now() - data.lastUpdated > CACHE_DURATION;
      
      return !isExpired && data.walletAddress === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Failed to check cache:', error);
      return false;
    }
  }

  /**
   * Update a specific INFT in the cache
   */
  static updateINFT(walletAddress: string, updatedINFT: INFT): void {
    try {
      const cachedINFTs = this.loadINFTs(walletAddress);
      const updatedINFTs = cachedINFTs.map(inft => 
        inft.tokenId === updatedINFT.tokenId ? updatedINFT : inft
      );
      
      // If INFT doesn't exist, add it
      if (!cachedINFTs.find(inft => inft.tokenId === updatedINFT.tokenId)) {
        updatedINFTs.push(updatedINFT);
      }
      
      this.saveINFTs(walletAddress, updatedINFTs);
    } catch (error) {
      console.error('Failed to update INFT in cache:', error);
    }
  }

  /**
   * Remove a specific INFT from the cache
   */
  static removeINFT(walletAddress: string, tokenId: number): void {
    try {
      const cachedINFTs = this.loadINFTs(walletAddress);
      const filteredINFTs = cachedINFTs.filter(inft => inft.tokenId !== tokenId);
      this.saveINFTs(walletAddress, filteredINFTs);
    } catch (error) {
      console.error('Failed to remove INFT from cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(walletAddress: string): { count: number; lastUpdated: Date | null; isExpired: boolean } {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${walletAddress.toLowerCase()}`);
      if (!stored) {
        return { count: 0, lastUpdated: null, isExpired: true };
      }

      const data: PersistedINFTData = JSON.parse(stored);
      const isExpired = Date.now() - data.lastUpdated > CACHE_DURATION;
      
      return {
        count: data.infts.length,
        lastUpdated: new Date(data.lastUpdated),
        isExpired
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { count: 0, lastUpdated: null, isExpired: true };
    }
  }
}