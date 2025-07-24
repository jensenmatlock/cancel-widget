import { getCopy } from '../utils/getCopy.js';
import { renderPreviewRedirect } from '../utils/renderHelpers.js';
import { getUserContext } from '../utils/configHelpers.js';
import { cancelStripeSubscription } from '../utils/stripeHandlers.js';
import { fireAnalytics } from '../utils/tracking.js';
import { logEvent } from '../utils/logger.js';

export async function renderFinalMessage(config, copy, state) {
  const container = document.getElementById('widget-container');
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'popup-content';

  const headline = document.createElement('h2');
  headline.textContent = getCopy('final.headline', config);

  const subheadline = document.createElement('p');
  subheadline.textContent = getCopy('final.subheadline', config);

  wrapper.append(headline, subheadline);
  container.appendChild(wrapper);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const user = await getUserContext(config);
  const gateway = config?.credentials?.gateway;

  if (!config.preview && config.final?.cancel_enabled && gateway === 'stripe') {
    try {
      await cancelStripeSubscription(
        user.user_subscription_id,
        config.credentials.stripe_secret_key,
        config.account_id
      );
    } catch (err) {
      console.error('❌ Failed to cancel subscription:', err);
    }
  }

  // ✅ Clear plan info cache after cancellation
  const cacheKey = `subjolt_planinfo_${user.user_subscription_id}`;
  sessionStorage.removeItem(cacheKey);

  await delay(3000);

  fireAnalytics('cancel_completed', config);
  await logEvent({
    accountId: config.account_id,
    step: 'cancel_completed',
    reasonKey: state?.selectedReason,
    write_in: state?.writeInFeedback || null,
    config,
  });

  if (config.preview) {
    renderPreviewRedirect();
  } else if (config.final?.redirect_template) {
    let redirectUrl = config.final.redirect_template;
    redirectUrl = redirectUrl.replace(
      '{{user_id}}',
      encodeURIComponent(config.user_id || '')
    );
    window.location.href = redirectUrl;
  } else {
    document.getElementById('widget-container')?.remove();
    document.getElementById('cancel-overlay')?.remove();
    document.body.classList.remove('widget-active');
  }
}
