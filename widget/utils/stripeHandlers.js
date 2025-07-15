const EDGE_FUNCTION_BASE =
  'https://sdhhujiktuqldbbeczyy.supabase.co/functions/v1/stripe-actions';

export async function applyStripeDiscount(
  subscriptionId,
  couponId,
  stripeKey,
  accountId
) {
  return callStripeFunction('apply_discount', {
    subscription_id: subscriptionId,
    coupon_id: couponId,
    stripe_key: stripeKey,
    account_id: accountId,
  });
}

export async function pauseStripeSubscription(
  subscriptionId,
  stripeKey,
  accountId
) {
  return callStripeFunction('pause_subscription', {
    subscription_id: subscriptionId,
    stripe_key: stripeKey,
    account_id: accountId,
  });
}

export async function switchStripePlan(
  subscriptionId,
  priceId,
  stripeKey,
  accountId,
  billingCycleAnchor = 'unchanged'
) {
  return callStripeFunction('switch_plan', {
    subscription_id: subscriptionId,
    price_id: priceId,
    stripe_key: stripeKey,
    account_id: accountId,
    billing_cycle_anchor: billingCycleAnchor,
  });
}

export async function cancelStripeSubscription(
  subscriptionId,
  stripeKey,
  accountId
) {
  return callStripeFunction('cancel_subscription', {
    subscription_id: subscriptionId,
    stripe_key: stripeKey,
    account_id: accountId,
  });
}

export async function fetchUserPlanInfo(subscriptionId, accountId) {
  const response = await fetch(
    `https://sdhhujiktuqldbbeczyy.supabase.co/functions/v1/stripe-actions-get_user_plan_info`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          subscription_id: subscriptionId,
          account_id: accountId,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || 'Unknown Stripe API error');
  }

  return response.json();
}

async function callStripeFunction(action, data) {
  const response = await fetch(EDGE_FUNCTION_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || 'Unknown Stripe API error');
  }

  return response.json();
}
