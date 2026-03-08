'use client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EncryptedValue } from '@/components/ui/EncryptedValue';
import { useEmployees } from '@/hooks/useEmployees';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

const DEPT_DATA = [
  { dept: 'Engineering', headcount: 6, color: 'var(--accent-primary)' },
  { dept: 'Design', headcount: 3, color: 'var(--accent-secondary)' },
  { dept: 'Operations', headcount: 3, color: 'var(--accent-success)' },
  { dept: 'Finance', headcount: 2, color: 'var(--accent-warning)' },
];

export default function ReportsPage() {
  const { employees } = useEmployees();
  const activeCount = employees.filter((e) => e.isActive).length;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content fade-in">
          <div className="page-header">
            <div>
              <h1 className="page-title">Analytics</h1>
              <p className="page-subtitle">
                Confidential aggregate analytics — computed via FHE without decrypting individual salaries
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ghost">📄 Export CSV</Button>
              <Button variant="secondary">📑 Export PDF</Button>
            </div>
          </div>

          {/* Aggregate Stats */}
          <div className="grid-3" style={{ marginBottom: 28 }}>
            {[
              { label: 'Total Monthly Payroll', icon: '💰', bg: 'rgba(99,102,241,0.15)' },
              { label: 'Average Salary', icon: '📊', bg: 'rgba(16,185,129,0.15)' },
              { label: 'Highest Salary', icon: '🏆', bg: 'rgba(245,158,11,0.15)' },
            ].map((stat) => (
              <div key={stat.label} className="stat-card" style={{ position: 'relative' }}>
                <div className="stat-icon" style={{ background: stat.bg }}>{stat.icon}</div>
                <div className="stat-label">{stat.label}</div>
                <div style={{ marginTop: 10 }}>
                  <EncryptedValue contractAddress={CONTRACT_ADDRESSES.payrollManager} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  🧮 Computed via FHE.add — never decrypted onchain
                </div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            {/* Department Breakdown */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Department Breakdown</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {DEPT_DATA.map((dept) => {
                  const pct = Math.round((dept.headcount / Math.max(activeCount, 1)) * 100);
                  return (
                    <div key={dept.dept}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{dept.dept}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <EncryptedValue contractAddress={CONTRACT_ADDRESSES.payrollManager} />
                          <span style={{ fontSize: 12, color: 'var(--text-muted)'}}>{dept.headcount} people</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3 }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: dept.color,
                          borderRadius: 3,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payroll Trends (mock chart) */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Payroll Trend</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Monthly payroll — all amounts encrypted</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                {[70, 75, 72, 80, 85, 88, 90].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${h}%`,
                        background: i === 6 ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s',
                        border: i === 6 ? '1px solid var(--border-accent)' : 'none',
                      }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'][i]}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(99,102,241,0.06)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                📊 Chart shows relative growth; exact values remain encrypted
              </div>
            </div>
          </div>

          {/* FHE Info */}
          <div className="card" style={{ marginTop: 24, background: 'rgba(99,102,241,0.04)', borderColor: 'var(--border-accent)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 28 }}>🔬</span>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>How FHE Analytics Work</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Aggregate computations (sum, average) are executed <em>directly on encrypted data</em> using{' '}
                  <code style={{ background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 4 }}>FHE.add()</code> — 
                  the Zama coprocessor processes ciphertexts without ever seeing plaintext values.
                  Even the total payroll result is returned as an encrypted <code style={{ background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 4 }}>euint64</code> handle.
                  Only authorized parties can decrypt it client-side using <code style={{ background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 4 }}>userDecrypt()</code>.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
