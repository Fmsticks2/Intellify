'use client';

import React, { useState } from 'react';
import { useWallet } from './WalletProvider.js';

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
    <header className={`bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src="/logo.svg" alt="Intellify" className="h-10" />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Dashboard
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              My INFTs
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Explore
            </a>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {wallet.isConnected ? (
              <div className="flex items-center space-x-3">
                {/* Wallet Info */}
                <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-xl border border-blue-100">
                  <img src="/icons/wallet.svg" alt="Wallet" className="w-5 h-5" />
                  <span className="text-sm font-medium text-gray-700">
                    {formatAddress(wallet.address!)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                    title="Copy address"
                  >
                    <img 
                      src="/icons/copy.svg" 
                      alt={copied ? "Copied!" : "Copy"} 
                      className="w-4 h-4" 
                    />
                  </button>
                </div>

                {/* Balance */}
                {wallet.balance && (
                  <div className="text-sm text-gray-600">
                    {parseFloat(wallet.balance).toFixed(4)} 0G
                  </div>
                )}

                {/* Disconnect Button */}
                <button
                  onClick={disconnectWallet}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Disconnect wallet"
                >
                  <img src="/icons/disconnect.svg" alt="Disconnect" className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-primary flex items-center space-x-2"
              >
                <img src="/icons/wallet.svg" alt="Wallet" className="w-5 h-5" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Copy Success Toast */}
      {copied && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
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