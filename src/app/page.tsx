'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import IntellifyDashboard from '../components/IntellifyDashboard';
import { useWallet } from '../components/WalletProvider';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const { wallet, connectWallet, isConnecting } = useWallet();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const features = [
    {
      icon: "mdi:brain-outline",
      title: "AI-Powered INFTs",
      description: "Create intelligent NFTs that learn and evolve with your data using advanced AI models."
    },
    {
      icon: "mdi:shield-lock",
      title: "256-bit Encryption",
      description: "Military-grade encryption ensures your data remains private and secure at all times."
    },
    {
      icon: "mdi:network",
      title: "0G Network",
      description: "Built on the high-performance 0G blockchain for optimal speed and reliability."
    },
    {
      icon: "mdi:chart-line",
      title: "Real-time Analytics",
      description: "Track performance, interactions, and growth of your AI companions in real-time."
    },
    {
      icon: "mdi:account-group",
      title: "Social Features",
      description: "Connect with other users, share knowledge, and collaborate on AI development."
    },
    {
      icon: "mdi:store",
      title: "Marketplace",
      description: "Trade AI models, knowledge bases, and earn rewards in our decentralized marketplace."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <motion.section 
        className="relative overflow-hidden py-20 lg:py-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              variants={itemVariants}
              className="mb-8"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
                <Icon icon="mdi:new-box" className="w-4 h-4 mr-2" />
                Introducing ERC-7857 Standard
              </div>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight"
            >
              Your AI Knowledge
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Companion
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12"
            >
              Create, manage, and interact with personalized AI knowledge INFTs. 
              Store documents securely on the 0G Network and build intelligent companions 
              that learn from your data with advanced encryption.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              {!wallet.isConnected ? (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="group relative inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="mdi:wallet" className="w-6 h-6 mr-3" />
                  {isConnecting ? 'Connecting...' : 'Get Started'}
                  <Icon icon="mdi:arrow-right" className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <a
                  href="/dashboard"
                  className="group relative inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  <Icon icon="mdi:view-dashboard" className="w-6 h-6 mr-3" />
                  Go to Dashboard
                  <Icon icon="mdi:arrow-right" className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              )}
              
              <a
                href="#features"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <Icon icon="mdi:information" className="w-6 h-6 mr-3" />
                Learn More
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
              <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="text-4xl font-bold text-blue-600 mb-2">256-bit</div>
                <div className="text-gray-600 font-medium">Military-Grade Encryption</div>
              </div>
              <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="text-4xl font-bold text-purple-600 mb-2">0G</div>
                <div className="text-gray-600 font-medium">High-Performance Network</div>
              </div>
              <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="text-4xl font-bold text-green-600 mb-2">AI</div>
                <div className="text-gray-600 font-medium">Powered Intelligence</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features"
        className="py-20 bg-white"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the cutting-edge capabilities that make Intellify the future of AI-powered knowledge management.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon icon={feature.icon} className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Dashboard moved to standalone /dashboard page */}

      {/* CTA Section */}
      {!wallet.isConnected && (
        <motion.section 
          className="py-20 bg-gradient-to-r from-blue-600 to-purple-600"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2 
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Ready to Get Started?
            </motion.h2>
            <motion.p 
              variants={itemVariants}
              className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
            >
              Join thousands of users creating intelligent AI companions. Connect your wallet and start building today.
            </motion.p>
            <motion.button
              variants={itemVariants}
              onClick={connectWallet}
              disabled={isConnecting}
              className="group inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon icon="mdi:wallet" className="w-6 h-6 mr-3" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              <Icon icon="mdi:arrow-right" className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.section>
      )}
    </div>
  );
}