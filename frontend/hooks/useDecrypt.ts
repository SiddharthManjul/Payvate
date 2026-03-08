'use client';
import { useState, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { decryptValue } from '@/lib/fhevm';

interface UseDecryptResult {
  decrypt: (handle: string, contractAddress: string) => Promise<bigint | null>;
  decryptedValues: Record<string, bigint>;
  loading: Record<string, boolean>;
  error: string | null;
}

export function useDecrypt(): UseDecryptResult {
  const [decryptedValues, setDecryptedValues] = useState<Record<string, bigint>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();

  const decrypt = useCallback(
    async (handle: string, contractAddress: string): Promise<bigint | null> => {
      if (!walletClient) {
        setError('Wallet not connected');
        return null;
      }
      setLoading((prev) => ({ ...prev, [handle]: true }));
      setError(null);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();
        const value = await decryptValue(handle, contractAddress, signer);
        setDecryptedValues((prev) => ({ ...prev, [handle]: value }));

        // Auto-hide after 30 seconds
        setTimeout(() => {
          setDecryptedValues((prev) => {
            const next = { ...prev };
            delete next[handle];
            return next;
          });
        }, 30_000);

        return value;
      } catch (err: any) {
        setError(err.message ?? 'Decryption failed');
        return null;
      } finally {
        setLoading((prev) => ({ ...prev, [handle]: false }));
      }
    },
    [walletClient]
  );

  return { decrypt, decryptedValues, loading, error };
}
