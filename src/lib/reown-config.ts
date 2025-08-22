'use client';

import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, arbitrum, polygon, base, sepolia } from '@reown/appkit/networks';

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '2f05a7cac472eca57b2ddc64525093d8';

// 2. Define 0G Network
const ogNetwork = {
  id: 16600,
  name: '0G Newton Testnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: '0G',
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc-testnet.0g.ai'],
    },
    public: {
      http: ['https://evmrpc-testnet.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: 'https://chainscan-newton.0g.ai',
    },
  },
  testnet: true,
};

// 3. Set the networks
const networks = [ogNetwork, sepolia, mainnet];

// 4. Create a metadata object - optional
const metadata = {
  name: 'Intellify Wave 2',
  description: 'Intellify Wave 2 - 0G Labs Integration',
  url: 'https://intellify.app', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
};

// 5. Create Ethers adapter
const ethersAdapter = new EthersAdapter();

// 6. Create a AppKit instance
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