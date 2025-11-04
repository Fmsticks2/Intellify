'use client';

import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, sepolia, type AppKitNetwork } from '@reown/appkit/networks';

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '2f05a7cac472eca57b2ddc64525093d8';

// 2. Define 0G Network from environment (optional)
const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID ? Number(process.env.NEXT_PUBLIC_CHAIN_ID) : undefined;
const envChainName = process.env.NEXT_PUBLIC_CHAIN_NAME;
const envRpcUrl = process.env.NEXT_PUBLIC_0G_RPC_URL || process.env.NEXT_PUBLIC_0G_NETWORK_RPC;
const envExplorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL;
const isTestnet = String(process.env.NEXT_PUBLIC_IS_TESTNET || '').toLowerCase() === 'true';

const ogNetwork: AppKitNetwork | null = (envChainId && envRpcUrl && envChainName) ? {
  id: envChainId,
  name: envChainName,
  nativeCurrency: {
    decimals: 18,
    name: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME || 'OG',
    symbol: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL || 'OG',
  },
  rpcUrls: {
    default: {
      http: [envRpcUrl],
    },
    public: {
      http: [envRpcUrl],
    },
  },
  blockExplorers: envExplorerUrl ? {
    default: {
      name: envChainName + ' Explorer',
      url: envExplorerUrl,
    },
  } : undefined,
  testnet: isTestnet,
} : null;

// 3. Set the networks
const baseNetworks: AppKitNetwork[] = [sepolia, mainnet];
const networks: [AppKitNetwork, ...AppKitNetwork[]] = ogNetwork ? [ogNetwork, ...baseNetworks] : [mainnet, sepolia];

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