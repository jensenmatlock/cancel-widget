import { fetchUserPlanInfo } from './stripeHandlers.js';

/**
 * Fetches the current user's subscription and plan context.
 * Works for both cancel widget and banner (root-agnostic).
 * Pulls from DOM data attributes, Stripe (with session cache), or dataLayer.
 */
export async function getUserContext(config) {
  // Locate DOM element with user data (root-agnostic)
  const domRoot =
    document.querySelector('[data-user-subscription-id]') ||
    document.querySelector('[data-user-plan-id]') ||
    document.querySelector('#widget-container') || // legacy
    document.querySelector('#banner') || // banner root fallback
    document.body;

  const attrs = domRoot?.dataset || {};

  // Start with DOM-based values
  let user_id = attrs.userId || attrs.user_id;
  let user_subscription_id =
    attrs.userSubscriptionId || attrs.user_subscription_id;
  let user_ltv = attrs.userLtv || attrs.user_ltv;

  // Plan/subscription details (overridden by Stripe if available)
  let user_plan_name = attrs.userPlanName || attrs.user_plan_name || undefined;
  let user_plan_id = attrs.userPlanId || attrs.user_plan_id || undefined;
  let user_plan_interval =
    attrs.userPlanInterval || attrs.user_plan_interval || undefined;
  let user_plan_price =
    attrs.userPlanPrice || attrs.user_plan_price || undefined;

  // Pause/reactivation state defaults
  let is_paused = false;
  let has_upcoming_pause = false;
  let resume_date = null;
  let schedule_id = null;
  let had_recent_subscription = false;
  let customer_id = null;

  // Prefer Stripe for plan/subscription state if credentials + sub ID exist
  if (
    config?.credentials?.gateway === 'stripe' &&
    user_subscription_id &&
    config.account_id
  ) {
    const cacheKey = `subjolt_planinfo_${user_subscription_id}`;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const value = JSON.parse(cached);
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
          customer_id,
        } = value || {});
      }

      // Fetch fresh if cache is missing or incomplete
      if (!user_plan_id || !user_plan_name || cached === null) {
        const info = await fetchUserPlanInfo(
          user_subscription_id,
          config.account_id,
          config.credentials.stripe_secret_key
        );

        if (info && typeof info === 'object') {
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
            customer_id,
          } = info);

          // Write defensively to cache (skip if response is empty)
          if (info.plan_id || info.had_recent_subscription) {
            sessionStorage.setItem(cacheKey, JSON.stringify(info));
          }
        }
      }
    } catch (err) {
      console.warn(
        '⚠️ Failed to fetch or cache plan info from Stripe:',
        err.message
      );
      // Continue using DOM values as fallback
    }
  }

  // Final fallback: check window.dataLayer
  if (window.dataLayer) {
    const latest = [...window.dataLayer]
      .reverse()
      .find((entry) => entry.user_id || entry.user_subscription_id);
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
    customer_id,
  };
}
