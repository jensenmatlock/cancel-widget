import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.6.0?target=deno';

// CORS helper
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(),
    });
  }

  try {
    const { action, data } = await req.json();
    const stripeKey = data.stripe_key;
    const accountId = data.account_id || 'unknown';

    if (!stripeKey) return badRequest('Missing Stripe key');
    const stripe = Stripe(stripeKey, { apiVersion: '2022-11-15' });

    switch (action) {
      case 'pause_subscription':
        return await handlePauseSubscription(stripe, data, accountId);
      case 'apply_discount':
        return await handleApplyDiscount(stripe, data, accountId);
      case 'switch_plan':
        return await handleSwitchPlan(stripe, data, accountId);
      case 'cancel_subscription':
        return await handleCancelSubscription(stripe, data, accountId);
      default:
        return badRequest('Unknown action');
    }
  } catch (err) {
    console.error('❌ Stripe function error:', err);
    return errorResponse('Internal Server Error', err.message);
  }
});

async function handlePauseSubscription(stripe, data, accountId) {
  try {
    const subscriptionId = data.subscription_id;
    if (!subscriptionId) return badRequest('Missing subscription_id');

    const updated = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: { behavior: 'mark_uncollectible' },
    });

    return success(`Subscription ${subscriptionId} paused`, updated);
  } catch (err) {
    await logError('stripe_error', 'pause_subscription', err, accountId);
    return errorResponse('Pause failed', err.message);
  }
}

async function handleApplyDiscount(stripe, data, accountId) {
  try {
    const { subscription_id, coupon_id, config } = data;
    if (!subscription_id) return badRequest('Missing subscription_id');

    const couponToApply = coupon_id || config?.discount?.promo_code;
    if (!couponToApply)
      return badRequest('Missing coupon_id and no promo_code in config');

    const updated = await stripe.subscriptions.update(subscription_id, {
      coupon: couponToApply,
    });

    return success(
      `Coupon ${couponToApply} applied to ${subscription_id}`,
      updated
    );
  } catch (err) {
    await logError('stripe_error', 'apply_discount', err, accountId);
    return errorResponse('Apply discount failed', err.message);
  }
}

async function handleSwitchPlan(stripe, data, accountId) {
  try {
    const { subscription_id, price_id } = data;
    if (!subscription_id || !price_id) {
      return badRequest('Missing subscription_id or new_price_id');
    }

    const subscription = await stripe.subscriptions.retrieve(subscription_id);
    const currentItem = subscription.items.data[0];

    if (!currentItem) {
      return badRequest('Could not determine current subscription item');
    }

    const updated = await stripe.subscriptions.update(subscription_id, {
      items: [
        {
          id: currentItem.id,
          price: price_id,
          quantity: currentItem.quantity || 1,
        },
      ],
      proration_behavior: 'create_prorations',
      billing_cycle_anchor: data.billing_cycle_anchor || 'unchanged',
    });

    return success(
      `Subscription ${subscription_id} switched to ${price_id}`,
      updated
    );
  } catch (err) {
    await logError('stripe_error', 'switch_plan', err, accountId);
    return errorResponse('Switch plan failed', err.message);
  }
}

async function handleCancelSubscription(stripe, data, accountId) {
  try {
    const subscriptionId = data.subscription_id;
    if (!subscriptionId) return badRequest('Missing subscription_id');

    const cancelled = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return success(`Subscription ${subscriptionId} cancelled`, cancelled);
  } catch (err) {
    await logError('stripe_error', 'cancel_subscription', err, accountId);
    return errorResponse('Cancel failed', err.message);
  }
}

async function logError(type, source, err, account_id = 'unknown') {
  const supabaseUrl = Deno.env.get('PROJECT_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  await fetch(`${supabaseUrl}/rest/v1/error_logs`, {
    method: 'POST',
    headers: {
      apikey: supabaseServiceKey ?? '',
      Authorization: `Bearer ${supabaseServiceKey ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      source,
      message: err.message,
      details: err,
      account_id,
      timestamp: new Date().toISOString(),
    }),
  });
}

function success(message, data) {
  return new Response(JSON.stringify({ message, data }), {
    status: 200,
    headers: getCorsHeaders(),
  });
}

function badRequest(msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: getCorsHeaders(),
  });
}

function errorResponse(message, details) {
  return new Response(JSON.stringify({ error: message, details }), {
    status: 500,
    headers: getCorsHeaders(),
  });
}
