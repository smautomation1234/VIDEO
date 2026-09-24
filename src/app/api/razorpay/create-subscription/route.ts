// src/app/api/razorpay/create-subscription/route.ts
// Creates a Razorpay Subscription that the client opens in the checkout modal

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRazorpay } from '@/lib/razorpay';

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

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: 'Missing planId (Razorpay Plan ID)' }, { status: 400 });
    }

    const razorpay = getRazorpay();
    const user = session.user;

    // Create Razorpay subscription
    const subscription = await (razorpay.subscriptions.create as any)({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,          // 12 billing cycles (1 year), then auto-renews
      quantity: 1,
      notes: {
        supabase_user_id: user.id,
        user_email: user.email,
      },
    });

    // Store the pending subscription in DB
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
      user_id: user.id,
      razorpay_subscription_id: subscription.id,
      plan: 'free',   // stays free until payment verified
      status: 'incomplete',
    }, { onConflict: 'user_id' });

    return NextResponse.json({
      subscription_id: subscription.id,
      razorpay_key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      user_name: user.user_metadata?.full_name ?? user.email?.split('@')[0],
      user_email: user.email,
    });
  } catch (err: any) {
    console.error('[razorpay/create-subscription]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
