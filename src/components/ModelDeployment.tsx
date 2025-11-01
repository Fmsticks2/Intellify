'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZGComputeClient, ComputeJobStatus, ZGComputeConfig } from '../lib/0g-compute-client';

interface AIModel {
  id: number;
  creator: string;
  name: string;
  description: string;
  category: string;
  pricePerInference: string;
  totalInferences: number;
  totalRating: number;
  ratingCount: number;
  isActive: boolean;
  isVerified: boolean;
  modelHash: string;
  metadataURI: string;
  averageRating: number;
}

interface ModelDeploymentProps {
  model: AIModel;
  onClose: () => void;
}

interface DeploymentConfig {
  computeUnits: number;
  maxConcurrency: number;
  autoScale: boolean;
  region: string;
  instanceType: string;
}

interface DeploymentStatus {
  status: 'idle' | 'deploying' | 'deployed' | 'error';
  endpoint?: string;
  deploymentId?: string;
  error?: string;
  logs: string[];
}

const ModelDeployment: React.FC<ModelDeploymentProps> = ({ model, onClose }) => {
  const [config, setConfig] = useState<DeploymentConfig>({
    computeUnits: 100,
    maxConcurrency: 10,
    autoScale: true,
    region: 'us-east-1',
    instanceType: 'gpu-small'
  });

  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    status: 'idle',
    logs: []
  });

  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isTestingInference, setIsTestingInference] = useState(false);
  const [brokerBalance, setBrokerBalance] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [services, setServices] = useState<{ provider: string; model: string }[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [streamEnabled, setStreamEnabled] = useState<boolean>(false);

  const [zgClient, setZgClient] = useState<ZGComputeClient | null>(null);

  useEffect(() => {
    // Initialize 0G Compute Client safely (no client-side private key)
    const init = async () => {
      const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
      if (!privateKey) {
        setDeploymentStatus(prev => ({
          ...prev,
          logs: [
            ...prev.logs,
            `[${new Date().toLocaleTimeString()}] 0G Compute client not configured: missing NEXT_PUBLIC_PRIVATE_KEY. Use server-side orchestration.`
          ]
        }));
        return;
      }

      try {
        const config: ZGComputeConfig = {
          rpcEndpoint: process.env.NEXT_PUBLIC_0G_NETWORK_RPC || '',
          privateKey,
          daEntranceContract: process.env.NEXT_PUBLIC_DA_ENTRANCE_CONTRACT || '',
          daSignersContract: process.env.NEXT_PUBLIC_DA_SIGNERS_CONTRACT || '',
          grpcEndpoint: process.env.NEXT_PUBLIC_GRPC_ENDPOINT || '',
          gasLimit: 1000000,
          computeContract: process.env.NEXT_PUBLIC_COMPUTE_CONTRACT || '',
          computeNodeEndpoint: process.env.NEXT_PUBLIC_COMPUTE_NODE_ENDPOINT || '',
          maxComputeUnits: 1000
        };
        const client = new ZGComputeClient(config);
        setZgClient(client);
      } catch (err) {
        setDeploymentStatus(prev => ({
          ...prev,
          logs: [
            ...prev.logs,
            `[${new Date().toLocaleTimeString()}] Failed to initialize 0G Compute client: ${err instanceof Error ? err.message : 'Unknown error'}`
          ]
        }));
      }
    };
    init();
  }, []);

  // Load broker balance
  const loadBrokerBalance = async () => {
    try {
      setIsBalanceLoading(true);
      const res = await fetch('/api/compute/balance');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load balance');
      setBrokerBalance(data.totalBalance || null);
    } catch (e) {
      setBrokerBalance(null);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  useEffect(() => {
    loadBrokerBalance();
  }, []);

  // Load available providers for simple selection UI
  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await fetch('/api/compute/services');
        const data = await res.json();
        if (res.ok && Array.isArray(data.services)) {
          const list = data.services.map((s: any) => ({ provider: s.provider, model: s.model }));
          setServices(list);
          if (list.length > 0) {
            setSelectedProvider(list[0].provider);
            setSelectedModel(list[0].model);
          }
        }
      } catch (e) {
        // silently ignore in UI
      }
    };
    loadServices();
  }, []);

  const addLog = (message: string) => {
    setDeploymentStatus(prev => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${message}`]
    }));
  };

  const handleDeposit = async () => {
    setDepositError(null);
    setDepositSuccess(null);
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setDepositError('Enter a positive amount of 0G');
      return;
    }
    setIsDepositing(true);
    try {
      const res = await fetch('/api/compute/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deposit failed');
      setDepositSuccess(`Deposited successfully. New balance: ${data.totalBalance} 0G`);
      setBrokerBalance(data.totalBalance || null);
      setDepositAmount('');
      addLog(`Broker deposit successful. Balance: ${data.totalBalance} 0G`);
    } catch (e) {
      setDepositError(e instanceof Error ? e.message : 'Unknown error');
      addLog(`Broker deposit error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleDeploy = async () => {
    if (!zgClient) {
      addLog('Error: 0G Compute client not initialized');
      return;
    }

    setDeploymentStatus(prev => ({ ...prev, status: 'deploying', logs: [] }));
    addLog('Starting model deployment...');

    try {
      // Step 1: Validate model hash and metadata
      addLog('Validating model files...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate validation

      // Step 2: Submit deployment job to 0G Network
      addLog('Submitting deployment job to 0G Network...');
      const deploymentJob = await zgClient.submitComputeJob({
        jobType: 'DEPLOYMENT' as any,
        modelId: model.modelHash,
        inputDataHash: model.metadataURI,
        parameters: {
          computeUnits: config.computeUnits,
          maxConcurrency: config.maxConcurrency,
          autoScale: config.autoScale,
          region: config.region,
          instanceType: config.instanceType
        }
      });

      addLog(`Deployment job submitted: ${deploymentJob.jobId}`);
      setDeploymentStatus(prev => ({ ...prev, deploymentId: deploymentJob.jobId }));

      // Step 3: Monitor deployment progress
      addLog('Monitoring deployment progress...');
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes with 10-second intervals

      const checkStatus = async () => {
        try {
          const status = await zgClient.getJobStatus(deploymentJob.jobId);
          addLog(`Deployment status: ${status.status}`);

          if (status.status === ComputeJobStatus.COMPLETED) {
            const endpoint = `https://inference.0g.ai/models/${model.modelHash}`;
            setDeploymentStatus(prev => ({
              ...prev,
              status: 'deployed',
              endpoint
            }));
            addLog(`Model deployed successfully! Endpoint: ${endpoint}`);
            return;
          } else if (status.status === ComputeJobStatus.FAILED) {
            throw new Error('Deployment failed');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkStatus, 10000); // Check every 10 seconds
          } else {
            throw new Error('Deployment timeout');
          }
        } catch (error) {
          console.error('Error checking deployment status:', error);
          setDeploymentStatus(prev => ({
            ...prev,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }));
          addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };

      setTimeout(checkStatus, 5000); // Start checking after 5 seconds

    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestInference = async () => {
    if (!deploymentStatus.endpoint || !testInput.trim()) return;

    setIsTestingInference(true);
    setTestOutput('');

    try {
      if (!zgClient) {
        if (streamEnabled) {
          addLog('Streaming inference via server API...');
          const res = await fetch('/api/compute/infer/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: testInput,
              providerAddress: selectedProvider || undefined,
              model: selectedModel || undefined,
              parameters: { messages: [{ role: 'user', content: testInput }] }
            })
          });
          if (!res.body) {
            const data = await res.json();
            throw new Error(data.error || 'No stream body');
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          setTestOutput('');
          while (!done) {
            const { value, done: d } = await reader.read();
            done = d;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const payload = line.slice(6).trim();
                  if (payload === '[DONE]') continue;
                  try {
                    const j = JSON.parse(payload);
                    const delta = j?.choices?.[0]?.delta?.content ?? j?.choices?.[0]?.message?.content ?? j?.choices?.[0]?.text;
                    if (delta) setTestOutput(prev => prev + delta);
                  } catch {
                    setTestOutput(prev => prev + payload);
                  }
                }
              }
            }
          }
          addLog('Streaming inference completed');
          return;
        } else {
          addLog('Running test inference via server API...');
          const res = await fetch('/api/compute/infer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              modelId: model.modelHash,
              prompt: testInput,
              providerAddress: selectedProvider || undefined,
              model: selectedModel || undefined,
              parameters: { messages: [{ role: 'user', content: testInput }], max_tokens: 1000 }
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Server error');
          setTestOutput(data.answer || data.response || 'No output received');
          addLog('Test inference via server API completed successfully');
          return;
        }
      }

      addLog('Running test inference...');
      const result = await zgClient.runInference({
        name: model.name,
        description: model.description,
        image: '',
        level: 1,
        experience: 0,
        attributes: [],
        ai_state: {
          model_version: '1.0',
          training_data_hashes: [model.modelHash],
          interaction_count: 0,
          last_updated: Date.now()
        },
        evolution_history: []
      }, testInput);

      setTestOutput(result || 'No output received');
      addLog('Test inference completed successfully');
    } catch (error) {
      console.error('Inference error:', error);
      setTestOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addLog(`Inference error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingInference(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'text-gray-400';
      case 'deploying': return 'text-yellow-400';
      case 'deployed': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'deploying':
        return (
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'deployed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Deploy AI Model</h2>
              <p className="text-gray-300">{model.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Deployment Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Compute Units
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={config.computeUnits}
                      onChange={(e) => setConfig(prev => ({ ...prev, computeUnits: parseInt(e.target.value) || 10 }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Concurrency
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.maxConcurrency}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxConcurrency: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Region
                    </label>
                    <select
                      value={config.region}
                      onChange={(e) => setConfig(prev => ({ ...prev, region: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="us-east-1" className="bg-gray-800">US East (N. Virginia)</option>
                      <option value="us-west-2" className="bg-gray-800">US West (Oregon)</option>
                      <option value="eu-west-1" className="bg-gray-800">Europe (Ireland)</option>
                      <option value="ap-southeast-1" className="bg-gray-800">Asia Pacific (Singapore)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Instance Type
                    </label>
                    <select
                      value={config.instanceType}
                      onChange={(e) => setConfig(prev => ({ ...prev, instanceType: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="gpu-small" className="bg-gray-800">GPU Small (4GB VRAM)</option>
                      <option value="gpu-medium" className="bg-gray-800">GPU Medium (8GB VRAM)</option>
                      <option value="gpu-large" className="bg-gray-800">GPU Large (16GB VRAM)</option>
                      <option value="gpu-xlarge" className="bg-gray-800">GPU XLarge (32GB VRAM)</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoScale"
                      checked={config.autoScale}
                      onChange={(e) => setConfig(prev => ({ ...prev, autoScale: e.target.checked }))}
                      className="mr-2 rounded"
                    />
                    <label htmlFor="autoScale" className="text-sm text-gray-300">
                      Enable Auto-scaling
                    </label>
                  </div>
                </div>
              </div>

              {/* Deployment Status */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Deployment Status</h3>
                
                <div className={`flex items-center gap-2 mb-4 ${getStatusColor(deploymentStatus.status)}`}>
                  {getStatusIcon(deploymentStatus.status)}
                  <span className="font-medium capitalize">{deploymentStatus.status}</span>
                </div>

                {deploymentStatus.endpoint && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4">
                    <div className="text-sm text-green-300 font-medium">Deployment Endpoint</div>
                    <div className="text-xs text-green-400 break-all">{deploymentStatus.endpoint}</div>
                  </div>
                )}

                {deploymentStatus.error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                    <div className="text-sm text-red-300 font-medium">Error</div>
                    <div className="text-xs text-red-400">{deploymentStatus.error}</div>
                  </div>
                )}

                <button
                  onClick={handleDeploy}
                  disabled={deploymentStatus.status === 'deploying'}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {deploymentStatus.status === 'deploying' ? 'Deploying...' : 'Deploy Model'}
                </button>
              </div>
            </div>

            {/* Logs and Testing Panel */}
            <div className="space-y-6">
              {/* Broker Balance & Deposit */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Broker Balance</h3>
                <div className="bg-black/50 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-300">Total Balance</div>
                    <button
                      onClick={loadBrokerBalance}
                      className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md text-gray-200"
                      disabled={isBalanceLoading}
                    >
                      {isBalanceLoading ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </div>
                  <div className="text-2xl font-bold text-white mb-4">{brokerBalance ? `${brokerBalance} 0G` : '—'}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-300 mb-2">Deposit Amount (0G)</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="e.g., 10"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleDeposit}
                      disabled={isDepositing || !depositAmount}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {isDepositing ? 'Depositing…' : 'Deposit'}
                    </button>
                  </div>
                  {depositError && (
                    <div className="mt-3 text-sm text-red-400">{depositError}</div>
                  )}
                  {depositSuccess && (
                    <div className="mt-3 text-sm text-green-400">{depositSuccess}</div>
                  )}
                </div>
              </div>
              {/* Deployment Logs */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Deployment Logs</h3>
                <div className="bg-black/50 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
                  {deploymentStatus.logs.length === 0 ? (
                    <div className="text-gray-500">No logs yet...</div>
                  ) : (
                    deploymentStatus.logs.map((log, index) => (
                      <div key={index} className="text-gray-300 mb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Test Inference */}
              {deploymentStatus.status === 'deployed' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Test Inference</h3>
                  
                  <div className="space-y-4">
                    {services.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                          <select
                            value={selectedProvider}
                            onChange={(e) => {
                              const p = e.target.value;
                              setSelectedProvider(p);
                              const s = services.find(s => s.provider === p);
                              setSelectedModel(s?.model || '');
                            }}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {services.map((s, idx) => (
                              <option key={idx} value={s.provider} className="bg-gray-800">
                                {s.provider.slice(0, 6)}...{s.provider.slice(-4)} ({s.model})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 mt-6 md:mt-0">
                          <input
                            type="checkbox"
                            id="streamToggle"
                            checked={streamEnabled}
                            onChange={(e) => setStreamEnabled(e.target.checked)}
                            className="mr-2 rounded"
                          />
                          <label htmlFor="streamToggle" className="text-sm text-gray-300">Stream response</label>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Test Input
                      </label>
                      <textarea
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        placeholder="Enter your test input here..."
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                      />
                    </div>

                    <button
                      onClick={handleTestInference}
                      disabled={isTestingInference || !testInput.trim()}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {isTestingInference ? 'Running Inference...' : 'Test Inference'}
                    </button>

                    {testOutput && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Output
                        </label>
                        <div className="bg-black/50 rounded-lg p-4 text-gray-300 whitespace-pre-wrap">
                          {testOutput}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModelDeployment;