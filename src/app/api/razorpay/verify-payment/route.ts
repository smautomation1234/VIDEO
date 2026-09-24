// src/app/api/razorpay/verify-payment/route.ts
// Verifies Razorpay payment signature after client-side checkout completes

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { PLANS, type PlanId } from '@/lib/plans';

// Map Razorpay Plan IDs to our plan names
function getPlanFromRazorpayPlanId(planId: string): PlanId {
  const map: Record<string, PlanId> = {
    [process.env.RAZORPAY_PLAN_STARTER_MONTHLY ?? '']: 'starter',
    [process.env.RAZORPAY_PLAN_STARTER_ANNUAL ?? '']: 'starter',
    [process.env.RAZORPAY_PLAN_PRO_MONTHLY ?? '']: 'pro',
    [process.env.RAZORPAY_PLAN_PRO_ANNUAL ?? '']: 'pro',
    [process.env.RAZORPAY_PLAN_AGENCY_MONTHLY ?? '']: 'agency',
    [process.env.RAZORPAY_PLAN_AGENCY_ANNUAL ?? '']: 'agency',
  };
  return map[planId] ?? 'free';
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan_id,    // the Razorpay Plan ID the user subscribed to
    } = await request.json();

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    // ── Verify signature ─────────────────────────────────────────────────────
    const body = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('[verify-payment] Signature mismatch');
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // ── Fetch subscription details from Razorpay ──────────────────────────────
    const { getRazorpay } = await import('@/lib/razorpay');
    const razorpay = getRazorpay();
    const rzpSub = await (razorpay.subscriptions.fetch as any)(razorpay_subscription_id);

    const actualPlanId = rzpSub.plan_id ?? plan_id;
    const plan = getPlanFromRazorpayPlanId(actualPlanId);

    // current_end is Unix timestamp
    const currentPeriodEnd = rzpSub.current_end
      ? new Date(rzpSub.current_end * 1000)
      : null;

    // ── Update subscription in DB ─────────────────────────────────────────────
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    await adminSupabase.from('subscriptions').upsert({
      user_id: session.user.id,
      razorpay_subscription_id,
      plan,
      status: 'active',
      current_period_end: currentPeriodEnd?.toISOString() ?? null,
      cancel_at_period_end: false,
    }, { onConflict: 'user_id' });

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    console.error('[razorpay/verify-payment]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
