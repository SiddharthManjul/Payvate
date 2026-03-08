'use client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/Card';
import { EncryptedValue } from '@/components/ui/EncryptedValue';
import { Badge } from '@/components/ui/Badge';
import { useEmployees } from '@/hooks/useEmployees';
import { relativeTime, nextPayrollDate } from '@/lib/utils';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

const RECENT_ACTIVITY = [
  { icon: '✅', text: 'Payroll executed — 14 employees', time: Date.now() - 2 * 60 * 1000, color: 'var(--accent-success)' },
  { icon: '👤', text: 'New employee added: Alice (Engineer)', time: Date.now() - 60 * 60 * 1000, color: 'var(--accent-primary-hover)' },
  { icon: '💰', text: 'Salary updated for Bob', time: Date.now() - 3 * 60 * 60 * 1000, color: 'var(--accent-warning)' },
  { icon: '🔄', text: 'Payroll cycle scheduled for next month', time: Date.now() - 24 * 60 * 60 * 1000, color: 'var(--text-muted)' },
  { icon: '🛡️', text: 'HR role granted to carol.eth', time: Date.now() - 2 * 24 * 60 * 60 * 1000, color: 'var(--accent-secondary)' },
];

const QUICK_ACTIONS = [
  { icon: '➕', label: 'Add Employee', href: '/employees', color: 'var(--accent-primary)' },
  { icon: '💳', label: 'Run Payroll', href: '/payroll', color: 'var(--accent-success)' },
  { icon: '📊', label: 'View Reports', href: '/reports', color: 'var(--accent-secondary)' },
  { icon: '⚙️', label: 'Settings', href: '/settings', color: 'var(--accent-warning)' },
];

export default function DashboardPage() {
  const { employees, loading } = useEmployees();
  const activeCount = employees.filter((e) => e.isActive).length;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content fade-in">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Confidential payroll overview for your organization</p>
            </div>
            <Badge variant="success" dot>Live · Sepolia</Badge>
          </div>

          {/* Stat Cards */}
          <div className="grid-4" style={{ marginBottom: 28 }}>
            <StatCard
              label="Total Employees"
              value={loading ? '...' : activeCount}
              icon="👥"
              iconBg="rgba(99,102,241,0.15)"
              change={`${employees.length} total`}
              changePositive
            />
            <StatCard
              label="Monthly Payroll"
              value={
                <EncryptedValue
                  handle={undefined}
                  contractAddress={CONTRACT_ADDRESSES.payrollManager}
                />
              }
              icon="💰"
              iconBg="rgba(16,185,129,0.15)"
            />
            <StatCard
              label="Next Payroll Date"
              value={nextPayrollDate(0)}
              icon="📅"
              iconBg="rgba(245,158,11,0.15)"
            />
            <StatCard
              label="Payroll Cycles"
              value="7"
              icon="🔄"
              iconBg="rgba(139,92,246,0.15)"
              change="All executed"
              changePositive
            />
          </div>

          {/* Lower section */}
          <div className="grid-2">
            {/* Recent Activity */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Activity</h2>
              <div>
                {RECENT_ACTIVITY.map((item, i) => (
                  <div key={i} className="activity-item">
                    <div
                      className="activity-dot"
                      style={{ background: item.color }}
                    />
                    <div>
                      <div className="activity-text">
                        {item.icon} {item.text}
                      </div>
                      <div className="activity-time">{relativeTime(item.time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {QUICK_ACTIONS.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '20px 16px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 12,
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{action.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {action.label}
                    </span>
                  </a>
                ))}
              </div>

              {/* Approval status */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>
                  Payroll Approval Status
                </div>
                {[
                  { label: 'CEO Wallet', done: true },
                  { label: 'Finance Wallet', done: true },
                  { label: 'HR Wallet', done: false },
                ].map((approver) => (
                  <div key={approver.label} className="approval-row">
                    <div className={`approval-check ${approver.done ? 'done' : 'pending'}`}>
                      {approver.done ? '✓' : '⏳'}
                    </div>
                    <span style={{ fontSize: 13, color: approver.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {approver.label}
                    </span>
                    <Badge variant={approver.done ? 'success' : 'warning'} className="ml-auto">
                      {approver.done ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
