// src/lib/subscription.ts
// Server-side helpers for subscription & usage management (Razorpay)

import { createClient } from '@supabase/supabase-js';
import type { PlanId } from './plans';
import { getPlan } from './plans';

// Admin client — bypasses RLS for server-side operations
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface UserSubscription {
  plan: PlanId;
  status: string;
  razorpayCustomerId: string | null;
  razorpaySubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Get the current subscription for a user.
 * Falls back to free plan if no subscription row exists.
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return {
      plan: 'free',
      status: 'active',
      razorpayCustomerId: null,
      razorpaySubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  return {
    plan: (data.plan ?? 'free') as PlanId,
    status: data.status ?? 'active',
    razorpayCustomerId: data.razorpay_customer_id ?? null,
    razorpaySubscriptionId: data.razorpay_subscription_id ?? null,
    currentPeriodEnd: data.current_period_end ?? null,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
  };
}

/**
 * Get current month usage for a user.
 */
export async function getUsage(userId: string) {
  const supabase = getAdminClient();
  const month = new Date().toISOString().slice(0, 7); // "2026-08"

  const { data } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .single();

  return {
    posts_generated: data?.posts_generated ?? 0,
    ai_generations: data?.ai_generations ?? 0,
    carousel_generations: data?.carousel_generations ?? 0,
    video_generations: data?.video_generations ?? 0,
  };
}

type UsageField = 'posts_generated' | 'ai_generations' | 'carousel_generations' | 'video_generations';

/**
 * Check if a user is allowed to perform an action given their plan limits.
 */
export async function checkUsageLimit(
  userId: string,
  field: UsageField
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const subscription = await getUserSubscription(userId);
  const plan = getPlan(subscription.plan);
  const usage = await getUsage(userId);

  const limitMap: Record<UsageField, number> = {
    posts_generated: plan.limits.postsPerMonth,
    ai_generations: plan.limits.aiGenerationsPerMonth,
    carousel_generations: plan.limits.carouselPerMonth,
    video_generations: plan.limits.videoPerMonth,
  };

  const limit = limitMap[field];
  const current = usage[field] ?? 0;

  if (limit === -1) return { allowed: true, current, limit: -1 };
  return { allowed: current < limit, current, limit };
}

/**
 * Increment usage counter for a user (upsert pattern via RPC).
 */
export async function incrementUsage(
  userId: string,
  field: UsageField,
  by = 1
): Promise<void> {
  const supabase = getAdminClient();
  const month = new Date().toISOString().slice(0, 7);

  await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_month: month,
    p_field: field,
    p_by: by,
  });
}

/**
 * Sync a Razorpay subscription to the database.
 * Called from the webhook handler.
 */
export async function syncRazorpaySubscription({
  userId,
  razorpayCustomerId,
  razorpaySubscriptionId,
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: {
  userId?: string;
  razorpayCustomerId?: string;
  razorpaySubscriptionId: string;
  plan: PlanId;
  status: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  const supabase = getAdminClient();

  const updateData: Record<string, any> = {
    razorpay_subscription_id: razorpaySubscriptionId,
    plan,
    status,
    cancel_at_period_end: cancelAtPeriodEnd ?? false,
  };

  if (razorpayCustomerId) updateData.razorpay_customer_id = razorpayCustomerId;
  if (currentPeriodEnd) updateData.current_period_end = currentPeriodEnd.toISOString();

  if (userId) {
    await supabase.from('subscriptions')
      .upsert({ user_id: userId, ...updateData }, { onConflict: 'user_id' });
  } else if (razorpayCustomerId) {
    await supabase.from('subscriptions')
      .update(updateData)
      .eq('razorpay_customer_id', razorpayCustomerId);
  }
}
