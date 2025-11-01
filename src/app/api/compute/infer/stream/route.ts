import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

export async function POST(req: Request) {
  try {
    const { prompt, parameters, providerAddress: providerOverride, model: modelOverride } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid prompt' }), { status: 400 });
    }

    const rpcEndpoint = process.env.OG_MAINNET_RPC_URL || process.env.NEXT_PUBLIC_0G_NETWORK_RPC || 'https://evmrpc.0g.ai';
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return new Response(JSON.stringify({ error: 'Server PRIVATE_KEY not configured' }), { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(rpcEndpoint);
    const wallet = new ethers.Wallet(privateKey, provider);
    const broker = await createZGComputeNetworkBroker(wallet);

    const account = await broker.ledger.getLedger();
    const totalBalance = account?.totalBalance ?? 0n;
    if (totalBalance <= 0n) {
      return new Response(JSON.stringify({ error: 'Insufficient broker balance. Fund server signer on 0G.' }), { status: 402 });
    }

    const services = await broker.inference.listService();
    if (!services || services.length === 0) {
      return new Response(JSON.stringify({ error: 'No compute services available from broker' }), { status: 503 });
    }
    let selected = services[0];
    if (modelOverride) {
      const byModel = services.find((s: any) => s.model === modelOverride);
      if (byModel) selected = byModel;
    }
    if (providerOverride) {
      const byProvider = services.find((s: any) => s.provider?.toLowerCase() === String(providerOverride).toLowerCase());
      if (byProvider) selected = byProvider;
    }
    const providerAddress = selected.provider;
    await broker.inference.acknowledgeProviderSigner(providerAddress);
    const metadata = await broker.inference.getServiceMetadata(providerAddress);
    const endpoint = metadata.endpoint;
    const model = metadata.model;

    const messages = parameters?.messages ?? [{ role: 'user', content: prompt }];
    const headers = await broker.inference.getRequestHeaders(providerAddress, JSON.stringify(messages));

    const resp = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ messages, model, stream: true })
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return new Response(JSON.stringify({ error: `Provider error: ${resp.status} ${errBody}` }), { status: 502 });
    }

    // Proxy SSE stream directly
    const sseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    } as Record<string, string>;

    return new Response(resp.body, { headers: sseHeaders, status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}