import { applyTheme } from '../utils/applyTheme.js';
import { createButton } from '../utils/domHelpers.js';
import { getButtonClass } from '../utils/buttonStyles.js';
import { fireAnalytics } from '../utils/tracking.js';
import { logEvent } from '../utils/logger.js';
import { renderBannerPopup } from './bannerPopups.js';
import { fetchUserPlanInfo } from '../utils/stripeHandlers.js';

/**
 * Loads the top-of-page subscription banner for pause/reactivation states.
 */
export function loadBannerWidget(config, userContext) {
  applyTheme(config);

  const condition = getBannerCondition(userContext);
  if (!condition || sessionStorage.getItem('banner_dismissed')) return;

  const banner = document.createElement('div');
  banner.id = 'banner';
  banner.className = `banner banner-${condition}`;

  const message = document.createElement('span');
  message.className = 'banner-message';
  message.textContent = getBannerMessage(condition, userContext);
  banner.appendChild(message);

  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'banner-buttons';

  const actionBtn = createButton(
    getActionLabel(condition),
    getButtonClass('primary', config),
    () => {
      renderBannerPopup(condition, config, userContext, banner); // Pass banner element
      fireAnalytics('banner_action_clicked', config);
      logEvent({
        accountId: config.account_id,
        step: 'banner_action_clicked',
        reasonKey: condition,
        config,
      });
    }
  );

  buttonGroup.appendChild(actionBtn);
  banner.appendChild(buttonGroup);

  // Close (dismiss) icon
  const closeIcon = document.createElement('span');
  closeIcon.className = 'banner-close';
  closeIcon.innerHTML = '&times;';
  closeIcon.addEventListener('click', () => {
    banner.remove();
    sessionStorage.setItem('banner_dismissed', 'true');
    fireAnalytics('banner_dismissed', config);
    logEvent({
      accountId: config.account_id,
      step: 'banner_dismissed',
      reasonKey: condition,
      config,
    });
  });
  banner.appendChild(closeIcon);

  document.body.prepend(banner);

  fireAnalytics('banner_shown', config);
  logEvent({
    accountId: config.account_id,
    step: 'banner_shown',
    reasonKey: condition,
    config,
  });
}

export function getBannerCondition(user) {
  if (user?.has_upcoming_pause) return 'upcoming_pause';
  if (user?.is_paused) return 'paused';
  if (user?.had_recent_subscription) return 'reactivation';
  return null;
}

export function getBannerMessage(condition, user) {
  const dateText = user?.resume_date || 'soon';
  switch (condition) {
    case 'upcoming_pause':
      return `Your subscription will pause at the end of your billing cycle.`;
    case 'paused':
      return `Your subscription is paused and will resume ${dateText}.`;
    case 'reactivation':
      return `Reactivate your subscription and continue where you left off.`;
    default:
      return '';
  }
}

function getActionLabel(condition) {
  switch (condition) {
    case 'upcoming_pause':
      return 'Manage Pause';
    case 'paused':
      return 'Unpause';
    case 'reactivation':
      return 'Reactivate';
    default:
      return 'Manage';
  }
}

/**
 * Called after any popup-confirmed action to refresh state or remove the banner.
 */
export async function handleBannerPostAction(banner, config, userContext) {
  try {
    const { user_subscription_id } = userContext;
    if (user_subscription_id) {
      const newInfo = await fetchUserPlanInfo(
        user_subscription_id,
        config.account_id,
        config.credentials?.stripe_secret_key
      );

      Object.assign(userContext, newInfo);

      const newCondition = getBannerCondition(userContext);
      if (!newCondition) {
        banner.remove();
      } else {
        const message = banner.querySelector('.banner-message');
        if (message) {
          message.textContent = getBannerMessage(newCondition, userContext);
        }
      }
    } else {
      banner.remove(); // No active subscription
    }
  } catch (err) {
    console.error('Error refreshing banner state:', err);
    banner.remove(); // Fallback to avoid stale banner
  }
}
