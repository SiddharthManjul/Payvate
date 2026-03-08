'use client';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'primary' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = 'neutral', children, dot, className }: BadgeProps) {
  const dotColors: Record<BadgeVariant, string> = {
    success: 'var(--accent-success)',
    warning: 'var(--accent-warning)',
    danger: 'var(--accent-danger)',
    primary: 'var(--accent-primary-hover)',
    neutral: 'var(--text-muted)',
  };

  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dotColors[variant],
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
}
