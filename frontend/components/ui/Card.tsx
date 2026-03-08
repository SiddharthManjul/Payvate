'use client';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, gradient, hoverable, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        gradient && 'card-gradient',
        !hoverable && 'no-hover',
        className
      )}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: string;
  iconBg?: string;
  change?: string;
  changePositive?: boolean;
}

export function StatCard({ label, value, icon, iconBg, change, changePositive }: StatCardProps) {
  return (
    <div className="stat-card">
      {icon && (
        <div className="stat-icon" style={{ background: iconBg ?? 'rgba(99,102,241,0.15)' }}>
          {icon}
        </div>
      )}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change && (
        <div style={{ fontSize: 12, marginTop: 4, color: changePositive ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
          {changePositive ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
}
