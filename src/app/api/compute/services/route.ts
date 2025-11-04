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

    const services = await broker.inference.listService();
    const normalized = services.map((s: any) => ({
      provider: s.provider,
      serviceType: s.serviceType,
      url: s.url,
      inputPrice: typeof s.inputPrice === 'bigint' ? s.inputPrice.toString() : String(s.inputPrice ?? ''),
      outputPrice: typeof s.outputPrice === 'bigint' ? s.outputPrice.toString() : String(s.outputPrice ?? ''),
      updatedAt: typeof s.updatedAt === 'bigint' ? s.updatedAt.toString() : String(s.updatedAt ?? ''),
      model: s.model,
      verifiability: s.verifiability || ''
    }));

    return NextResponse.json({ services: normalized }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}