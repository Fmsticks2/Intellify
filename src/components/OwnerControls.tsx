'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from './WalletProvider';
import { useIntellifyContract } from '../hooks/useIntellifyContract';
import { parseContractError } from '../utils';

export default function OwnerControls() {
  const { wallet } = useWallet();
  const {
    contractOwner,
    isPaused,
    isPublicMintEnabled,
    getOwner,
    getPaused,
    getPublicMintEnabled,
    setPublicMint,
    unpauseContract,
    pauseContract,
  } = useIntellifyContract();

  const [ownerAddr, setOwnerAddr] = useState<string | null>(contractOwner);
  const [paused, setPaused] = useState<boolean>(isPaused);
  const [mintEnabled, setMintEnabled] = useState<boolean>(isPublicMintEnabled);
  const [busy, setBusy] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // Refresh state when mounted
    (async () => {
      try {
        const [o, p, m] = await Promise.all([
          getOwner(),
          getPaused(),
          getPublicMintEnabled(),
        ]);
        setOwnerAddr(o);
        setPaused(Boolean(p));
        setMintEnabled(Boolean(m));
      } catch {}
    })();
  }, []);

  const isOwner = wallet.address && ownerAddr && wallet.address.toLowerCase() === ownerAddr.toLowerCase();
  if (!isOwner) return null;

  const enablePublicMint = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (paused) {
        await unpauseContract();
        setPaused(false);
      }
      await setPublicMint(true);
      setMintEnabled(true);
      setMsg('Public minting enabled. Users can mint now.');
    } catch (err: any) {
      setMsg(parseContractError(err));
    } finally {
      setBusy(false);
    }
  };

  const disablePublicMint = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await setPublicMint(false);
      setMintEnabled(false);
      setMsg('Public minting disabled.');
    } catch (err: any) {
      setMsg(parseContractError(err));
    } finally {
      setBusy(false);
    }
  };

  const togglePause = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (paused) {
        await unpauseContract();
        setPaused(false);
        setMsg('Contract unpaused.');
      } else {
        await pauseContract();
        setPaused(true);
        setMsg('Contract paused.');
      }
    } catch (err: any) {
      setMsg(parseContractError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-amber-900">Owner Controls</h2>
          <p className="text-sm text-amber-800">Manage public mint and pause state</p>
        </div>
        <span className="text-xs text-amber-700">Owner: {ownerAddr}</span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-md border border-amber-200 bg-white p-3">
          <p className="text-sm text-gray-800">Public Minting</p>
          <p className="text-xs text-gray-500">{mintEnabled ? 'Enabled' : 'Disabled'}</p>
          <div className="mt-2 flex gap-2">
            <button
              disabled={busy || mintEnabled}
              onClick={enablePublicMint}
              className="px-3 py-2 rounded-md bg-green-600 text-white disabled:bg-gray-400"
            >Enable</button>
            <button
              disabled={busy || !mintEnabled}
              onClick={disablePublicMint}
              className="px-3 py-2 rounded-md bg-gray-700 text-white disabled:bg-gray-400"
            >Disable</button>
          </div>
        </div>

        <div className="rounded-md border border-amber-200 bg-white p-3">
          <p className="text-sm text-gray-800">Pause State</p>
          <p className="text-xs text-gray-500">{paused ? 'Paused' : 'Active'}</p>
          <div className="mt-2">
            <button
              disabled={busy}
              onClick={togglePause}
              className="px-3 py-2 rounded-md bg-amber-600 text-white disabled:bg-gray-400"
            >{paused ? 'Unpause' : 'Pause'}</button>
          </div>
        </div>

        <div className="rounded-md border border-amber-200 bg-white p-3">
          <p className="text-sm text-gray-800">Quick Action</p>
          <p className="text-xs text-gray-500">Unpause and enable mint</p>
          <div className="mt-2">
            <button
              disabled={busy}
              onClick={enablePublicMint}
              className="px-3 py-2 rounded-md bg-blue-600 text-white disabled:bg-gray-400"
            >Enable Mint Now</button>
          </div>
        </div>
      </div>

      {msg && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-100 p-2 text-sm text-amber-900">
          {msg}
        </div>
      )}
    </div>
  );
}