'use client';

import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, arbitrum, polygon, base, sepolia } from '@reown/appkit/networks';

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'your-project-id-here';

// 2. Set the networks
const networks = [mainnet, arbitrum, polygon, base, sepolia];

// 3. Create a metadata object - optional
const metadata = {
  name: 'Intellify Wave 2',
  description: 'Intellify Wave 2 - 0G Labs Integration',
  url: 'https://intellify.app', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
};

// 4. Create Ethers adapter
const ethersAdapter = new EthersAdapter();

// 5. Create a AppKit instance
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  }
});

export { ethersAdapter };