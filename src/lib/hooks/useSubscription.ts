// src/lib/hooks/useSubscription.ts
// React hook for accessing current user's subscription state

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PlanId } from '@/lib/plans';

export interface SubscriptionState {
  plan: PlanId;
  planName: string;
  status: string;
  limits: {
    postsPerMonth: number;
    aiGenerationsPerMonth: number;
    carouselPerMonth: number;
    videoPerMonth: number;
    autopilot: boolean;
    agents: boolean;
    autoDm: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
    analytics: boolean;
    leads: boolean;
    campaigns: boolean;
    seats: number;
  };
  usage: {
    posts_generated: number;
    ai_generations: number;
    carousel_generations: number;
    video_generations: number;
  };
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
  error: string | null;
  isPaid: boolean;
  isPro: boolean;
  isAgency: boolean;
  refresh: () => void;
}

const defaultState: SubscriptionState = {
  plan: 'free',
  planName: 'Free',
  status: 'active',
  limits: {
    postsPerMonth: 5,
    aiGenerationsPerMonth: 10,
    carouselPerMonth: 2,
    videoPerMonth: 0,
    autopilot: false,
    agents: false,
    autoDm: false,
    whiteLabel: false,
    prioritySupport: false,
    analytics: false,
    leads: false,
    campaigns: false,
    seats: 1,
  },
  usage: {
    posts_generated: 0,
    ai_generations: 0,
    carousel_generations: 0,
    video_generations: 0,
  },
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  loading: true,
  error: null,
  isPaid: false,
  isPro: false,
  isAgency: false,
  refresh: () => {},
};

let cachedData: Partial<SubscriptionState> | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 60_000; // 1 minute

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>(defaultState);

  const fetchSubscription = useCallback(async () => {
    // Use cache if fresh
    if (cachedData && Date.now() < cacheExpiry) {
      setState(s => ({ ...s, ...cachedData, loading: false }));
      return;
    }

    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/user/subscription');
      if (!res.ok) throw new Error('Failed to load subscription');

      const data = await res.json();
      const plan = data.plan.id as PlanId;

      const newState: Partial<SubscriptionState> = {
        plan,
        planName: data.plan.name,
        status: data.subscription.status,
        limits: data.plan.limits,
        usage: data.usage,
        currentPeriodEnd: data.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: data.subscription.cancelAtPeriodEnd,
        isPaid: plan !== 'free',
        isPro: plan === 'pro' || plan === 'agency',
        isAgency: plan === 'agency',
        loading: false,
        error: null,
      };

      cachedData = newState;
      cacheExpiry = Date.now() + CACHE_TTL;
      setState(s => ({ ...s, ...newState }));
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { ...state, refresh: fetchSubscription };
}
