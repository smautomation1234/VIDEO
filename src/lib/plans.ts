// src/lib/plans.ts
// Plan definitions, feature limits, and route gating for SaaS tiers
// Prices are in INR (Indian Rupees) — Razorpay amounts are in paise (1 INR = 100 paise)

export type PlanId = 'free' | 'starter' | 'pro' | 'agency';

export interface PlanLimits {
  postsPerMonth: number;          // -1 = unlimited
  aiGenerationsPerMonth: number;
  carouselPerMonth: number;
  videoPerMonth: number;
  seats: number;
  autopilot: boolean;
  agents: boolean;
  autoDm: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  analytics: boolean;
  leads: boolean;
  campaigns: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPricePaise: number;       // in paise (0 = free), for Razorpay
  annualPricePaise: number;        // annual total in paise
  monthlyPriceINR: number;         // ₹ for display
  annualMonthlyINR: number;        // ₹/mo when billed annually
  razorpayPlanIdMonthly?: string;  // Razorpay Plan ID for monthly
  razorpayPlanIdAnnual?: string;   // Razorpay Plan ID for annual
  limits: PlanLimits;
  highlighted?: boolean;
  badge?: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with core features',
    monthlyPricePaise: 0,
    annualPricePaise: 0,
    monthlyPriceINR: 0,
    annualMonthlyINR: 0,
    limits: {
      postsPerMonth: 5,
      aiGenerationsPerMonth: 10,
      carouselPerMonth: 2,
      videoPerMonth: 0,
      seats: 1,
      autopilot: false,
      agents: false,
      autoDm: false,
      whiteLabel: false,
      prioritySupport: false,
      analytics: false,
      leads: false,
      campaigns: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individual creators & founders',
    monthlyPricePaise: 249900,     // ₹2,499/mo
    annualPricePaise: 2399900,     // ₹23,999/yr ≈ ₹1,999/mo
    monthlyPriceINR: 2499,
    annualMonthlyINR: 1999,
    razorpayPlanIdMonthly: process.env.RAZORPAY_PLAN_STARTER_MONTHLY,
    razorpayPlanIdAnnual: process.env.RAZORPAY_PLAN_STARTER_ANNUAL,
    limits: {
      postsPerMonth: 50,
      aiGenerationsPerMonth: 100,
      carouselPerMonth: 20,
      videoPerMonth: 5,
      seats: 1,
      autopilot: true,
      agents: false,
      autoDm: true,
      whiteLabel: false,
      prioritySupport: false,
      analytics: true,
      leads: true,
      campaigns: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For power users & growing businesses',
    monthlyPricePaise: 659900,     // ₹6,599/mo
    annualPricePaise: 6359900,     // ₹63,599/yr ≈ ₹5,299/mo
    monthlyPriceINR: 6599,
    annualMonthlyINR: 5299,
    razorpayPlanIdMonthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY,
    razorpayPlanIdAnnual: process.env.RAZORPAY_PLAN_PRO_ANNUAL,
    highlighted: true,
    badge: 'Most Popular',
    limits: {
      postsPerMonth: -1,
      aiGenerationsPerMonth: -1,
      carouselPerMonth: -1,
      videoPerMonth: 30,
      seats: 1,
      autopilot: true,
      agents: true,
      autoDm: true,
      whiteLabel: false,
      prioritySupport: true,
      analytics: true,
      leads: true,
      campaigns: true,
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    description: 'For agencies managing multiple brands',
    monthlyPricePaise: 1659900,    // ₹16,599/mo
    annualPricePaise: 15959900,    // ₹1,59,599/yr ≈ ₹13,299/mo
    monthlyPriceINR: 16599,
    annualMonthlyINR: 13299,
    razorpayPlanIdMonthly: process.env.RAZORPAY_PLAN_AGENCY_MONTHLY,
    razorpayPlanIdAnnual: process.env.RAZORPAY_PLAN_AGENCY_ANNUAL,
    badge: 'Best Value',
    limits: {
      postsPerMonth: -1,
      aiGenerationsPerMonth: -1,
      carouselPerMonth: -1,
      videoPerMonth: -1,
      seats: 5,
      autopilot: true,
      agents: true,
      autoDm: true,
      whiteLabel: true,
      prioritySupport: true,
      analytics: true,
      leads: true,
      campaigns: true,
    },
  },
};

// Routes that require at least a paid plan
export const PAID_ROUTES = [
  '/autopilot',
  '/agents',
  '/auto-dm',
  '/antigravity',
];

// Routes that require Pro or Agency
export const PRO_ROUTES = [
  '/agents',
  '/geo-finance',
];

export function getPlan(planId: PlanId): Plan {
  return PLANS[planId] ?? PLANS.free;
}

export function canAccessFeature(planId: PlanId, feature: keyof PlanLimits): boolean {
  const plan = getPlan(planId);
  const value = plan.limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return false;
}

export function formatINR(paise: number): string {
  if (paise === 0) return '₹0';
  const inr = paise / 100;
  return `₹${inr.toLocaleString('en-IN')}`;
}

export const PLAN_COLORS: Record<PlanId, string> = {
  free: '#9A8F87',
  starter: '#5B8DEF',
  pro: '#7C3AED',
  agency: '#D97706',
};
