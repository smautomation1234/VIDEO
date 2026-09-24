'use client';

// Small badge showing the current user's subscription plan.

import { useSubscription } from '@/lib/hooks/useSubscription';
import type { PlanId } from '@/lib/plans';
import Link from 'next/link';

const PLAN_STYLES: Record<PlanId, { bg: string; color: string; border: string }> = {
  free: {
    bg: 'var(--muted)',
    color: 'var(--muted-foreground)',
    border: 'var(--border)',
  },
  starter: {
    bg: 'var(--sky-bg)',
    color: 'var(--sky-ink)',
    border: 'var(--sky)',
  },
  pro: {
    bg: 'var(--lavender-bg)',
    color: 'var(--lavender-ink)',
    border: 'var(--lavender)',
  },
  agency: {
    bg: 'var(--butter-bg)',
    color: 'var(--butter-ink)',
    border: 'var(--amber)',
  },
};

interface PlanBadgeProps {
  size?: 'sm' | 'md';
  showUpgrade?: boolean;
}

export default function PlanBadge({ size = 'sm', showUpgrade = true }: PlanBadgeProps) {
  const { plan, planName, loading } = useSubscription();

  if (loading) {
    return (
      <div style={{
        width: 56, height: size === 'sm' ? 20 : 24,
        borderRadius: 999, background: 'var(--muted)',
        animation: 'pulseSoft 1.5s ease-in-out infinite',
      }} />
    );
  }

  const styles = PLAN_STYLES[plan] ?? PLAN_STYLES.free;
  const fontSize = size === 'sm' ? '0.6875rem' : '0.75rem';
  const padding = size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.625rem';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span className="badge" style={{
        padding,
        fontSize,
        background: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
      }}>
        {planName}
      </span>

      {plan === 'free' && showUpgrade && (
        <Link
          href="/upgrade"
          className="badge"
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--foreground)',
            background: 'var(--primary-muted)',
            textDecoration: 'none',
            padding: '0.15rem 0.5rem',
          }}
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}
