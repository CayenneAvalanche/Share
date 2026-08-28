/**
 * Stripe path for Share (share.myendeavors.me)
 * ---------------------------------------------
 * This demo simulates checkout only. Real Stripe needs:
 * 1. Stripe account (stripe.com) → activate for US
 * 2. Products: ride seats, delivery offers, local rides
 * 3. Keys: STRIPE_SECRET_KEY (server) + VITE_STRIPE_PUBLISHABLE_KEY (client)
 * 4. Checkout Session or PaymentIntent on a server route
 * 5. Webhook: checkout.session.completed → mark booking paid
 * 6. Connect (later): pay drivers their ~90% share automatically
 *
 * Suggested pilot order:
 * A. You collect via Stripe Checkout (you hold funds)
 * B. Payout drivers weekly (manual or bank)
 * C. Stripe Connect Express when volume justifies it
 */

export const STRIPE_PILOT_NOTES = {
  domain: "share.myendeavors.me",
  platformTake: 0.1,
  mode: "demo" as const,
};

export function fakeStripeId() {
  return `pi_demo_${Math.random().toString(36).slice(2, 10)}`;
}

export function driverPayout(gross: number, take = 0.1) {
  return Math.round(gross * (1 - take) * 100) / 100;
}
