import { fetchUserPlanInfo } from './stripeHandlers.js';

/**
 * Fetches the current user's subscription and plan context.
 * Works for both cancel widget and banner (root-agnostic).
 * Uses sessionStorage to cache results per session.
 * Pulls from DOM data attributes, Stripe (with caching), or dataLayer.
 */
export async function getUserContext(config) {
  // Find any root element with relevant data (widget or banner)
  const domRoot =
    document.querySelector('[data-user-subscription-id]') ||
    document.querySelector('[data-user-plan-id]') ||
    document.querySelector('#widget-container') || // legacy cancel flow root
    document.querySelector('#banner') || // fallback for banner root
    document.body;

  const attrs = domRoot?.dataset || {};

  // Base user values from DOM
  let user_id = attrs.userId || attrs.user_id;
  let user_subscription_id =
    attrs.userSubscriptionId || attrs.user_subscription_id;
  let user_ltv = attrs.userLtv || attrs.user_ltv;

  // Plan values (may get overridden by Stripe)
  let user_plan_name = attrs.userPlanName || attrs.user_plan_name || undefined;
  let user_plan_id = attrs.userPlanId || attrs.user_plan_id || undefined;
  let user_plan_interval =
    attrs.userPlanInterval || attrs.user_plan_interval || undefined;
  let user_plan_price =
    attrs.userPlanPrice || attrs.user_plan_price || undefined;

  // Pause/reactivation state defaults
  let customer_id = null;
  let is_paused = false;
  let has_upcoming_pause = false;
  let resume_date = null;
  let schedule_id = null;
  let had_recent_subscription = false;

  // If Stripe is configured, prioritize fetching/caching plan info
  if (
    config?.credentials?.gateway === 'stripe' &&
    user_subscription_id &&
    config.account_id
  ) {
    const cacheKey = `subjolt_planinfo_${user_subscription_id}`;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { value } = JSON.parse(cached);
        ({
          customer_id,
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
        const info = await fetchUserPlanInfo(
          user_subscription_id,
          config.account_id,
          config.credentials.stripe_secret_key
        );

        ({
          customer_id,
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

        sessionStorage.setItem(cacheKey, JSON.stringify({ value: info }));
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch or cache plan info from Stripe:', err);
      // Fallback to DOM if Stripe fetch fails
    }
  }

  // Fallback: dataLayer (if present)
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
    customer_id,
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
