'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { PLANS, type PlanId } from '@/lib/plans';
import {
  Check, X, Zap, Crown, Building2, Rocket,
  ArrowLeft, Sparkles, Shield, RefreshCw, CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Declare Razorpay global (loaded via CDN script)
declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
  free: <Zap size={20} />,
  starter: <Rocket size={20} />,
  pro: <Crown size={20} />,
  agency: <Building2 size={20} />,
};

const PLAN_GRADIENT: Record<PlanId, string> = {
  free: 'linear-gradient(135deg, #9A8F87 0%, #C0B8B0 100%)',
  starter: 'linear-gradient(135deg, #3B6CC7 0%, #5B8DEF 100%)',
  pro: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
  agency: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
};

const FEATURES: { label: string; plans: Record<PlanId, string | boolean> }[] = [
  { label: 'Posts per month', plans: { free: '5', starter: '50', pro: 'Unlimited', agency: 'Unlimited' } },
  { label: 'AI generations', plans: { free: '10', starter: '100', pro: 'Unlimited', agency: 'Unlimited' } },
  { label: 'Carousel builder', plans: { free: '2/mo', starter: '20/mo', pro: 'Unlimited', agency: 'Unlimited' } },
  { label: 'Video generation', plans: { free: false, starter: '5/mo', pro: '30/mo', agency: 'Unlimited' } },
  { label: 'Personal Brand scheduling', plans: { free: false, starter: true, pro: true, agency: true } },
  { label: 'Auto-DM', plans: { free: false, starter: true, pro: true, agency: true } },
  { label: 'Analytics & insights', plans: { free: false, starter: true, pro: true, agency: true } },
  { label: 'Lead pipeline', plans: { free: false, starter: true, pro: true, agency: true } },
  { label: 'Campaign manager', plans: { free: false, starter: false, pro: true, agency: true } },
  { label: 'AI Agents', plans: { free: false, starter: false, pro: true, agency: true } },
  { label: 'Priority support', plans: { free: false, starter: false, pro: true, agency: true } },
  { label: 'Team seats', plans: { free: '1', starter: '1', pro: '1', agency: '5' } },
  { label: 'White-label', plans: { free: false, starter: false, pro: false, agency: true } },
];

