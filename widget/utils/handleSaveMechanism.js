import {
  applyStripeDiscount,
  pauseStripeSubscription,
  switchStripePlan,
} from './stripeHandlers.js';

export async function handleSaveMechanism({
  type,
  config,
  settings,
  userContext,
  preview,
  extra = {},
  state,
}) {
  const method = settings?.method;

  if (method === 'URL') {
    let redirectUrl = settings.redirect_template || '';

    switch (type) {
      case 'discount':
        redirectUrl = redirectUrl
          .replace(
            '{{user_subscription_id}}',
            config.user_subscription_id || ''
          )
          .replace('{{promo_code}}', extra?.promo_code || '');
        break;

      case 'pause':
        redirectUrl = redirectUrl
          .replace(
            '{{user_subscription_id}}',
            config.user_subscription_id || ''
          )
          .replace('{{pause_duration}}', extra?.duration?.toString() || '');
        break;

      case 'plan_switch':
      case 'billing_cycle_switch':
        redirectUrl = redirectUrl
          .replace(
            '{{user_subscription_id}}',
            config.user_subscription_id || ''
          )
          .replace('{{plan_id}}', settings.price_id || '');
        break;
    }

    if (preview) {
      return {
        handled: true,
        preview: true,
        method,
        gateway: 'URL',
        action: getActionName(type),
        redirectUrl,
      };
    }

    return {
      handled: true,
      redirectUrl,
    };
  }

  if (method === 'Payment Gateway') {
    const gateway = settings?.gateway?.toLowerCase();

    if (preview) {
      return {
        handled: true,
        preview: true,
        method,
        gateway,
        action: getActionName(type),
      };
    }

    switch (gateway) {
      case 'stripe': {
        const result = await handleStripeAction(
          type,
          config,
          settings,
          userContext,
          extra
        );

        if (result?.handled) {
          if (result.redirectUrl) {
            return { handled: true, redirectUrl: result.redirectUrl };
          } else {
            const contextVars = {
              ...extra,
              from_name: userContext.user_plan_name || '',
              to_name: extra?.plan_to || '',
              pause_duration: extra?.duration || '',
              amount: settings.amount || '',
              duration: settings.duration || '',
            };

            return { handled: true, shown: 'success' };
          }
        }

        return { handled: false };
      }

      default:
        console.warn(`❌ Unsupported payment gateway: ${gateway}`);
        return { handled: false };
    }
  }

  return { handled: false };
}

function getActionName(type) {
  switch (type) {
    case 'discount':
      return 'discount';
    case 'pause':
      return 'subscription pause';
    case 'plan_switch':
      return 'plan switch';
    case 'billing_cycle_switch':
      return 'billing cycle switch';
    default:
      return 'save mechanism';
  }
}

async function handleStripeAction(
  type,
  config,
  settings,
  userContext,
  extra = {}
) {
  const { user_subscription_id, user_plan_id } = userContext;

  try {
    switch (type) {
      case 'discount':
        if (!settings.promo_code)
          throw new Error('Missing promo_code in config');
        await applyStripeDiscount(
          user_subscription_id,
          settings.promo_code,
          config.credentials?.stripe_secret_key,
          config.account_id
        );
        return { handled: true };

      case 'pause':
        await pauseStripeSubscription(
          user_subscription_id,
          config.credentials?.stripe_secret_key,
          config.account_id
        );
        return { handled: true };

      case 'plan_switch':
        if (!settings.price_id) throw new Error('Missing price_id in settings');
        await switchStripePlan(
          user_subscription_id,
          settings.price_id,
          config.credentials?.stripe_secret_key,
          config.account_id
        );
        return { handled: true };

      case 'billing_cycle_switch':
        if (!settings.price_id) throw new Error('Missing price_id in settings');
        await switchStripePlan(
          user_subscription_id,
          settings.price_id,
          config.credentials?.stripe_secret_key,
          config.account_id,
          'now'
        );
        return { handled: true };

      default:
        console.warn('🔧 Unhandled Stripe action type:', type);
        return { handled: false };
    }
  } catch (err) {
    console.error(`🚨 Stripe ${type} failed:`, err);
    return { handled: false, error: err.message };
  }
}
