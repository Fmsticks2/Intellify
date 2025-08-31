import React from 'react';
import './globals.css';
// import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { WalletProvider } from '../components/WalletProvider'
import Header from '../components/Header';

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
      <body className="bg-white">
        <WalletProvider>
          <div className="min-h-screen bg-white">
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}

// Extend Window interface for TypeScript