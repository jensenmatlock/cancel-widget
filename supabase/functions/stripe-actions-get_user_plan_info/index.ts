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

    // Get subscription details first (to extract customer)
    const subscription = await stripe.subscriptions.retrieve(subscription_id, {
      expand: ['items.data.price.product'],
    });

    if (!subscription || !subscription.customer) {
      return new Response(
        JSON.stringify({ error: 'No valid subscription found' }),
        { status: 404, headers: getCorsHeaders() }
      );
    }

    const customer_id = subscription.customer as string;

    // Fetch schedules for this customer (guard against empty results)
    let schedules = { data: [] as any[] };
    try {
      schedules = await stripe.subscriptionSchedules.list({
        customer: customer_id,
        limit: 5,
      });
    } catch (scheduleErr) {
      console.warn('⚠️ Failed to fetch subscription schedules:', scheduleErr);
    }
    const activeSchedule = schedules.data.find((s) => s?.status !== 'canceled') || null;
    const schedule_id = activeSchedule?.id || null;

    // Plan and pricing info from active subscription (or fallback later)
    const item = subscription.items?.data?.[0];
    const price = item?.price || null;
    const plan_id = price?.id || null;
    const plan_name =
      typeof price?.product === 'object' && price.product?.name
        ? price.product.name
        : plan_id;
    const plan_interval = price?.recurring?.interval || null;
    const plan_price = price?.unit_amount
      ? `$${(price.unit_amount / 100).toFixed(2)}`
      : null;

    // State defaults
    let is_paused = false;
    let has_upcoming_pause = false;
    let resume_date: string | null = null;

    const now = Date.now() / 1000;
    const isActive = subscription.status === 'active';
    const cancelAtFuture = !!subscription.cancel_at && subscription.cancel_at > now;
    const scheduleActive = !!activeSchedule && activeSchedule.status === 'not_started';

    // Paused: canceled subscription AND scheduled new sub
    if (subscription.status === 'canceled' && scheduleActive) {
      is_paused = true;
      const start = activeSchedule?.phases?.[0]?.start_date;
      if (start) resume_date = formatDate(start);
    }

    // Upcoming pause: active subscription, cancel_at in future, AND scheduled new sub
    if (isActive && cancelAtFuture && scheduleActive) {
      has_upcoming_pause = true;
      const start = activeSchedule?.phases?.[0]?.start_date;
      if (start) resume_date = formatDate(start);
    }

    // Reactivation check (no active sub, not paused)
    let had_recent_subscription = false;
    let reactivation_plan_id = plan_id;
    let reactivation_customer_id = customer_id;

    if (!isActive && !is_paused) {
      try {
        const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
        const pastSubs = await stripe.subscriptions.list({
          customer: customer_id,
          status: 'canceled',
          limit: 5,
          created: { gte: oneYearAgo },
          expand: ['data.items.data.price'], // drop .product (avoids depth error)
        });

        if (pastSubs.data?.length > 0) {
          had_recent_subscription = true;
          const lastSub = pastSubs.data.sort(
            (a, b) => (b.ended_at || 0) - (a.ended_at || 0)
          )[0];
          if (lastSub?.items?.data?.[0]?.price) {
            reactivation_plan_id = lastSub.items.data[0].price.id || null;
            reactivation_customer_id = lastSub.customer as string;
          }
        }
      } catch (pastErr) {
        console.warn('⚠️ Failed to fetch past subscriptions:', pastErr);
      }
    }

    const final_plan_id = isActive ? plan_id : reactivation_plan_id;
    const final_customer_id = isActive ? customer_id : reactivation_customer_id;

    const response = {
      plan_id: final_plan_id || null,
      plan_name,
      plan_interval,
      plan_price,
      customer_id: final_customer_id || null,
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

export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

function formatDate(unixTime: number | null | undefined): string | null {
  if (!unixTime || isNaN(unixTime)) return null;
  try {
    const date = new Date(unixTime * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}
