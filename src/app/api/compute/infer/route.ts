import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

function isZeroAddress(addr?: string) {
  return !addr || addr.toLowerCase() === '0x0000000000000000000000000000000000000000';
}

export async function POST(req: Request) {
  try {
    const { modelId, prompt, parameters, providerAddress: providerOverride, model: modelOverride } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
    }

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

    // Initialize broker per 0G docs
    const provider = new ethers.JsonRpcProvider(rpcEndpoint);
    const wallet = new ethers.Wallet(privateKey, provider);
    const broker = await createZGComputeNetworkBroker(wallet);

    // Ensure account has balance (do not auto-deposit on server route)
    const account = await broker.ledger.getLedger();
    const totalBalance = account?.totalBalance ?? 0n;
    if (totalBalance <= 0n) {
      return NextResponse.json({ error: 'Insufficient broker balance. Fund server signer on 0G.' }, { status: 402 });
    }

    // Discover services and select provider
    const services = await broker.inference.listService();
    if (!services || services.length === 0) {
      return NextResponse.json({ error: 'No compute services available from broker' }, { status: 503 });
    }
    let selected = services[0];
    if (modelOverride) {
      const byModel = services.find(s => s.model === modelOverride);
      if (byModel) selected = byModel;
    }
    if (providerOverride) {
      const byProvider = services.find(s => s.provider?.toLowerCase() === String(providerOverride).toLowerCase());
      if (byProvider) selected = byProvider;
    }
    const providerAddress = selected.provider;

    // Acknowledge provider signer per broker requirements
    await broker.inference.acknowledgeProviderSigner(providerAddress);

    // Get endpoint and model
    const metadata = await broker.inference.getServiceMetadata(providerAddress);
    const endpoint = metadata.endpoint;
    const model = metadata.model;

    // Generate single-use auth headers for messages
    const messages = parameters?.messages ?? [{ role: 'user', content: prompt }];
    const headers = await broker.inference.getRequestHeaders(providerAddress, JSON.stringify(messages));

    // Send chat request to provider endpoint
    const resp = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ messages, model })
    });
    if (!resp.ok) {
      const errBody = await resp.text();
      return NextResponse.json({ error: `Provider error: ${resp.status} ${errBody}` }, { status: 502 });
    }
    const data = await resp.json();
    const answer = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
    const chatID = data?.id ?? null;

    // Optional verification step (TEE providers)
    let isValid: boolean | null = null;
    try {
      isValid = await broker.inference.processResponse(providerAddress, answer, chatID);
    } catch {
      // Non-verifiable providers or processing errors
      isValid = null;
    }

    return NextResponse.json({ mode: 'broker', provider: providerAddress, model, answer, chatID, isValid }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}