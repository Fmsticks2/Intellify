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
      {/* Floating Background Elements */}
      <motion.div 
        className="absolute top-20 left-10 w-32 h-32 rounded-full cyber-glow opacity-20"
        animate={{
          y: [-10, 10, -10]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
          filter: 'blur(1px)'
        }}
      />
      <motion.div 
        className="absolute top-40 right-20 w-24 h-24 rounded-full cyber-glow opacity-15"
        animate={{
          y: [-10, 10, -10]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        style={{
          background: 'radial-gradient(circle, rgba(22, 163, 74, 0.4) 0%, transparent 70%)',
          filter: 'blur(2px)'
        }}
      />
      <motion.div 
        className="absolute bottom-20 left-1/4 w-20 h-20 rounded-full cyber-glow opacity-25"
        animate={{
          y: [-10, 10, -10]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)',
          filter: 'blur(1.5px)'
        }}
      />
      
      {/* Matrix Grid Background */}
      <div className="absolute inset-0 matrix-bg opacity-30 pointer-events-none" />
      
      {/* Cyber Corner Elements */}
      <div className="absolute top-10 left-10 w-4 h-4 border-l-2 border-t-2 border-primary-500 opacity-60 animate-pulse-green" />
      <div className="absolute top-10 right-10 w-4 h-4 border-r-2 border-t-2 border-primary-500 opacity-60 animate-pulse-green" />
      <div className="absolute bottom-10 left-10 w-4 h-4 border-l-2 border-b-2 border-primary-500 opacity-60 animate-pulse-green" />
      <div className="absolute bottom-10 right-10 w-4 h-4 border-r-2 border-b-2 border-primary-500 opacity-60 animate-pulse-green" />

      {/* Hero Section */}
      <motion.div 
        className="text-center space-y-6 relative z-10"
        variants={itemVariants}
      >
        <motion.div
          className="glass-strong rounded-3xl p-8 mx-auto max-w-4xl cyber-border relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-shimmer" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-shimmer" style={{animationDelay: '1s'}} />
          </div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold gradient-text mb-6 text-glow"
          >
            Your AI Knowledge Companion
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto text-shadow-lg leading-relaxed"
          >
            Create, manage, and interact with your personalized <span className="text-primary-400 font-semibold">AI knowledge INFTs</span>. 
            Store your documents securely on <span className="text-primary-400 font-semibold">0G Network</span> and build intelligent companions 
            that learn from your data with <span className="text-primary-400 font-semibold">advanced encryption</span>.
          </motion.p>
          
          {/* Cyber Stats */}
          <motion.div 
            className="flex justify-center space-x-8 mt-8"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-400 font-mono">256-bit</div>
              <div className="text-sm text-gray-400">Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-400 font-mono">0G</div>
              <div className="text-sm text-gray-400">Network</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-400 font-mono">AI</div>
              <div className="text-sm text-gray-400">Powered</div>
            </div>
          </motion.div>
        </motion.div>
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