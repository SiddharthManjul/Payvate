'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useRole } from '@/hooks/useRole';
import { shortAddress } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/employees', icon: '👥', label: 'Employees' },
  { href: '/payroll', icon: '💰', label: 'Payroll' },
  { href: '/reports', icon: '📈', label: 'Analytics' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
];

const EMPLOYEE_ITEMS = [
  { href: '/employee-portal', icon: '🏠', label: 'My Portal' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { role } = useRole();

  const isEmployer = role === 'admin' || role === 'finance' || role === 'hr';
  const navItems = isEmployer ? NAV_ITEMS : EMPLOYEE_ITEMS;

  const roleLabel: Record<string, string> = {
    admin: '🛡️ Admin',
    finance: '💼 Finance',
    hr: '👤 HR',
    employee: '👷 Employee',
    unknown: '🔗 Connect Wallet',
  };

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🔐</div>
        <span className="sidebar-logo-text">CipherPay</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {(isEmployer ? NAV_ITEMS : []).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* Always show Employee Portal */}
        <Link
          href="/employee-portal"
          className={`sidebar-nav-item ${pathname === '/employee-portal' ? 'active' : ''}`}
        >
          <span className="sidebar-nav-icon">🏠</span>
          My Portal
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          {isConnected ? (
            <>
              <div style={{ marginBottom: 4 }}>
                <span
                  className="sidebar-footer-badge"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    color: 'var(--accent-primary-hover)',
                    border: '1px solid var(--border-accent)',
                  }}
                >
                  {roleLabel[role]}
                </span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                {shortAddress(address ?? '')}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not connected</span>
          )}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent-success)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sepolia</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
