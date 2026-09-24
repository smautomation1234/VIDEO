// src/lib/razorpay.ts
// Razorpay server-side client singleton

import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('[Razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Billing features will be disabled.');
}

export const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

export function getRazorpay(): Razorpay {
  if (!razorpay)
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.');
  return razorpay;
}
