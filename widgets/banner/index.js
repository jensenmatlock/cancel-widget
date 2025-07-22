import { applyTheme } from '../utils/applyTheme.js';
import { createButton } from '../utils/domHelpers.js';
import { getButtonClass } from '../utils/buttonStyles.js';
import { fireAnalytics } from '../utils/tracking.js';
import { logEvent } from '../utils/logger.js';
import { renderBannerPopup } from './bannerPopups.js';
import { fetchUserPlanInfo } from '../utils/stripeHandlers.js';

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

  // Primary action button (opens popup)
  const actionBtn = createButton(
    getActionLabel(condition),
    getButtonClass('primary', config),
    () => {
      renderBannerPopup(condition, config, userContext, () => {
        // Optional callback if we want to reload or refetch state after popup action
        console.log(`Action completed for ${condition}`);
      });
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
  closeIcon.innerHTML = '&times;'; // × symbol
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

  // Inject at top of page
  document.body.prepend(banner);

  fireAnalytics('banner_shown', config);
  logEvent({
    accountId: config.account_id,
    step: 'banner_shown',
    reasonKey: condition,
    config,
  });
}

function getBannerCondition(user) {
  if (user?.has_upcoming_pause) return 'upcoming_pause';
  if (user?.is_paused) return 'paused';
  if (user?.had_recent_subscription) return 'reactivation';
  return null;
}

function getBannerMessage(condition, user) {
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

// Called after any popup-confirmed action to refresh state and hide/update banner
async function handleBannerPostAction(banner, config, userContext) {
  try {
    const { user_subscription_id } = userContext;
    if (user_subscription_id) {
      const newInfo = await fetchUserPlanInfo(
        user_subscription_id,
        config.account_id,
        config.credentials?.stripe_secret_key
      );

      // Update userContext with latest state
      Object.assign(userContext, newInfo);

      // Decide whether to hide or update banner based on new state
      const newCondition = getBannerCondition(userContext);
      if (!newCondition) {
        banner.remove(); // User no longer needs a banner
      } else {
        // Update banner message dynamically if state changes but banner still relevant
        const message = banner.querySelector('.banner-message');
        if (message) {
          message.textContent = getBannerMessage(newCondition, userContext);
        }
      }
    } else {
      // No active subscription after action — remove banner entirely
      banner.remove();
    }
  } catch (err) {
    console.error('Error refreshing banner state:', err);
    // As a fallback, remove the banner to avoid showing stale state
    banner.remove();
  }
}
