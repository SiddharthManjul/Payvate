'use client';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ACCESS_CONTROLLER_ABI, CONTRACT_ADDRESSES, ROLES } from '@/lib/contracts';

export type UserRole = 'admin' | 'finance' | 'hr' | 'employee' | 'unknown';

export function useRole() {
  const { address, isConnected } = useAccount();
  const [role, setRole] = useState<UserRole>('unknown');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || !CONTRACT_ADDRESSES.accessController) {
      setRole('unknown');
      return;
    }
    setLoading(true);
    const detect = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const contract = new ethers.Contract(
          CONTRACT_ADDRESSES.accessController,
          ACCESS_CONTROLLER_ABI,
          provider
        );
        const [isAdmin, isFinance, isHR] = await Promise.all([
          contract.hasRole(ROLES.ADMIN, address),
          contract.hasRole(ROLES.FINANCE, address),
          contract.hasRole(ROLES.HR, address),
        ]);
        if (isAdmin) setRole('admin');
        else if (isFinance) setRole('finance');
        else if (isHR) setRole('hr');
        else setRole('employee');
      } catch {
        setRole('employee');
      } finally {
        setLoading(false);
      }
    };
    detect();
  }, [address, isConnected]);

  const isEmployer = role === 'admin' || role === 'finance';
  const canRunPayroll = role === 'admin' || role === 'finance';
  const canManageEmployees = role === 'admin';

  return { role, loading, isEmployer, canRunPayroll, canManageEmployees };
}
