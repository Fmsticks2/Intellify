import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

export async function GET() {
  try {
    const rpcEndpoint =
      process.env.OG_TESTNET_RPC_URL ||
      process.env.OG_MAINNET_RPC_URL ||
      process.env.NEXT_PUBLIC_0G_RPC_URL ||
      process.env.NEXT_PUBLIC_0G_NETWORK_RPC ||
      'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Server PRIVATE_KEY not configured' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(rpcEndpoint);
    const wallet = new ethers.Wallet(privateKey, provider);
    const broker = await createZGComputeNetworkBroker(wallet);

    const account = await broker.ledger.getLedger();
    const totalBalanceWei = account?.totalBalance ?? 0n;
    const totalBalance = ethers.formatEther(totalBalanceWei);

    return NextResponse.json({ totalBalance, rawTotalBalance: totalBalanceWei.toString(), account }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}