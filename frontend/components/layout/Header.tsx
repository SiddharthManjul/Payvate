'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/payroll': 'Payroll',
  '/reports': 'Analytics',
  '/settings': 'Settings',
  '/employee-portal': 'My Portal',
};

export function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'CipherPay';

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-success)', display: 'inline-block' }} />
          Sepolia
        </div>
        <ConnectButton
          showBalance={false}
          chainStatus="none"
          accountStatus="avatar"
        />
      </div>
    </header>
  );
}
