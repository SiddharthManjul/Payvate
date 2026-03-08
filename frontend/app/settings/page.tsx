'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAccount } from 'wagmi';
import { shortAddress } from '@/lib/utils';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

const APPROVERS_INIT = [
  { label: 'CEO Wallet', address: '0x1111...2222', isApprover: true },
  { label: 'Finance Wallet', address: '0x3333...4444', isApprover: true },
  { label: 'HR Wallet', address: '0x5555...6666', isApprover: false },
];

export default function SettingsPage() {
  const { address } = useAccount();
  const [threshold, setThreshold] = useState(2);
  const [approvers] = useState(APPROVERS_INIT);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content fade-in">
          <div className="page-header">
            <div>
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">Company configuration, roles, and multi-sig settings</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Contract Addresses */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📋 Contract Addresses</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Payroll Token (ERC7984)', addr: CONTRACT_ADDRESSES.payrollToken },
                  { label: 'Employee Registry', addr: CONTRACT_ADDRESSES.employeeRegistry },
                  { label: 'Payroll Manager', addr: CONTRACT_ADDRESSES.payrollManager },
                  { label: 'Access Controller', addr: CONTRACT_ADDRESSES.accessController },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                      {item.addr ? shortAddress(item.addr) : '⚠️ Not configured'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-sig */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>🛡️ Multi-Sig Approval</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Payroll execution requires N of M approvals from designated approvers
              </p>

              <div className="form-group" style={{ marginBottom: 16, maxWidth: 280 }}>
                <label className="form-label">Approval Threshold</label>
                <select
                  className="form-select"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                >
                  <option value={1}>1 of 3</option>
                  <option value={2}>2 of 3</option>
                  <option value={3}>3 of 3</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {approvers.map((a) => (
                  <div key={a.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.label}</div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{a.address}</div>
                    </div>
                    <Badge variant={a.isApprover ? 'success' : 'neutral'} dot>
                      {a.isApprover ? 'Approver' : 'Non-approver'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Zama FHE Network Config */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🔐 Zama FHE Configuration</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'ACL Contract', value: '0xf0Ffdc93...33D', status: 'Connected' },
                  { label: 'KMS Verifier', value: '0xbE0E383...11A', status: 'Connected' },
                  { label: 'Input Verifier', value: '0xBBC1fFCd...A0', status: 'Connected' },
                  { label: 'Relayer URL', value: 'relayer.testnet.zama.org', status: 'Active' },
                  { label: 'Gateway Chain ID', value: '10901', status: null },
                  { label: 'Host Chain', value: 'Ethereum Sepolia (11155111)', status: null },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{item.value}</span>
                      {item.status && <Badge variant="success" dot>{item.status}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connected Wallet */}
            <div className="card" style={{ borderColor: 'var(--border-accent)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>👛 Connected Wallet</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontFamily: 'monospace', color: 'var(--text-primary)', marginBottom: 4 }}>
                    {address ?? 'Not connected'}
                  </div>
                  <Badge variant="success" dot>Admin</Badge>
                </div>
                <Button variant="ghost" size="sm">Disconnect</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
