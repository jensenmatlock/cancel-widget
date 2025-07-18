import { fetchUserPlanInfo } from './stripeHandlers.js';

export async function getUserContext(config) {
  const container = document.getElementById('widget-container');
  const attrs = container?.dataset || {};

  let user_id = attrs.userId;
  let user_subscription_id = attrs.userSubscriptionId;
  let user_ltv = attrs.userLtv;

  // Always undefined so Stripe can override
  let user_plan_name = undefined;
  let user_plan_id = undefined;
  let user_plan_interval = undefined;
  let user_plan_price = undefined;

  // Pause + reactivation states (default to false/null)
  let is_paused = false;
  let has_upcoming_pause = false;
  let resume_date = null;
  let schedule_id = null;
  let had_recent_subscription = false;

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
          ({
            plan_name: user_plan_name,
            plan_id: user_plan_id,
            plan_interval: user_plan_interval,
            plan_price: user_plan_price,
            is_paused,
            has_upcoming_pause,
            resume_date,
            schedule_id,
            had_recent_subscription,
          } = value);
        } else {
          localStorage.removeItem(cacheKey);
        }
      }

      if (!user_plan_id || !user_plan_name) {
        const info = await fetchUserPlanInfo(
          user_subscription_id,
          config.account_id,
          config.credentials.stripe_secret_key // We send secret, not publishable
        );

        ({
          plan_name: user_plan_name,
          plan_id: user_plan_id,
          plan_interval: user_plan_interval,
          plan_price: user_plan_price,
          is_paused,
          has_upcoming_pause,
          resume_date,
          schedule_id,
          had_recent_subscription,
        } = info);

        localStorage.setItem(
          cacheKey,
          JSON.stringify({ value: info, timestamp: now })
        );
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch plan info from Stripe:', err.message);
      user_plan_name = attrs.userPlanName || undefined;
      user_plan_id = attrs.userPlanId || undefined;
      user_plan_interval = attrs.userPlanInterval || undefined;
      user_plan_price = attrs.userPlanPrice || undefined;
    }
  } else {
    // Fallback to DOM if no Stripe
    user_plan_name = attrs.userPlanName || undefined;
    user_plan_id = attrs.userPlanId || undefined;
    user_plan_interval = attrs.userPlanInterval || undefined;
    user_plan_price = attrs.userPlanPrice || undefined;
  }

  // Fallback to dataLayer last
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
    is_paused,
    has_upcoming_pause,
    resume_date,
    schedule_id,
    had_recent_subscription,
  };
}
