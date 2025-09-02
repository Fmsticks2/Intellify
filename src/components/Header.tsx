'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useWallet } from './WalletProvider';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  const { wallet, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (wallet.address) {
      try {
        await navigator.clipboard.writeText(wallet.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <Icon 
                icon="mdi:brain" 
                className="h-11 w-11 text-blue-600 relative z-10 transition-all duration-300 group-hover:scale-110" 
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 transition-all duration-300">
              Intellify
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="relative text-black hover:text-blue-600 transition-all duration-300 font-medium group">
              <span className="relative z-10">Dashboard</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#" className="relative text-black hover:text-blue-600 transition-all duration-300 font-medium group">
              <span className="relative z-10">My INFTs</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#" className="relative text-black hover:text-blue-600 transition-all duration-300 font-medium group">
              <span className="relative z-10">Explore</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
            </a>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {wallet.isConnected ? (
              <div className="flex items-center space-x-3">
                {/* Wallet Info */}
                <div className="relative flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 group">
                  <div className="relative z-10 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Icon icon="mdi:wallet" className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-black font-mono">
                      {formatAddress(wallet.address!)}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="p-1 hover:bg-green-500/20 rounded transition-all duration-300 hover:scale-110 group/copy"
                      title="Copy address"
                    >
                      <Icon 
                        icon={copied ? "mdi:check" : "mdi:content-copy"} 
                        className="w-4 h-4 text-blue-600 group-hover/copy:scale-110 transition-all duration-200"
                      />
                    </button>
                  </div>
                </div>

                {/* Balance */}
                {wallet.balance && (
                  <div className="relative text-sm text-black font-mono px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 group">
                    <span className="relative z-10 font-medium">
                      {parseFloat(wallet.balance).toFixed(4)} 0G
                    </span>
                  </div>
                )}

                {/* Disconnect Button */}
                <button
                  onClick={disconnectWallet}
                  className="relative p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 hover:scale-110 border border-gray-200 group"
                  title="Disconnect wallet"
                >
                  <Icon icon="mdi:logout" className="w-5 h-5 text-red-600 relative z-10 group-hover:scale-110 transition-transform duration-200" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2 relative group"
              >
                <div className="relative z-10 flex items-center space-x-2">
                  <Icon icon="mdi:wallet" className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-semibold">{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  {isConnecting && <div className="loading-spinner ml-2"></div>}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Copy Success Toast */}
      {copied && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          Address copied to clipboard!
        </div>
      )}
    </header>
  );
}

// Add fade-in animation to globals.css
// @keyframes fade-in {
//   from { opacity: 0; transform: translateY(-10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in {
//   animation: fade-in 0.3s ease-out;
// }