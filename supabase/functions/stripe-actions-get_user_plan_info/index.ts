// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.6.0?target=deno';

console.log('✅ stripe-actions-get_user_plan_info function loaded');

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: getCorsHeaders() });
  }

  try {
    const body = await req.json();
    const data = body?.data;

    if (!data || !data.stripe_key || !data.subscription_id) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe_key or subscription_id' }),
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const { stripe_key, subscription_id } = data;
    const stripe = Stripe(stripe_key, { apiVersion: '2022-11-15' });

    // 1. Retrieve subscription
    const subscription = await stripe.subscriptions.retrieve(subscription_id);
    if (!subscription?.items?.data?.length) {
      return new Response(JSON.stringify({ error: 'No subscription items found' }), {
        status: 404,
        headers: getCorsHeaders(),
      });
    }

    const customer_id = subscription.customer as string;
    const item = subscription.items.data[0];
    const price = await stripe.prices.retrieve(item.price.id, { expand: ['product'] });

    // 2. Pause-related flags
    const isPaused = Boolean(subscription.pause_collection);
    const hasUpcomingPause = Boolean(subscription.cancel_at);
    let readableResumeDate: string | null = null;
    if (hasUpcomingPause && subscription.cancel_at) {
      readableResumeDate = new Date(subscription.cancel_at * 1000).toISOString();
    } else if (isPaused && subscription.current_period_end) {
      readableResumeDate = new Date(subscription.current_period_end * 1000).toISOString();
    }

    // 3. Active or scheduled subscription schedules
    const schedules = await stripe.subscriptionSchedules.list({ customer: customer_id, limit: 5 });
    const activeSchedule = schedules.data.find((s) => s.status !== 'canceled');
    const schedule_id = activeSchedule?.id || null;

    // 4. Past subscriptions (last year) for reactivation banner logic
    const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
    const pastSubs = await stripe.subscriptions.list({
      customer: customer_id,
      status: 'canceled',
      limit: 20,
      created: { gte: oneYearAgo },
    });
    const hadSubscriptionLastYear = pastSubs.data.length > 0;

    const response = {
      plan_id: price.id,
      plan_name: typeof price.product === 'object' ? price.product.name : price.id,
      plan_interval: price.recurring?.interval,
      plan_price: `$${((price.unit_amount || 0) / 100).toFixed(2)}`,
      is_paused: isPaused,
      has_upcoming_pause: hasUpcomingPause,
      resume_date: resumeDate,
      schedule_id,
      had_recent_subscription: hadSubscriptionLastYear,
    };

    return new Response(JSON.stringify(response), { status: 200, headers: getCorsHeaders() });
  } catch (err: any) {
    console.error('❌ get_user_plan_info error', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err?.message || 'Unknown error' }),
      { status: 500, headers: getCorsHeaders() }
    );
  }
});

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}
