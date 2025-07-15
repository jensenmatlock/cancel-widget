import { fetchUserPlanInfo } from './stripeHandlers.js';

export async function getUserContext(config) {
  const container = document.getElementById('widget-container');
  const attrs = container?.dataset || {};

  let user_id = attrs.userId;
  let user_subscription_id = attrs.userSubscriptionId;
  let user_ltv = attrs.userLtv;

  let user_plan_name = undefined;
  let user_plan_id = undefined;
  let user_plan_interval = undefined;
  let user_plan_price = undefined;

  // ✅ Always prioritize Stripe if credentials + subscription_id exist
  if (
    config?.credentials?.gateway === 'stripe' &&
    user_subscription_id &&
    config.account_id
  ) {
    const cacheKey = `subjolt_planinfo_${user_subscription_id}`;
    const now = Date.now();

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { value, timestamp } = JSON.parse(cached);
        if (now - timestamp < 15 * 60 * 1000) {
          user_plan_name = value.plan_name;
          user_plan_id = value.plan_id;
          user_plan_interval = value.plan_interval;
          user_plan_price = value.plan_price;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }

      if (!user_plan_id || !user_plan_name) {
        const info = await fetchUserPlanInfo(
          user_subscription_id,
          config.account_id,
          config.credentials.stripe_key
        );
        user_plan_name = info.plan_name;
        user_plan_id = info.plan_id;
        user_plan_interval = info.plan_interval;
        user_plan_price = info.plan_price;

        localStorage.setItem(
          cacheKey,
          JSON.stringify({ value: info, timestamp: now })
        );
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch plan info from Stripe:', err.message);

      // Fallback to DOM data only if Stripe fetch fails
      user_plan_name = attrs.userPlanName || undefined;
      user_plan_id = attrs.userPlanId || undefined;
      user_plan_interval = attrs.userPlanInterval || undefined;
      user_plan_price = attrs.userPlanPrice || undefined;
    }
  } else {
    // ✅ Fallback to DOM if no Stripe
    user_plan_name = attrs.userPlanName || undefined;
    user_plan_id = attrs.userPlanId || undefined;
    user_plan_interval = attrs.userPlanInterval || undefined;
    user_plan_price = attrs.userPlanPrice || undefined;
  }

  // ✅ Fallback to dataLayer last
  if (window.dataLayer) {
    const latest = [...window.dataLayer]
      .reverse()
      .find((entry) => entry.user_id);
    if (latest) {
      user_id = user_id || latest.user_id;
      user_subscription_id =
        user_subscription_id || latest.user_subscription_id;
      user_plan_name = user_plan_name || latest.user_plan_name;
      user_plan_id = user_plan_id || latest.user_plan_id;
      user_plan_interval = user_plan_interval || latest.user_plan_interval;
      user_plan_price = user_plan_price || latest.user_plan_price;
      user_ltv = user_ltv || latest.user_ltv;
    }
  }

  return {
    user_id,
    user_subscription_id,
    user_plan_name,
    user_plan_id,
    user_plan_interval,
    user_plan_price,
    user_ltv,
  };
}
