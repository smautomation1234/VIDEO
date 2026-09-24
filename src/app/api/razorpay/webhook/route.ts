// src/app/api/razorpay/webhook/route.ts
// Handles Razorpay webhook events for subscription lifecycle management

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { syncRazorpaySubscription } from '@/lib/subscription';
import type { PlanId } from '@/lib/plans';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Map Razorpay Plan ID → our plan name
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

// Verify Razorpay webhook signature
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (!verifyWebhookSignature(body, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
    console.error('[Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType: string = event.event;
  console.log(`[Razorpay Webhook] Event: ${eventType}`);

  try {
    switch (eventType) {

      // ── Subscription Activated (first payment) ─────────────────────────────
      case 'subscription.activated': {
        const sub = event.payload?.subscription?.entity;
        if (!sub) break;

        const userId = sub.notes?.supabase_user_id;
        const plan = getPlanFromRazorpayPlanId(sub.plan_id);
        const currentPeriodEnd = sub.current_end ? new Date(sub.current_end * 1000) : undefined;

        await syncRazorpaySubscription({
          userId,
          razorpayCustomerId: sub.customer_id,
          razorpaySubscriptionId: sub.id,
          plan,
          status: 'active',
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
        });
        break;
      }

      // ── Subscription Charged (recurring payment success) ───────────────────
      case 'subscription.charged': {
        const sub = event.payload?.subscription?.entity;
        if (!sub) break;

        const plan = getPlanFromRazorpayPlanId(sub.plan_id);
        const currentPeriodEnd = sub.current_end ? new Date(sub.current_end * 1000) : undefined;

        await syncRazorpaySubscription({
          razorpaySubscriptionId: sub.id,
          razorpayCustomerId: sub.customer_id,
          plan,
          status: 'active',
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
        });
        break;
      }

      // ── Subscription Cancelled ─────────────────────────────────────────────
      case 'subscription.cancelled': {
        const sub = event.payload?.subscription?.entity;
        if (!sub) break;

        await syncRazorpaySubscription({
          razorpaySubscriptionId: sub.id,
          razorpayCustomerId: sub.customer_id,
          plan: 'free',
          status: 'canceled',
          cancelAtPeriodEnd: false,
        });
        break;
      }

      // ── Subscription Pending (payment failed) ──────────────────────────────
      case 'subscription.pending': {
        const sub = event.payload?.subscription?.entity;
        if (!sub) break;

        await syncRazorpaySubscription({
          razorpaySubscriptionId: sub.id,
          razorpayCustomerId: sub.customer_id,
          plan: getPlanFromRazorpayPlanId(sub.plan_id),
          status: 'past_due',
          cancelAtPeriodEnd: false,
        });
        break;
      }

      // ── Subscription Halted (multiple payment failures) ────────────────────
      case 'subscription.halted': {
        const sub = event.payload?.subscription?.entity;
        if (!sub) break;

        // Downgrade to free
        await syncRazorpaySubscription({
          razorpaySubscriptionId: sub.id,
          razorpayCustomerId: sub.customer_id,
          plan: 'free',
          status: 'canceled',
          cancelAtPeriodEnd: false,
        });
        break;
      }

      // ── Payment Failed (on recurring charge) ───────────────────────────────
      case 'payment.failed': {
        const payment = event.payload?.payment?.entity;
        console.warn(`[Webhook] Payment failed: ${payment?.id}, subscription: ${payment?.subscription_id}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventType}`);
    }
  } catch (err: any) {
    console.error(`[Webhook] Error processing ${eventType}:`, err.message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
