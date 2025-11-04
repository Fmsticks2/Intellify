import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();
    const amtNum = typeof amount === 'string' ? Number(amount) : amount;
    if (!amtNum || isNaN(amtNum) || amtNum <= 0) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
    }

    const rpcEndpoint =
      process.env.OG_MAINNET_RPC_URL ||
      process.env.NEXT_PUBLIC_0G_RPC_URL ||
      process.env.NEXT_PUBLIC_0G_NETWORK_RPC ||
      process.env.OG_TESTNET_RPC_URL ||
      'https://evmrpc.0g.ai';
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Server PRIVATE_KEY not configured' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(rpcEndpoint);
    const wallet = new ethers.Wallet(privateKey, provider);
    const broker = await createZGComputeNetworkBroker(wallet);

    await broker.ledger.depositFund(amtNum);
    const account = await broker.ledger.getLedger();
    const totalBalanceWei = account?.totalBalance ?? 0n;
    const totalBalance = ethers.formatEther(totalBalanceWei);

    return NextResponse.json({ ok: true, totalBalance, rawTotalBalance: totalBalanceWei.toString() }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}