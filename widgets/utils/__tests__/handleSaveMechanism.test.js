import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../stripeHandlers.js', () => {
  return {
    applyStripeDiscount: vi.fn(() => Promise.resolve()),
    pauseStripeSubscription: vi.fn(() => Promise.resolve({ handled: true, resume_date: 'next' })),
    switchStripePlan: vi.fn(() => Promise.resolve()),
  };
});

import { handleSaveMechanism } from '../handleSaveMechanism.js';
import * as stripeHandlers from '../stripeHandlers.js';

describe('handleSaveMechanism', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles discount via Stripe', async () => {
    const config = {
      credentials: { stripe_secret_key: 'sk' },
      account_id: 'acct',
    };
    const settings = {
      method: 'Payment Gateway',
      gateway: 'stripe',
      promo_code: 'SAVE',
    };
    const userContext = {
      user_subscription_id: 'sub_123',
      user_plan_name: 'Pro',
    };

    const result = await handleSaveMechanism({
      type: 'discount',
      config,
      settings,
      userContext,
    });

    expect(stripeHandlers.applyStripeDiscount).toHaveBeenCalledWith(
      'sub_123',
      'SAVE',
      'sk',
      'acct'
    );
    expect(result.handled).toBe(true);
    expect(result.shown).toBe('success');
    expect(result.contextVars.from_name).toBe('Pro');
  });

  it('returns URL preview for discount with encoded values', async () => {
    const config = { user_subscription_id: 'sub 456' };
    const settings = {
      method: 'URL',
      redirect_template:
        'https://example.com?sub={{user_subscription_id}}&code={{promo_code}}',
    };
    const result = await handleSaveMechanism({
      type: 'discount',
      config,
      settings,
      userContext: {},
      preview: true,
      extra: { promo_code: 'CODE+PLUS' },
    });

    expect(result).toEqual({
      handled: true,
      preview: true,
      method: 'URL',
      gateway: 'URL',
      action: 'discount',
      redirectUrl: 'https://example.com?sub=sub%20456&code=CODE%2BPLUS',
    });
  });

  it('handles pause action via Stripe', async () => {
    const config = { credentials: { stripe_secret_key: 'sk' }, account_id: 'acct' };
    const settings = { method: 'Payment Gateway', gateway: 'stripe' };
    const userContext = { user_subscription_id: 'sub_1' };
    const result = await handleSaveMechanism({ type: 'pause', config, settings, userContext, extra: { pause_duration: 2 } });
    expect(stripeHandlers.pauseStripeSubscription).toHaveBeenCalled();
    expect(result.handled).toBe(true);
  });

  it('returns error when missing price_id for plan switch', async () => {
    const config = { credentials: { stripe_secret_key: 'sk' }, account_id: 'acct' };
    const settings = { method: 'Payment Gateway', gateway: 'stripe' };
    const userContext = { user_subscription_id: 'sub_1' };
    const result = await handleSaveMechanism({ type: 'plan_switch', config, settings, userContext });
    expect(result.handled).toBe(false);
  });
});
