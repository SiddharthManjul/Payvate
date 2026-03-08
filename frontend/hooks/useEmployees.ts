'use client';
import { useState, useEffect, useCallback } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { ethers } from 'ethers';
import { EMPLOYEE_REGISTRY_ABI, CONTRACT_ADDRESSES, type EmployeeRecord } from '@/lib/contracts';

export function useEmployees() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const fetchEmployees = useCallback(async () => {
    if (!publicClient || !CONTRACT_ADDRESSES.employeeRegistry) return;
    setLoading(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.employeeRegistry,
        EMPLOYEE_REGISTRY_ABI,
        provider
      );

      const addresses: string[] = await contract.getAllEmployees();
      const records: EmployeeRecord[] = await Promise.all(
        addresses.map(async (wallet) => {
          const info = await contract.getEmployeeInfo(wallet);
          return {
            wallet,
            name: info.name,
            role: info.role,
            isActive: info.isActive,
            addedAt: Number(info.addedAt),
          };
        })
      );
      setEmployees(records);
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const addEmployee = useCallback(
    async (params: {
      wallet: string;
      name: string;
      role: string;
      encryptedSalary: Uint8Array;
      inputProof: Uint8Array;
      paymentToken: string;
      frequency: number;
    }) => {
      if (!walletClient) throw new Error('Wallet not connected');
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.employeeRegistry,
        EMPLOYEE_REGISTRY_ABI,
        signer
      );
      const tx = await contract.addEmployee(
        params.wallet,
        params.name,
        params.role,
        params.encryptedSalary,
        params.inputProof,
        params.paymentToken,
        params.frequency
      );
      await tx.wait();
      await fetchEmployees();
    },
    [walletClient, fetchEmployees]
  );

  const removeEmployee = useCallback(
    async (wallet: string) => {
      if (!walletClient) throw new Error('Wallet not connected');
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.employeeRegistry,
        EMPLOYEE_REGISTRY_ABI,
        signer
      );
      const tx = await contract.removeEmployee(wallet);
      await tx.wait();
      await fetchEmployees();
    },
    [walletClient, fetchEmployees]
  );

  return { employees, loading, error, refetch: fetchEmployees, addEmployee, removeEmployee };
}
