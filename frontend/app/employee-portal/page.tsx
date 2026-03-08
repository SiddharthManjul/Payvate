'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EncryptedValue } from '@/components/ui/EncryptedValue';
import { useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { shortAddress, formatDate, nextPayrollDate } from '@/lib/utils';

const MOCK_PAYSLIPS = [
  { month: 'Feb 2026', txHash: '0xabc...def', timestamp: Date.now() - 28 * 24 * 3600_000 },
  { month: 'Jan 2026', txHash: '0x123...456', timestamp: Date.now() - 59 * 24 * 3600_000 },
  { month: 'Dec 2025', txHash: '0x789...xyz', timestamp: Date.now() - 90 * 24 * 3600_000 },
];

export default function EmployeePortalPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="app-main">
          <Header />
          <main className="app-content fade-in">
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, marginBottom: 8 }}>Connect Your Wallet</h2>
              <p style={{ color: 'var(--text-muted)' }}>Connect your wallet to view your salary and payslips</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content fade-in">
          {/* Welcome Banner */}
          <div className="card card-gradient" style={{ marginBottom: 24     }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                  👋 Welcome back
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  {shortAddress(address ?? '')} · Member since Jan 2026
                </p>
              </div>
              <Badge variant="primary" dot>Senior Engineer</Badge>
            </div>
          </div>

          {/* Salary Cards */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            {/* Monthly Salary */}
            <div className="stat-card">
              <div className="stat-label">Monthly Salary</div>
              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <EncryptedValue
                  handle={undefined}
                  contractAddress={CONTRACT_ADDRESSES.employeeRegistry}
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                🔒 Encrypted with Zama FHE · Click to decrypt with your wallet
              </div>
              <Button size="sm" variant="secondary">
                🔓 Decrypt My Salary
              </Button>
            </div>

            {/* Last Payment */}
            <div className="stat-card">
              <div className="stat-label">Last Payment</div>
              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <EncryptedValue
                  handle={undefined}
                  contractAddress={CONTRACT_ADDRESSES.payrollManager}
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Paid on {formatDate(MOCK_PAYSLIPS[0].timestamp)} · Monthly
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                Tx: {MOCK_PAYSLIPS[0].txHash}
              </div>
            </div>
          </div>

          {/* Info Row */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { label: 'Company', value: 'Nebula Labs' },
                { label: 'Next Payment', value: nextPayrollDate(0) },
                { label: 'Payment Token', value: 'CPT' },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payslip History */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📄 Payslip History</h2>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Transaction</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PAYSLIPS.map((slip) => (
                    <tr key={slip.month}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{slip.month}</td>
                      <td>
                        <EncryptedValue
                          contractAddress={CONTRACT_ADDRESSES.payrollManager}
                        />
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{slip.txHash}</td>
                      <td>{formatDate(slip.timestamp)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button variant="ghost" size="sm">View</Button>
                          <Button variant="secondary" size="sm">🔓 Decrypt</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, padding: '12px', background: 'rgba(99,102,241,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              🔒 All salary amounts are encrypted using Zama FHE. Decryption happens entirely in your browser — your plaintext salary is never sent to any server.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
