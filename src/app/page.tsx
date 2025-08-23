'use client';

import React, { useState, useEffect } from 'react';
import IntellifyDashboard from '../components/IntellifyDashboard.js';

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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold gradient-text">
          Your AI Knowledge Companion
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Create, manage, and interact with your personalized AI knowledge NFTs. 
          Store your documents securely on 0G Network and build intelligent companions 
          that learn from your data.
        </p>
      </div>

      {/* Dashboard */}
      <IntellifyDashboard />
    </div>
  );
}