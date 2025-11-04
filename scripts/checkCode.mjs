import 'dotenv/config';
import { ethers } from 'ethers';

const mainnetRpc = process.env.OG_MAINNET_RPC_URL || 'https://evmrpc.0g.ai';
const testnetRpc = process.env.OG_GALILEO_RPC_URL || process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai';

const addrs = [
  process.env.NEXT_PUBLIC_INFT_CONTRACT_ADDRESS,
  process.env.NEXT_PUBLIC_INTELLIFY_CONTRACT_ADDRESS,
  '0xb9bbFCe33475685AF6F0DD6Ee8851eE19e9091d2',
  '0xc8B88707f598CAFd3816aaB9A10f65380D6AA6a7',
  '0xC39aa6d4EFAAcafF6C8Ab973D9a2761AbB49a8ae'
].filter(Boolean);

async function check(providerUrl, label) {
  const provider = new ethers.JsonRpcProvider(providerUrl);
  console.log(`\nChecking on ${label} (${providerUrl})`);
  for (const addr of addrs) {
    try {
      const code = await provider.getCode(addr);
      console.log(addr, code && code !== '0x' ? 'HAS CODE' : 'NO CODE');
    } catch (e) {
      console.log(addr, 'ERROR', e?.message || e);
    }
  }
}

await check(mainnetRpc, 'Mainnet');
await check(testnetRpc, 'Testnet');