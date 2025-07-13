const EDGE_FUNCTION_BASE = "https://sdhhujiktuqldbbeczyy.supabase.co/functions/v1/stripe-actions";

export async function applyStripeDiscount(subscriptionId, couponId, stripeKey, accountId) {
  return callStripeFunction("apply_discount", {
    subscription_id: subscriptionId,
    coupon_id: couponId,
    stripe_key: stripeKey,
    account_id: accountId,
  });
}

export async function pauseStripeSubscription(subscriptionId, stripeKey, accountId) {
  return callStripeFunction("pause_subscription", {
    subscription_id: subscriptionId,
    stripe_key: stripeKey,
    account_id: accountId,
  });
}

export async function switchStripePlan(subscriptionId, newPriceId, stripeKey, accountId) {
  return callStripeFunction("switch_plan", {
    subscription_id: subscriptionId,
    new_price_id: newPriceId,
    stripe_key: stripeKey,
    account_id: accountId,
  });
}

export async function cancelStripeSubscription(subscriptionId, stripeKey, accountId) {
  return callStripeFunction("cancel_subscription", {
    subscription_id: subscriptionId,
    stripe_key: stripeKey,
    account_id: accountId,
  });
}

async function callStripeFunction(action, data) {
  const response = await fetch(EDGE_FUNCTION_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || "Unknown Stripe API error");
  }

  return response.json();
}
