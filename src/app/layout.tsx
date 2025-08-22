import React from 'react';
import './globals.css';
// import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { WalletProvider } from '../components/WalletProvider.js';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Intellify Wave 2',
  description: 'Decentralized AI Knowledge Companion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="">
        <div className="min-h-screen">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">I</span>
                    </div>
                    <h1 className="text-2xl font-bold gradient-text">Intellify</h1>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full">
                    Wave 2
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="hidden md:block text-sm text-gray-600">
                    Decentralized AI Knowledge Companion
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-gray-600">
                <p className="text-sm">
                  Powered by 0G Network • Built for Intellify Wave 2
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

// Extend Window interface for TypeScript