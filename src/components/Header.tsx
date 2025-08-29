'use client';

import React, { useState } from 'react';
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
    <header className={`glass-nav sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <img 
                src="/logo-professional.svg" 
                alt="Intellify Logo" 
                className="h-11 relative z-10 transition-all duration-300 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full blur-xl opacity-40 animate-pulse group-hover:opacity-60 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-400 rounded-full blur-md opacity-20 animate-ping" />
            </div>
            <h1 className="text-2xl font-bold gradient-text group-hover:text-shadow-lg transition-all duration-300">
              Intellify
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="relative text-gray-300 hover:text-green-400 transition-all duration-300 font-medium group">
              <span className="relative z-10">Dashboard</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-green-500 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#" className="relative text-gray-300 hover:text-green-400 transition-all duration-300 font-medium group">
              <span className="relative z-10">My INFTs</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-green-500 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#" className="relative text-gray-300 hover:text-green-400 transition-all duration-300 font-medium group">
              <span className="relative z-10">Explore</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-green-500 group-hover:w-full transition-all duration-300" />
            </a>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {wallet.isConnected ? (
              <div className="flex items-center space-x-3">
                {/* Wallet Info */}
                <div className="relative flex items-center space-x-2 glass px-4 py-2 rounded-xl cyber-border group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <img src="/icons/wallet.svg" alt="Wallet" className="w-5 h-5 filter brightness-0 invert" style={{filter: 'brightness(0) saturate(100%) invert(64%) sepia(98%) saturate(464%) hue-rotate(86deg) brightness(118%) contrast(119%)'}} />
                    <span className="text-sm font-medium text-green-300 font-mono">
                      {formatAddress(wallet.address!)}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="p-1 hover:bg-green-500/20 rounded transition-all duration-300 hover:scale-110 group/copy"
                      title="Copy address"
                    >
                      <img 
                        src="/icons/copy.svg" 
                        alt={copied ? "Copied!" : "Copy"} 
                        className="w-4 h-4 filter brightness-0 invert group-hover/copy:scale-110 transition-all duration-200" 
                        style={{filter: copied ? 'brightness(0) saturate(100%) invert(64%) sepia(98%) saturate(464%) hue-rotate(86deg) brightness(118%) contrast(119%)' : 'brightness(0) saturate(100%) invert(64%) sepia(98%) saturate(464%) hue-rotate(86deg) brightness(118%) contrast(119%)'}}
                      />
                    </button>
                  </div>
                </div>

                {/* Balance */}
                {wallet.balance && (
                  <div className="relative text-sm text-green-400 font-mono px-3 py-2 rounded-lg glass cyber-border group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 font-medium">
                      {parseFloat(wallet.balance).toFixed(4)} 0G
                    </span>
                  </div>
                )}

                {/* Disconnect Button */}
                <button
                  onClick={disconnectWallet}
                  className="relative p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 hover:scale-110 cyber-border group overflow-hidden"
                  title="Disconnect wallet"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <img src="/icons/disconnect.svg" alt="Disconnect" className="w-5 h-5 filter brightness-0 invert relative z-10 group-hover:scale-110 transition-transform duration-200" style={{filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'}} />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-primary flex items-center space-x-2 cyber-glow relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-center space-x-2">
                  <img src="/icons/wallet.svg" alt="Wallet" className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
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