import 'dotenv/config';
import { ethers } from 'ethers';

// Minimal ABI for admin operations
const ABI = [
  'function owner() view returns (address)',
  'function paused() view returns (bool)',
  'function publicMintEnabled() view returns (bool)',
  'function unpause()',
  'function setPublicMintEnabled(bool enabled)'
];

async function main() {
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_INFT_CONTRACT_ADDRESS
    || process.env.NEXT_PUBLIC_INTELLIFY_CONTRACT_ADDRESS
    || process.env.CONTRACT_ADDRESS;

  const RPC_URL = [
    process.env.NEXT_PUBLIC_RPC_URL,
    process.env.NEXT_PUBLIC_0G_RPC_URL,
    process.env.NEXT_PUBLIC_0G_NETWORK_RPC,
    process.env.OG_MAINNET_RPC_URL,
    process.env.OG_GALILEO_RPC_URL,
    process.env.RPC_URL,
  ].find(Boolean) || 'https://evmrpc.0g.ai';

  let rawKey = process.env.PRIVATE_KEY || process.env.NEXT_PUBLIC_PRIVATE_KEY || process.env.OWNER_PRIVATE_KEY;

  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    throw new Error('Missing contract address. Set NEXT_PUBLIC_INFT_CONTRACT_ADDRESS in .env.local');
  }
  if (!RPC_URL) {
    throw new Error('Missing RPC URL. Set NEXT_PUBLIC_RPC_URL or NEXT_PUBLIC_0G_RPC_URL in .env.local');
  }
  if (!rawKey) {
    throw new Error('Missing owner PRIVATE_KEY in environment');
  }

  // Sanitize private key: trim, remove surrounding quotes, ensure 0x prefix
  rawKey = rawKey.trim().replace(/^"(.*)"$/, '$1').replace(/^\'(.*)\'$/, '$1');
  const PRIVATE_KEY = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;

  console.log('Using RPC:', RPC_URL);
  let provider = new ethers.JsonRpcProvider(RPC_URL);
  let wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  let contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  let bytecode = await provider.getCode(CONTRACT_ADDRESS);
  if (!bytecode || bytecode === '0x') {
    const candidates = Array.from(new Set([
      RPC_URL,
      process.env.OG_MAINNET_RPC_URL,
      process.env.NEXT_PUBLIC_0G_RPC_URL,
      process.env.NEXT_PUBLIC_0G_NETWORK_RPC,
      'https://evmrpc.0g.ai',
      'https://evmrpc-testnet.0g.ai',
    ].filter(Boolean)));
    let found = false;
    for (const url of candidates) {
      try {
        const p = new ethers.JsonRpcProvider(url);
        const code = await p.getCode(CONTRACT_ADDRESS);
        if (code && code !== '0x') {
          console.log('Found contract code on RPC:', url);
          provider = p;
          wallet = new ethers.Wallet(PRIVATE_KEY, provider);
          contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
          bytecode = code;
          found = true;
          break;
        }
      } catch {}
    }
    if (!found) {
      throw new Error(`No contract code found at ${CONTRACT_ADDRESS}. Check address and RPC network.`);
    }
  }

  let owner = null;
  try {
    owner = await contract.owner();
  } catch {}
  const [paused, mintEnabled] = await Promise.all([
    contract.paused().catch(() => null),
    contract.publicMintEnabled().catch(() => null),
  ]);

  console.log('Connected as:', wallet.address);
  if (owner) {
    console.log('Contract owner:', owner);
    if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
      throw new Error('Wallet is not contract owner. Use the owner PRIVATE_KEY.');
    }
  } else {
    console.log('Owner() not readable, proceeding to attempt admin ops.');
  }

  if (paused === true) {
    console.log('Contract is paused. Unpausing...');
    const tx = await contract.unpause();
    console.log('Tx submitted:', tx.hash);
    await tx.wait();
    console.log('Unpaused. tx:', tx.hash);
  } else {
    console.log('Contract already active.');
  }

  if (mintEnabled === false) {
    console.log('Public mint disabled. Enabling...');
    const tx2 = await contract.setPublicMintEnabled(true);
    console.log('Tx submitted:', tx2.hash);
    await tx2.wait();
    console.log('Public mint enabled. tx:', tx2.hash);
  } else {
    console.log('Public mint already enabled.');
  }

  const pausedNow = await contract.paused().catch(() => null);
  const mintNow = await contract.publicMintEnabled().catch(() => null);
  console.log('Final state => paused:', pausedNow, 'publicMintEnabled:', mintNow);
}

main().catch((err) => {
  console.error('Failed to enable public mint:', err?.reason || err?.message || err);
  process.exit(1);
});