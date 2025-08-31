'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import IntellifyDashboard from '../components/IntellifyDashboard';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0
    }
  };



  return (
    <motion.div 
      className="space-y-8 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Clean Professional Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50 pointer-events-none" />

      {/* Hero Section */}
      <motion.div 
        className="text-center space-y-6 relative z-10"
        variants={itemVariants}
      >
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Your AI Knowledge Companion
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Create, manage, and interact with your personalized <span className="text-blue-600 font-semibold">AI knowledge INFTs</span>. 
            Store your documents securely on <span className="text-blue-600 font-semibold">0G Network</span> and build intelligent companions 
            that learn from your data with <span className="text-blue-600 font-semibold">advanced encryption</span>.
          </motion.p>
          
          {/* Professional Stats */}
          <motion.div 
            className="flex justify-center space-x-12 mt-12"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">256-bit</div>
              <div className="text-sm text-gray-500 font-medium">Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">0G</div>
              <div className="text-sm text-gray-500 font-medium">Network</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">AI</div>
              <div className="text-sm text-gray-500 font-medium">Powered</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Dashboard */}
      <motion.div
        variants={itemVariants}
        className="relative z-10"
      >
        <IntellifyDashboard />
      </motion.div>
    </motion.div>
  );
}