// Load Razorpay checkout script dynamically
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function UpgradeContent() {
  const { plan: currentPlan, isPaid, status, currentPeriodEnd, cancelAtPeriodEnd, refresh } = useSubscription();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const searchParams = useSearchParams();

  // Show success toast after redirect
  useEffect(() => {
    if (searchParams?.get('upgrade') === 'success') {
      setToast({ msg: '🎉 Payment successful! Your plan has been upgraded.', type: 'success' });
      refresh();
      setTimeout(() => setToast(null), 5000);
    }
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleUpgrade = async (planId: PlanId) => {
    if (planId === 'free' || planId === currentPlan) return;

    const plan = PLANS[planId];
    const razorpayPlanId = billing === 'monthly'
      ? plan.razorpayPlanIdMonthly
      : plan.razorpayPlanIdAnnual;

    if (!razorpayPlanId || razorpayPlanId.startsWith('plan_')) {
      showToast('Razorpay plans not configured yet. Add your RAZORPAY_PLAN_* IDs to .env.local', 'error');
      return;
    }

    setLoading(planId);
    try {
      // 1. Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load Razorpay checkout. Check your internet connection.');

      // 2. Create subscription on server
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: razorpayPlanId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to create subscription');

      const { subscription_id, razorpay_key, user_name, user_email } = data;

      // 3. Open Razorpay checkout modal
      const options = {
        key: razorpay_key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id,
        name: 'The Personal Brand',
        description: `${plan.name} Plan — ${billing === 'monthly' ? 'Monthly' : 'Annual'}`,
        image: 'https://i.imgur.com/n5tjHFD.png', // replace with your logo URL
        prefill: {
          name: user_name,
          email: user_email,
        },
        theme: { color: '#2D2D2D' },
        modal: {
          ondismiss: () => {
            setLoading(null);
            showToast('Payment cancelled. No charges made.', 'error');
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 4. Verify payment on server
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: razorpayPlanId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || verifyData.error) throw new Error(verifyData.error || 'Payment verification failed');

            showToast(`🎉 You're now on the ${plan.name} plan! Refreshing...`, 'success');
            refresh();
            setTimeout(() => window.location.reload(), 2000);
          } catch (err: any) {
            showToast(err.message || 'Payment verification failed. Contact support.', 'error');
          } finally {
            setLoading(null);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err: any) {
      showToast(err.message || 'Something went wrong. Please try again.', 'error');
      setLoading(null);
    }
  };

  const annualSavingsPercent = (monthly: number, annualMonthly: number) =>
    Math.round(((monthly - annualMonthly) / monthly) * 100);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000,
          padding: '0.875rem 1.25rem',
          background: toast.type === 'success' ? 'rgba(5,150,105,0.95)' : 'rgba(220,38,38,0.95)',
          color: 'white', borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          fontSize: '0.875rem', fontWeight: 500,
          maxWidth: 360, animation: 'fadeIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          {isPaid ? 'Manage Your Plan' : 'Upgrade Your Plan'}
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem' }}>
          {isPaid
            ? `You're on the ${PLANS[currentPlan]?.name} plan.`
            : 'Every quote is shaped around your content volume, platforms, brands and team access.'}
        </p>
      </div>

      {/* Current Plan Card (paid users) */}
      {isPaid && (
        <div className="card" style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(91,141,239,0.05) 100%)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: PLAN_GRADIENT[currentPlan],
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              }}>
                {PLAN_ICONS[currentPlan]}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '1rem', margin: 0 }}>
                  {PLANS[currentPlan]?.name} Plan
                </p>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
                  Status: <span style={{ fontWeight: 600, color: status === 'active' ? '#059669' : '#D97706' }}>{status}</span>
                  {currentPeriodEnd && ` · Renews ${new Date(currentPeriodEnd).toLocaleDateString('en-IN')}`}
                </p>
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              <p style={{ margin: 0 }}>To cancel or update your subscription,</p>
              <p style={{ margin: 0 }}>contact us at <strong>support@autopilot.ai</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        {Object.values(PLANS).map((plan) => {
          const isCurrent = plan.id === currentPlan;

          return (
            <div
              key={plan.id}
              style={{
                position: 'relative',
                border: plan.highlighted ? '2px solid #7C3AED' : isCurrent ? '2px solid var(--foreground)' : '1px solid var(--border)',
                borderRadius: 'calc(var(--radius) + 4px)',
                padding: '1.5rem',
                background: plan.highlighted
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(168,85,247,0.04) 100%)'
                  : 'var(--card)',
                transition: 'box-shadow 0.2s',
              }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: plan.highlighted ? '#7C3AED' : '#D97706',
                  color: 'white', padding: '0.2rem 0.875rem',
                  borderRadius: 100, fontSize: '0.6875rem', fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {plan.badge}
                </div>
              )}
              {isCurrent && !plan.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--foreground)', color: 'white',
                  padding: '0.2rem 0.875rem', borderRadius: 100,
                  fontSize: '0.6875rem', fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  ✓ Current Plan
                </div>
              )}

              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: PLAN_GRADIENT[plan.id],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', marginBottom: '1rem',
              }}>
                {PLAN_ICONS[plan.id]}
              </div>

              <h3 style={{ fontWeight: 700, fontSize: '1.125rem', margin: '0 0 0.25rem', color: 'var(--foreground)' }}>
                {plan.name}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', margin: '0 0 1.25rem', lineHeight: 1.4 }}>
                {plan.description}
              </p>

              {/* Custom pricing */}
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em' }}>Custom quote</span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', margin: '0.35rem 0 0', lineHeight: 1.45 }}>
                  Based on your actual usage and workflow.
                </p>
              </div>

              {/* CTA */}
              {isCurrent ? (
                <div style={{ textAlign: 'center', padding: '0.625rem', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                  Current access level
                </div>
              ) : (
                <Link
                  href="mailto:support@autopilot.ai?subject=Custom%20Personal%20Brand%20plan"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
                >
                  Request custom quote
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="card" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--foreground)' }}>
          Full Feature Comparison
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--muted-foreground)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                Feature
              </th>
              {Object.values(PLANS).map(p => (
                <th key={p.id} style={{
                  textAlign: 'center', padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  color: p.id === currentPlan ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontWeight: 700, minWidth: 100,
                }}>
                  {p.name}
                  {p.id === currentPlan && (
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: '#7C3AED', fontWeight: 700 }}>✓ Active</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((row, i) => (
              <tr key={row.label} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--muted)' }}>
                <td style={{ padding: '0.625rem 1rem', color: 'var(--foreground)', fontWeight: 500 }}>{row.label}</td>
                {(Object.keys(PLANS) as PlanId[]).map(planId => {
                  const val = row.plans[planId];
                  return (
                    <td key={planId} style={{ textAlign: 'center', padding: '0.625rem 1rem' }}>
                      {typeof val === 'boolean'
                        ? val
                          ? <Check size={16} style={{ color: '#059669', margin: '0 auto' }} />
                          : <X size={16} style={{ color: 'var(--muted-foreground)', margin: '0 auto' }} />
                        : <span style={{ color: val === 'Unlimited' ? '#7C3AED' : 'var(--foreground)', fontWeight: val === 'Unlimited' ? 700 : 400 }}>{val}</span>
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trust signals */}
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { icon: <Shield size={16} />, text: 'Custom quote based on usage' },
          { icon: <Sparkles size={16} />, text: 'Private workspace credentials' },
          { icon: <CreditCard size={16} />, text: 'Payment confirmed before access' },
          { icon: <Check size={16} />, text: 'Usage reviewed as you grow' },
        ].map(item => (
          <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            {item.icon} {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
        Loading plans...
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}
