const EDGE_FUNCTION_BASE =
  'https://sdhhujiktuqldbbeczyy.supabase.co/functions/v1/stripe-actions';

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

export function clearAndSeedPlanCache(subscriptionId, planInfo) {
  try {
    const cacheKey = `subjolt_planinfo_${subscriptionId}`;
    sessionStorage.setItem(cacheKey, JSON.stringify(planInfo));
  } catch (err) {
    console.error('⚠️ Failed to seed plan cache', err);
  }
}

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

export async function switchStripePlan(
  subscriptionId,
  priceId,
  stripeKey,
  accountId,
  billingCycleAnchor = 'unchanged'
) {
  const result = await callStripeFunction('switch_plan', {
    subscription_id: subscriptionId,
    price_id: priceId,
    stripe_key: stripeKey,
    account_id: accountId,
    billing_cycle_anchor: billingCycleAnchor,
  });
  clearAndSeedPlanCache(subscriptionId, result?.data);
  return result;
}

export async function cancelStripeSubscription(
  subscriptionId,
  stripeKey,
  accountId
) {
  const result = await callStripeFunction('cancel_subscription', {
    subscription_id: subscriptionId,
    stripe_key: stripeKey,
    account_id: accountId,
  });
  clearAndSeedPlanCache(subscriptionId, result?.data);
  return result;
}

export async function pauseStripeSubscription(
  subscriptionId,
  stripeKey,
  accountId,
  pauseDuration
) {
  const result = await callStripeFunction('pause_subscription', {
    subscription_id: subscriptionId,
    stripe_key: stripeKey,
    account_id: accountId,
    pause_duration: Number(pauseDuration),
  });
  clearAndSeedPlanCache(subscriptionId, result?.data);
  return {
    handled: true,
    ...result,
    ...result.data, // Flatten for consumers
  };
}

export async function cancelPauseSubscription(
  subscriptionId,
  stripeKey,
  accountId
) {
  const result = await callStripeFunction('cancel_pause', {
    subscription_id: subscriptionId,
    stripe_key: stripeKey,
    account_id: accountId,
  });
  clearAndSeedPlanCache(subscriptionId, result?.data);
  return result;
}

export async function unpauseNow(customerId, priceId, stripeKey, accountId) {
  const result = await callStripeFunction('unpause_now', {
    customer_id: customerId,
    price_id: priceId,
    stripe_key: stripeKey,
    account_id: accountId,
  });

  // Grab subscription_id safely (Edge now sends it in two places for redundancy)
  const subscriptionId =
    result?.data?.subscription_id || result?.subscription_id || null;

  if (subscriptionId) {
    // Re-seed the session cache immediately so getUserContext() returns updated state
    clearAndSeedPlanCache(subscriptionId, {
      ...result?.data,
      subscription_id: subscriptionId,
    });
  } else {
    console.warn('⚠️ unpauseNow: Missing subscription_id in response', result);
  }

  return result;
}

export async function cancelSchedule(scheduleId, stripeKey, accountId) {
  const result = await callStripeFunction('cancel_schedule', {
    schedule_id: scheduleId,
    stripe_key: stripeKey,
    account_id: accountId,
  });

  const subscriptionId =
    result?.data?.subscription_id || result?.subscription_id || null;

  if (subscriptionId) {
    clearAndSeedPlanCache(subscriptionId, result?.data);
  } else {
    console.warn(
      '⚠️ cancelSchedule: Missing subscription_id in response',
      result
    );
  }

  return result;
}

export async function fetchUserPlanInfo(subscriptionId, accountId, stripeKey) {
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
          stripe_key: stripeKey,
          account_id: accountId,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || 'Failed to fetch plan info');
  }

  return await response.json();
}
