import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'CipherPay — Confidential Payroll Infrastructure',
  description:
    'Rippling / Deel — but confidential and onchain. The default payroll system for crypto-native companies, powered by Zama FHE.',
  keywords: ['payroll', 'FHE', 'zama', 'blockchain', 'confidential', 'crypto'],
  openGraph: {
    title: 'CipherPay',
    description: 'Confidential onchain payroll powered by Zama FHE',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
