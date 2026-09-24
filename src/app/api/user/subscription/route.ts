// src/app/api/user/subscription/route.ts
// Returns the current user's subscription data + usage

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserSubscription, getUsage } from '@/lib/subscription';
import { getPlan } from '@/lib/plans';

export async function GET(request: NextRequest) {
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

    const [subscription, usage] = await Promise.all([
      getUserSubscription(session.user.id),
      getUsage(session.user.id),
    ]);

    const plan = getPlan(subscription.plan);

    return NextResponse.json({
      subscription,
      usage,
      plan: {
        id: plan.id,
        name: plan.name,
        limits: plan.limits,
      },
    });
  } catch (err: any) {
    console.error('[user/subscription]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
