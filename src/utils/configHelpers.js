export function getUserContext() {
  const container = document.getElementById("widget-container");
  const attrs = container?.dataset || {};

  // Read from HTML data attributes first
  let user_id = attrs.userId;
  let user_plan = attrs.userPlan;
  let user_plan_interval = attrs.userPlanInterval
  let user_ltv = attrs.userLtv;

  // If not found, fallback to dataLayer
  if (!user_id && window.dataLayer) {
    const latest = window.dataLayer.slice().reverse().find(entry => entry.user_id);
    if (latest) {
      user_id = latest.user_id || user_id;
      user_plan = latest.user_plan || user_plan;
      user_plan_interval = latest.user_plan_interval || user_plan_interval;
	  user_ltv = latest.user_ltv || user_ltv;
    }
  }

  return {
    user_id,
    user_plan,
	user_plan_interval,
    user_ltv
  };
}
