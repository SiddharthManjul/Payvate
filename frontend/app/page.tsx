'use client';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import '@rainbow-me/rainbowkit/styles.css';

const FEATURES = [
  {
    icon: '🔐',
    title: 'FHE-Encrypted Salaries',
    desc: 'Salary data is encrypted on-chain using Zama\'s Fully Homomorphic Encryption. Only you can see your own salary.',
  },
  {
    icon: '🏦',
    title: 'Onchain Payroll Engine',
    desc: 'Run payroll fully on-chain. No intermediaries. No data breaches. Multi-sig approval before every cycle.',
  },
  {
    icon: '📊',
    title: 'Confidential Analytics',
    desc: 'Compute aggregate totals and averages across encrypted salaries — without decrypting a single value.',
  },
];

const COMPARE = [
  { feature: 'Salary privacy', trad: '❌', cipher: '✅ FHE-encrypted' },
  { feature: 'Onchain proof', trad: '❌', cipher: '✅ Immutable ledger' },
  { feature: 'DAO support', trad: '❌', cipher: '✅ Multi-sig ready' },
  { feature: 'Aggregate analytics', trad: '✅', cipher: '✅ Without decrypting' },
];

export default function LandingPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.push('/dashboard');
  }, [isConnected, router]);

  return (
    <main className="landing-hero">
      {/* Top nav */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px',
        background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, fontSize: 14,
            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🔐</div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 18, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CipherPay
          </span>
        </div>
        <ConnectButton showBalance={false} chainStatus="none" />
      </div>

      {/* Hero */}
      <div className="fade-in" style={{ zIndex: 1, maxWidth: 800, width: '100%', paddingTop: 80 }}>
        <div className="landing-badge">
          ⚡ Powered by Zama FHE — Ethereum Sepolia
        </div>

        <h1 className="landing-title">
          Confidential Payroll<br />
          <span className="highlight">for Web3 Companies</span>
        </h1>

        <p className="landing-subtitle">
          Rippling / Deel — but confidential and onchain. Manage employee salaries with full privacy using Fully Homomorphic Encryption. No data breaches, no salary leaks.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <ConnectButton.Custom>
            {({ openConnectModal, connectModalOpen }) => (
              <button
                className="btn btn-primary btn-lg"
                onClick={openConnectModal}
                style={{ minWidth: 200 }}
              >
                🔗 Connect Wallet to Start
              </button>
            )}
          </ConnectButton.Custom>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-lg"
          >
            📄 View Contracts
          </a>
        </div>

        {/* Feature Cards */}
        <div className="landing-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card slide-up">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div style={{ marginTop: 60, width: '100%', maxWidth: 600 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, textAlign: 'center', marginBottom: 20 }}>
            Why CipherPay?
          </h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Traditional Payroll</th>
                  <th>CipherPay</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.feature}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ color: 'var(--accent-danger)' }}>{row.trad}</td>
                    <td style={{ color: 'var(--accent-success)' }}>{row.cipher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
          Built on Ethereum Sepolia · Zama FHEVM · ERC-7984 Confidential Tokens
        </div>
      </div>
    </main>
  );
}
