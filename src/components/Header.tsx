'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useWallet } from './WalletProvider';

export default function Header() {
  const { wallet, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const [copied, setCopied] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const copyAddress = async () => {
    if (wallet.address) {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string | null) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string | null) => {
    if (!balance) return '0';
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    return num.toFixed(3);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'mdi:view-dashboard' },
    { name: 'Features', href: '#features', icon: 'mdi:star' },
    { name: 'Docs', href: '#', icon: 'mdi:book-open' },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Icon icon="mdi:brain" className="w-6 h-6 text-white" />
            </div>
            <div className="font-bold text-xl text-gray-900">
              Intellify
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon icon={item.icon} className="w-4 h-4" />
                <span>{item.name}</span>
              </motion.a>
            ))}
          </nav>

          {/* Wallet Section */}
          <div className="flex items-center space-x-4">
            {wallet.isConnected ? (
              <div className="flex items-center space-x-3">
                {/* Balance Display */}
                <motion.div 
                  className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Icon icon="mdi:wallet" className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {formatBalance(wallet.balance)} ETH
                  </span>
                </motion.div>

                {/* Address Display */}
                <motion.button
                  onClick={copyAddress}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Icon 
                    icon={copied ? "mdi:check" : "mdi:content-copy"} 
                    className={`w-4 h-4 ${copied ? 'text-green-600' : 'text-blue-600'}`} 
                  />
                  <span className="text-sm font-medium text-blue-700">
                    {formatAddress(wallet.address)}
                  </span>
                </motion.button>

                {/* Disconnect Button */}
                <motion.button
                  onClick={disconnectWallet}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Disconnect Wallet"
                >
                  <Icon icon="mdi:logout" className="w-5 h-5" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={connectWallet}
                disabled={isConnecting}
                className="group relative inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Icon icon="mdi:wallet" className="w-4 h-4 mr-2" />
                {isConnecting ? (
                  <>
                    <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Wallet
                    <Icon icon="mdi:arrow-right" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon 
                icon={isMobileMenuOpen ? "mdi:close" : "mdi:menu"} 
                className="w-6 h-6" 
              />
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-6 space-y-4">
                {navigation.map((item) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 text-gray-600 hover:text-blue-600 font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon icon={item.icon} className="w-5 h-5" />
                    <span>{item.name}</span>
                  </motion.a>
                ))}
                
                {wallet.isConnected && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Balance:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatBalance(wallet.balance)} ETH
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Address:</span>
                      <button
                        onClick={copyAddress}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {formatAddress(wallet.address)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Copy Success Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            className="fixed top-24 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:check-circle" className="w-4 h-4" />
              <span className="text-sm font-medium">Address copied!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}