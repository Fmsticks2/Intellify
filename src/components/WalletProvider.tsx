'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

interface WalletContextType {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  switchToCorrectNetwork: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// 0G Testnet configuration
const TARGET_NETWORK = {
  chainId: '0x40D9', // 16601 in hex
  chainName: '0G-Galileo-Testnet',
  nativeCurrency: {
    name: 'OG',
    symbol: 'OG',
    decimals: 18,
  },
  rpcUrls: ['https://evmrpc-testnet.0g.ai'],
  blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    if (typeof window !== 'undefined' && window.ethereum) {
      (window.ethereum as unknown as EthereumProvider).on('accountsChanged', handleAccountsChanged);
        (window.ethereum as unknown as EthereumProvider).on('chainChanged', handleChainChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        (window.ethereum as unknown as EthereumProvider).removeListener('accountsChanged', handleAccountsChanged);
         (window.ethereum as unknown as EthereumProvider).removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await (window.ethereum as unknown as EthereumProvider).request({ method: 'eth_accounts' });
         const chainId = await (window.ethereum as unknown as EthereumProvider).request({ method: 'eth_chainId' });
        
        if (accounts.length > 0) {
          const balance = await getBalance(accounts[0]);
          const currentChainId = parseInt(chainId, 16);
          
          setWallet({
            isConnected: true,
            address: accounts[0],
            chainId: currentChainId,
            balance,
          });
          
          // Auto-switch to correct network if connected but on wrong network
          if (currentChainId !== parseInt(TARGET_NETWORK.chainId, 16)) {
            console.log('Wrong network detected, attempting to switch...');
            await switchToCorrectNetwork();
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const getBalance = async (address: string): Promise<string> => {
    try {
      const balance = await (window.ethereum as unknown as EthereumProvider).request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      // Convert from wei to ether
      const balanceInEther = parseInt(balance, 16) / Math.pow(10, 18);
      return balanceInEther.toFixed(4);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0.0000';
    }
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setIsConnecting(true);
      try {
        const accounts = await (window.ethereum as unknown as EthereumProvider).request({ method: 'eth_requestAccounts' });
         const chainId = await (window.ethereum as unknown as EthereumProvider).request({ method: 'eth_chainId' });
        const balance = await getBalance(accounts[0]);
        const currentChainId = parseInt(chainId, 16);
        
        setWallet({
          isConnected: true,
          address: accounts[0],
          chainId: currentChainId,
          balance,
        });
        
        // Auto-switch to correct network if connected but on wrong network
        if (currentChainId !== parseInt(TARGET_NETWORK.chainId, 16)) {
          console.log('Wrong network detected during connection, attempting to switch...');
          await switchToCorrectNetwork();
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    } else {
      throw new Error('Please install MetaMask or another Web3 wallet!');
    }
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
    });
  };

  const switchToCorrectNetwork = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Try to switch to the network
        await (window.ethereum as unknown as EthereumProvider).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: TARGET_NETWORK.chainId }],
        });
        return true;
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await (window.ethereum as unknown as EthereumProvider).request({
              method: 'wallet_addEthereumChain',
              params: [TARGET_NETWORK],
            });
            return true;
          } catch (addError) {
            console.error('Error adding network:', addError);
            return false;
          }
        } else {
          console.error('Error switching network:', switchError);
          return false;
        }
      }
    }
    return false;
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      const balance = await getBalance(accounts[0]);
      setWallet(prev => ({ ...prev, address: accounts[0], balance }));
    }
  };

  const handleChainChanged = (chainId: string) => {
    setWallet(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
    // Reload the page to reset any state that depends on the network
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const value: WalletContextType = {
    wallet,
    connectWallet,
    disconnectWallet,
    isConnecting,
    switchToCorrectNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Extend Window interface for TypeScript
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
}