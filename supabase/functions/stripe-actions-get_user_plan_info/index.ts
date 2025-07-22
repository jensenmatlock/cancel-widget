import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.6.0?bundle';

console.log('✅ stripe-actions-get_user_plan_info function loaded');

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: getCorsHeaders() });
  }

  try {
    const body = await req.json();
    const data = body?.data;

    if (!data?.stripe_key || !data?.subscription_id) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe_key or subscription_id' }),
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const { stripe_key, subscription_id } = data;
    const stripe = Stripe(stripe_key, { apiVersion: '2022-11-15' });

    // Fetch subscription + related data in parallel
    const subscriptionPromise = stripe.subscriptions.retrieve(subscription_id, {
      expand: ['items.data.price.product'],
    });
    const schedulesPromise = stripe.subscriptionSchedules.list({
      customer: undefined, // we fill in after sub
      limit: 5,
    });

    const subscription = await subscriptionPromise;
    if (!subscription?.customer) {
      return new Response(
        JSON.stringify({ error: 'No valid subscription found' }),
        { status: 404, headers: getCorsHeaders() }
      );
    }

    const customer_id = subscription.customer as string;

    // Fetch schedules for this customer
    const schedules = await stripe.subscriptionSchedules.list({
      customer: customer_id,
      limit: 5,
    });
    const activeSchedule = schedules.data.find((s) => s.status !== 'canceled');
    const schedule_id = activeSchedule?.id || null;

    // Active subscription details
    const item = subscription.items.data[0];
    const price = item?.price;
    const plan_id = price?.id || null;
    const plan_name =
      typeof price?.product === 'object' ? price.product.name : plan_id;
    const plan_interval = price?.recurring?.interval || null;
    const plan_price = price?.unit_amount
      ? `$${(price.unit_amount / 100).toFixed(2)}`
      : null;

    // Pause/upcoming pause logic (custom, not Stripe pause_collection)
    let is_paused = false;
    let has_upcoming_pause = false;
    let resume_date: string | null = null;

    // Check subscription + schedule to determine state
    const now = Date.now() / 1000;
    const isActive = subscription.status === 'active';
    const cancelAtFuture = subscription.cancel_at && subscription.cancel_at > now;
    const scheduleActive = activeSchedule && activeSchedule.status === 'not_started';

    // Paused: user has a *canceled* subscription AND a scheduled new one
    if (subscription.status === 'canceled' && scheduleActive) {
      is_paused = true;
      if (activeSchedule?.phases?.[0]?.start_date) {
        resume_date = formatDate(activeSchedule.phases[0].start_date);
      }
    }

    // Upcoming pause: user has an *active* sub, a cancel_at date, and a scheduled new one
    if (isActive && cancelAtFuture && scheduleActive) {
      has_upcoming_pause = true;
      if (activeSchedule?.phases?.[0]?.start_date) {
        resume_date = formatDate(activeSchedule.phases[0].start_date);
      }
    }

    // Reactivation: No active sub, no "paused" state, but had a canceled sub recently
    let had_recent_subscription = false;
    let reactivation_plan_id = plan_id;
    let reactivation_customer_id = customer_id;

    if (!isActive && !is_paused) {
      const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;

      const pastSubs = await stripe.subscriptions.list({
        customer: customer_id,
        status: 'canceled',
        limit: 5,
        created: { gte: oneYearAgo },
        expand: ['data.items.data.price.product'],
      });

      if (pastSubs.data.length > 0) {
        had_recent_subscription = true;

        // Grab the most recent canceled sub to seed reactivation
        const lastSub = pastSubs.data.sort(
          (a, b) => (b.ended_at || 0) - (a.ended_at || 0)
        )[0];

        if (lastSub?.items?.data?.length) {
          const lastItem = lastSub.items.data[0];
          reactivation_plan_id = lastItem.price?.id || null;
          reactivation_customer_id = lastSub.customer as string;
        }
      }
    }

    const response = {
      plan_id: plan_id || reactivation_plan_id,
      plan_name,
      plan_interval,
      plan_price,
      customer_id: reactivation_customer_id,
      is_paused,
      has_upcoming_pause,
      resume_date,
      schedule_id,
      had_recent_subscription,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (err: any) {
    console.error('❌ get_user_plan_info error', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: err?.message || 'Unknown error',
      }),
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

function formatDate(unixTime: number | null | undefined): string | null {
  if (!unixTime) return null;
  const date = new Date(unixTime * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
