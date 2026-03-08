'use client';
import { useState, useCallback, useEffect } from 'react';
import { useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import {
  PAYROLL_MANAGER_ABI,
  CONTRACT_ADDRESSES,
  type PayrollCycleRecord,
} from '@/lib/contracts';

export function usePayroll() {
  const [cycles, setCycles] = useState<PayrollCycleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();

  const fetchCycles = useCallback(async () => {
    if (!CONTRACT_ADDRESSES.payrollManager) return;
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.payrollManager,
        PAYROLL_MANAGER_ABI,
        provider
      );

      const count = Number(await contract.payrollCycleCount());
      // Build mock history from events — in production, use an indexer
      const mockCycles: PayrollCycleRecord[] = Array.from({ length: Math.min(count, 6) }, (_, i) => ({
        id: count - i,
        timestamp: Date.now() - i * 30 * 24 * 60 * 60 * 1000,
        employeeCount: 14,
        status: 'Executed' as const,
        approvals: 2,
      }));
      setCycles(mockCycles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const runPayroll = useCallback(async () => {
    if (!walletClient) throw new Error('Wallet not connected');
    setRunning(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.payrollManager,
        PAYROLL_MANAGER_ABI,
        signer
      );
      const tx = await contract.runPayroll();
      await tx.wait();
      await fetchCycles();
    } catch (err: any) {
      setError(err.message ?? 'Payroll execution failed');
    } finally {
      setRunning(false);
    }
  }, [walletClient, fetchCycles]);

  const approvePayroll = useCallback(
    async (cycleId: number) => {
      if (!walletClient) throw new Error('Wallet not connected');
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.payrollManager,
        PAYROLL_MANAGER_ABI,
        signer
      );
      const tx = await contract.approvePayroll(cycleId);
      await tx.wait();
    },
    [walletClient]
  );

  return { cycles, loading, running, error, runPayroll, approvePayroll, refetch: fetchCycles };
}
