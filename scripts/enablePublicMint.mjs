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
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    throw new Error('Missing contract address. Set NEXT_PUBLIC_INFT_CONTRACT_ADDRESS in .env.local');
  }
  if (!RPC_URL) {
    throw new Error('Missing RPC URL. Set NEXT_PUBLIC_RPC_URL in .env.local');
  }
  if (!PRIVATE_KEY) {
    throw new Error('Missing owner PRIVATE_KEY in environment');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  const [owner, paused, mintEnabled] = await Promise.all([
    contract.owner(),
    contract.paused(),
    contract.publicMintEnabled(),
  ]);

  console.log('Connected as:', wallet.address);
  console.log('Contract owner:', owner);
  if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
    throw new Error('Wallet is not contract owner. Use the owner PRIVATE_KEY.');
  }

  if (paused) {
    console.log('Contract is paused. Unpausing...');
    const tx = await contract.unpause();
    await tx.wait();
    console.log('Unpaused. tx:', tx.hash);
  } else {
    console.log('Contract already active.');
  }

  if (!mintEnabled) {
    console.log('Public mint disabled. Enabling...');
    const tx2 = await contract.setPublicMintEnabled(true);
    await tx2.wait();
    console.log('Public mint enabled. tx:', tx2.hash);
  } else {
    console.log('Public mint already enabled.');
  }

  const [pausedNow, mintNow] = await Promise.all([
    contract.paused(),
    contract.publicMintEnabled(),
  ]);
  console.log('Final state => paused:', pausedNow, 'publicMintEnabled:', mintNow);
}

main().catch((err) => {
  console.error('Failed to enable public mint:', err?.reason || err?.message || err);
  process.exit(1);
});