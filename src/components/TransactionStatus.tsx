'use client';

import React from 'react';

interface TransactionStatusProps {
  status: 'pending' | 'success' | 'error' | 'idle';
  txHash?: string;
  message?: string;
  onClose?: () => void;
}

export function TransactionStatus({ status, txHash, message, onClose }: TransactionStatusProps) {
  if (status === 'idle') return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="loading-spinner w-6 h-6"></div>
        );
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'pending':
        return 'Transaction Pending';
      case 'success':
        return 'Transaction Successful';
      case 'error':
        return 'Transaction Failed';
      default:
        return 'Transaction Status';
    }
  };

  const getDefaultMessage = () => {
    switch (status) {
      case 'pending':
        return 'Your transaction is being processed on the blockchain. Please wait...';
      case 'success':
        return 'Your transaction has been confirmed on the blockchain.';
      case 'error':
        return 'Your transaction failed. Please try again.';
      default:
        return '';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className={`border rounded-lg p-4 shadow-lg ${getStatusColor()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">
              {getStatusTitle()}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {message || getDefaultMessage()}
            </p>
            
            {txHash && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                <div className="flex items-center space-x-2">
                  <code className="text-xs font-mono bg-white px-2 py-1 rounded border break-all">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(txHash);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    title="Copy full hash"
                  >
                    Copy
                  </button>
                  <a
                    href={`https://explorer.0g.ai/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View
                  </a>
                </div>
              </div>
            )}
          </div>
          
          {onClose && (status === 'success' || status === 'error') && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for managing transaction status
export function useTransactionStatus() {
  const [status, setStatus] = React.useState<'pending' | 'success' | 'error' | 'idle'>('idle');
  const [txHash, setTxHash] = React.useState<string | undefined>();
  const [message, setMessage] = React.useState<string | undefined>();

  const showPending = (hash?: string, msg?: string) => {
    setStatus('pending');
    setTxHash(hash);
    setMessage(msg);
  };

  const showSuccess = (hash?: string, msg?: string) => {
    setStatus('success');
    setTxHash(hash);
    setMessage(msg);
  };

  const showError = (msg?: string) => {
    setStatus('error');
    setTxHash(undefined);
    setMessage(msg);
  };

  const reset = () => {
    setStatus('idle');
    setTxHash(undefined);
    setMessage(undefined);
  };

  return {
    status,
    txHash,
    message,
    showPending,
    showSuccess,
    showError,
    reset,
  };
}