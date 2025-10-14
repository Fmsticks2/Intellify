'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useWallet } from './WalletProvider';
import { use0GCompute } from '../hooks/use0GCompute';

interface InferenceSession {
  id: string;
  modelId: string;
  modelName: string;
  status: 'idle' | 'connecting' | 'running' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  inputData: any;
  outputData?: any;
  metrics: {
    latency: number;
    throughput: number;
    accuracy?: number;
    confidence?: number;
  };
}

interface RealTimeInferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RealTimeInference({ isOpen, onClose }: RealTimeInferenceProps) {
  const { wallet } = useWallet();
  const {
    availableModels,
    activeSession,
    loading,
    connectToModel,
    runInference,
    disconnectFromModel,
    getModelMetrics,
    streamInference
  } = use0GCompute();

  const [selectedModel, setSelectedModel] = useState<string>('');
  const [inputData, setInputData] = useState<string>('');
  const [inputType, setInputType] = useState<'text' | 'image' | 'audio' | 'json'>('text');
  const [sessions, setSessions] = useState<InferenceSession[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamOutput, setStreamOutput] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced settings
  const [batchSize, setBatchSize] = useState(1);
  const [maxTokens, setMaxTokens] = useState(100);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);

  const streamRef = useRef<any>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamOutput]);

  const handleModelConnect = async () => {
    if (!selectedModel) return;
    
    try {
      await connectToModel(selectedModel);
    } catch (error) {
      console.error('Failed to connect to model:', error);
    }
  };

  const handleRunInference = async () => {
    if (!selectedModel || !inputData.trim()) return;

    const sessionId = `session_${Date.now()}`;
    const newSession: InferenceSession = {
      id: sessionId,
      modelId: selectedModel,
      modelName: availableModels.find(m => m.id === selectedModel)?.name || 'Unknown',
      status: 'running',
      startTime: new Date(),
      inputData: inputData,
      metrics: {
        latency: 0,
        throughput: 0
      }
    };

    setSessions(prev => [newSession, ...prev]);

    try {
      const startTime = performance.now();
      const result = await runInference(selectedModel, {
        input: inputData,
        type: inputType,
        batchSize,
        maxTokens,
        temperature,
        topP
      });
      const endTime = performance.now();

      const updatedSession: InferenceSession = {
        ...newSession,
        status: 'completed',
        endTime: new Date(),
        outputData: result,
        metrics: {
          latency: endTime - startTime,
          throughput: result.tokensGenerated / ((endTime - startTime) / 1000),
          accuracy: result.accuracy,
          confidence: result.confidence
        }
      };

      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
    } catch (error) {
      console.error('Inference failed:', error);
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, status: 'error', endTime: new Date() }
          : s
      ));
    }
  };

  const handleStreamInference = async () => {
    if (!selectedModel || !inputData.trim()) return;

    setIsStreaming(true);
    setStreamOutput('');

    try {
      const stream = await streamInference(selectedModel, {
        input: inputData,
        type: inputType,
        maxTokens,
        temperature,
        topP
      });

      streamRef.current = stream;

      for await (const chunk of stream) {
        setStreamOutput(prev => prev + chunk.text);
        
        if (chunk.finished) {
          setIsStreaming(false);
          break;
        }
      }
    } catch (error) {
      console.error('Streaming failed:', error);
      setIsStreaming(false);
    }
  };

  const handleStopStream = () => {
    if (streamRef.current) {
      streamRef.current.cancel();
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const formatLatency = (latency: number) => {
    return latency < 1000 ? `${latency.toFixed(0)}ms` : `${(latency / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (status: InferenceSession['status']) => {
    switch (status) {
      case 'idle': return 'text-gray-600 bg-gray-100';
      case 'connecting': return 'text-blue-600 bg-blue-100';
      case 'running': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderInputSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Input Configuration</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select AI Model
        </label>
        <div className="flex gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a model...</option>
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.type}
              </option>
            ))}
          </select>
          <button
            onClick={handleModelConnect}
            disabled={!selectedModel || loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            {activeSession?.modelId === selectedModel ? 'Connected' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Input Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Input Type
        </label>
        <div className="flex gap-2">
          {['text', 'image', 'audio', 'json'].map(type => (
            <button
              key={type}
              onClick={() => setInputType(type as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Input Data */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Input Data
        </label>
        {inputType === 'text' ? (
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Enter your text input here..."
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Icon icon="mdi:cloud-upload" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Upload {inputType} file</p>
            <input
              type="file"
              accept={inputType === 'image' ? 'image/*' : inputType === 'audio' ? 'audio/*' : '*/*'}
              className="hidden"
              id="file-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setInputData(file.name);
                }
              }}
            />
            <label
              htmlFor="file-upload"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Choose File
            </label>
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border-t border-gray-200 pt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Size
                </label>
                <input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  min="1"
                  max="32"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  min="1"
                  max="2048"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top P: {topP}
                </label>
                <input
                  type="range"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleRunInference}
          disabled={!selectedModel || !inputData.trim() || loading}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
        >
          <Icon icon="mdi:play" className="w-5 h-5 inline mr-2" />
          Run Inference
        </button>
        <button
          onClick={isStreaming ? handleStopStream : handleStreamInference}
          disabled={!selectedModel || !inputData.trim() || loading}
          className={`flex-1 ${
            isStreaming 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          } disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors`}
        >
          <Icon icon={isStreaming ? "mdi:stop" : "mdi:stream"} className="w-5 h-5 inline mr-2" />
          {isStreaming ? 'Stop Stream' : 'Stream Inference'}
        </button>
      </div>
    </div>
  );

  const renderStreamOutput = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Stream Output</h3>
        {isStreaming && (
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Streaming...</span>
          </div>
        )}
      </div>
      
      <div
        ref={outputRef}
        className="bg-gray-900 text-green-400 p-4 rounded-xl h-64 overflow-y-auto font-mono text-sm"
      >
        {streamOutput || (
          <div className="text-gray-500 italic">
            Stream output will appear here...
          </div>
        )}
        {isStreaming && (
          <span className="animate-pulse">▊</span>
        )}
      </div>
    </div>
  );

  const renderSessionHistory = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Inference Sessions</h3>
      
      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Icon icon="mdi:history" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No inference sessions yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              className="border border-gray-200 rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:brain" className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{session.modelName}</p>
                    <p className="text-xs text-gray-600">
                      {session.startTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Latency</p>
                  <p className="font-medium">{formatLatency(session.metrics.latency)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Throughput</p>
                  <p className="font-medium">{session.metrics.throughput.toFixed(1)} tok/s</p>
                </div>
                <div>
                  <p className="text-gray-600">Confidence</p>
                  <p className="font-medium">
                    {session.metrics.confidence ? `${(session.metrics.confidence * 100).toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>
              
              {session.outputData && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Output:</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">
                    {typeof session.outputData === 'string' 
                      ? session.outputData.slice(0, 100) + (session.outputData.length > 100 ? '...' : '')
                      : JSON.stringify(session.outputData).slice(0, 100) + '...'
                    }
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <motion.div 
        className="bg-white max-w-6xl w-full mx-4 rounded-2xl max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Icon icon="mdi:lightning-bolt" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Real-Time AI Inference</h2>
              <p className="text-sm text-gray-600">Powered by 0G Network Compute</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <Icon icon="mdi:close" className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {renderInputSection()}
              {renderStreamOutput()}
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {renderSessionHistory()}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}