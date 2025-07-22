import {
  createHeadline,
  createSubheadline,
  createButton,
} from '../utils/domHelpers.js';
import { getButtonClass } from '../utils/buttonStyles.js';
import { fireAnalytics } from '../utils/tracking.js';
import { logEvent } from '../utils/logger.js';
import {
  cancelPauseSubscription,
  cancelSchedule,
  unpauseNow,
  cancelStripeSubscription,
} from '../utils/stripeHandlers.js';
import { handleBannerPostAction } from './index.js'; // <-- added import to refresh banner state

/**
 * Renders a popup for managing pause/reactivation states.
 * @param {string} condition - 'upcoming_pause', 'paused', or 'reactivation'
 * @param {object} config - Account-level config object
 * @param {object} userContext - Current subscription/user state
 * @param {HTMLElement} bannerEl - The live banner element (so we can refresh/remove it)
 */

export function renderBannerPopup(
  condition,
  config,
  userContext,
  onActionComplete
) {
  const overlay = document.createElement('div');
  overlay.id = 'banner-overlay';
  overlay.className = 'banner-overlay';

  const container = document.createElement('div');
  container.className = 'banner-container';

  const wrapper = document.createElement('div');
  wrapper.className = 'popup-content';

  const headline = createHeadline(getPopupHeadline(condition));
  const subheadline = createSubheadline(
    getPopupSubheadline(condition, userContext)
  );

  const confirmBtn = createButton(
    getConfirmLabel(condition),
    getButtonClass('primary', config),
    async () => {
      try {
        await handleConfirmAction(condition, config, userContext);
        fireAnalytics(`popup_confirm_${condition}`, config);
        logEvent({
          accountId: config.account_id,
          step: `popup_confirm_${condition}`,
          reasonKey: condition,
          config,
        });
        if (bannerEl) {
          await handleBannerPostAction(bannerEl, config, userContext);
        }
      } catch (err) {
        console.error(`Error handling ${condition} confirm:`, err);
      } finally {
        overlay.remove();
        container.remove();
      }
    }
  );

  const cancelBtn = createButton(
    'Cancel',
    getButtonClass('secondary', config),
    () => {
      fireAnalytics(`popup_cancel_${condition}`, config);
      logEvent({
        accountId: config.account_id,
        step: `popup_cancel_${condition}`,
        reasonKey: condition,
        config,
      });
      overlay.remove();
      container.remove();
    }
  );

  const buttonRow = document.createElement('div');
  buttonRow.className = 'button-row'; // shared cancel widget class

  if (condition === 'paused') {
    const cancelSubBtn = createButton(
      'Cancel Subscription',
      getButtonClass('danger', config),
      async () => {
        try {
          await cancelStripeSubscription(
            userContext.user_subscription_id,
            config.credentials?.stripe_secret_key,
            config.account_id
          );
          fireAnalytics('popup_cancel_subscription', config);
          logEvent({
            accountId: config.account_id,
            step: 'popup_cancel_subscription',
            reasonKey: 'paused_cancel',
            config,
          });
          if (bannerEl) {
            await handleBannerPostAction(bannerEl, config, userContext);
          }
        } catch (err) {
          console.error(
            'Error cancelling subscription from paused banner:',
            err
          );
        } finally {
          overlay.remove();
          container.remove();
        }
      }
    );
    buttonRow.append(cancelSubBtn);
  }

  buttonRow.append(confirmBtn, cancelBtn);
  wrapper.append(headline, subheadline, buttonRow);
  container.appendChild(wrapper);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

function getPopupHeadline(condition) {
  switch (condition) {
    case 'upcoming_pause':
      return 'Cancel Your Scheduled Pause?';
    case 'paused':
      return 'Manage Paused Subscription';
    case 'reactivation':
      return 'Reactivate Subscription?';
    default:
      return 'Manage Subscription';
  }
}

function getPopupSubheadline(condition, user) {
  const dateText = user?.resume_date || 'soon';
  switch (condition) {
    case 'upcoming_pause':
      return `Your plan will pause soon. Would you like to cancel the scheduled pause?`;
    case 'paused':
      return `Your plan is currently paused and will resume ${dateText}. You can unpause now or cancel entirely.`;
    case 'reactivation':
      return `You had an active subscription recently. Would you like to reactivate your plan today?`;
    default:
      return '';
  }
}

function getConfirmLabel(condition) {
  switch (condition) {
    case 'upcoming_pause':
      return 'Cancel Pause';
    case 'paused':
      return 'Unpause Now';
    case 'reactivation':
      return 'Reactivate Now';
    default:
      return 'Confirm';
  }
}

async function handleConfirmAction(condition, config, userContext) {
  const { schedule_id, user_subscription_id, customer_id, plan_id } =
    userContext;

  switch (condition) {
    case 'upcoming_pause':
      await cancelSchedule(
        schedule_id,
        config.credentials?.stripe_secret_key,
        config.account_id
      );
      break;
    case 'paused':
      await unpauseNow(
        customer_id,
        plan_id,
        config.credentials?.stripe_secret_key,
        config.account_id
      );
      break;
    case 'reactivation':
      await unpauseNow(
        customer_id,
        plan_id || userContext.user_plan_id,
        config.credentials?.stripe_secret_key,
        config.account_id
      );
      break;
    default:
      console.warn(`No Stripe action configured for ${condition}`);
  }
}
