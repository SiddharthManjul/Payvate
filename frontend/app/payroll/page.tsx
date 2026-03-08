'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EncryptedValue } from '@/components/ui/EncryptedValue';
import { usePayroll } from '@/hooks/usePayroll';
import { useEmployees } from '@/hooks/useEmployees';
import { formatDate, nextPayrollDate } from '@/lib/utils';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

export default function PayrollPage() {
  const { cycles, loading, running, error, runPayroll, approvePayroll } = usePayroll();
  const { employees } = useEmployees();
  const [showConfirm, setShowConfirm] = useState(false);
  const activeEmployees = employees.filter((e) => e.isActive).length;

  const handleRunPayroll = async () => {
    await runPayroll();
    setShowConfirm(false);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content fade-in">
          <div className="page-header">
            <div>
              <h1 className="page-title">Payroll</h1>
              <p className="page-subtitle">Execute and track payroll cycles</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" onClick={() => approvePayroll(cycles.length + 1)}>
                ✅ Approve Cycle
              </Button>
              <Button onClick={() => setShowConfirm(true)}>
                💳 Run Payroll
              </Button>
            </div>
          </div>

          {/* Payroll Cycle Card */}
          <div className="grid-2" style={{ marginBottom: 28 }}>
            <div className="card card-gradient">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>📅 Current Cycle #{cycles.length + 1}</h2>
                <Badge variant="warning">Pending Execution</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'Frequency', value: 'Monthly' },
                  { label: 'Next Date', value: nextPayrollDate(0) },
                  { label: 'Employees', value: activeEmployees },
                  { label: 'Threshold', value: '2 of 3' },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Approvals */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Approvals (2/3)</div>
                {[
                  { label: 'CEO', done: true },
                  { label: 'Finance', done: true },
                  { label: 'HR', done: false },
                ].map((a) => (
                  <div key={a.label} className="approval-row">
                    <div className={`approval-check ${a.done ? 'done' : 'pending'}`}>{a.done ? '✓' : '⏳'}</div>
                    <span style={{ fontSize: 13 }}>{a.label}</span>
                    <Badge variant={a.done ? 'success' : 'warning'}>{a.done ? 'Approved' : 'Pending'}</Badge>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button onClick={() => setShowConfirm(true)} style={{ flex: 1 }}>
                  Run Payroll Now
                </Button>
                <Button variant="secondary" style={{ flex: 1 }}>
                  Schedule
                </Button>
              </div>
            </div>

            {/* Total Payroll */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Payroll Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Total Monthly Payroll', value: <EncryptedValue contractAddress={CONTRACT_ADDRESSES.payrollManager} /> },
                  { label: 'Average Salary', value: <EncryptedValue contractAddress={CONTRACT_ADDRESSES.payrollManager} /> },
                  { label: 'Active Employees', value: activeEmployees },
                  { label: 'Payment Token', value: 'CPT (Payroll Token)' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
              {error && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 6, fontSize: 13, color: 'var(--accent-danger)' }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📋 Payroll History</h2>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Cycle</th>
                    <th>Date</th>
                    <th>Employees</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}><span className="spinner" style={{ display: 'inline-block' }} /></td></tr>
                  ) : cycles.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No payroll cycles yet</td></tr>
                  ) : (
                    cycles.map((cycle) => (
                      <tr key={cycle.id}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 500 }}>#{cycle.id}</td>
                        <td>{formatDate(cycle.timestamp)}</td>
                        <td>{cycle.employeeCount}</td>
                        <td>
                          <Badge variant={cycle.status === 'Executed' ? 'success' : cycle.status === 'Approved' ? 'warning' : 'neutral'} dot>
                            {cycle.status}
                          </Badge>
                        </td>
                        <td><EncryptedValue contractAddress={CONTRACT_ADDRESSES.payrollManager} /></td>
                        <td>
                          <Button variant="ghost" size="sm">View →</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirm Modal */}
          <Modal
            isOpen={showConfirm}
            onClose={() => setShowConfirm(false)}
            title="⚠️ Confirm Payroll Execution"
            footer={
              <>
                <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button onClick={handleRunPayroll} loading={running} variant="success">
                  Execute Payroll
                </Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  You are about to pay <strong style={{ color: 'var(--text-primary)' }}>{activeEmployees} employees</strong>.<br />
                  Total payroll amount is encrypted and will never be revealed onchain.
                </p>
              </div>
              {[
                { label: 'Payment Token', value: 'CPT (Payroll Token)' },
                { label: 'Total Payroll', value: <EncryptedValue contractAddress={CONTRACT_ADDRESSES.payrollManager} /> },
                { label: 'Approvals Required', value: '2 of 3 ✅' },
                { label: 'Current Approvals', value: '2/3 ✅' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
}
