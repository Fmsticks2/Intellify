'use client';

import React from 'react';
import IntellifyDashboard from '../../components/IntellifyDashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-[60vh]">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your AI Knowledge INFTs, privacy, analytics, and more.</p>
      </div>
      <IntellifyDashboard />
    </div>
  );
}