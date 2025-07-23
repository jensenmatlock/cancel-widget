import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../stripeHandlers.js', () => {
  return {
    applyStripeDiscount: vi.fn(() => Promise.resolve()),
    pauseStripeSubscription: vi.fn(() => Promise.resolve({ handled: true })),
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

  it('returns URL preview for discount', async () => {
    const config = { user_subscription_id: 'sub_456' };
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
      extra: { promo_code: 'CODE' },
    });

    expect(result).toEqual({
      handled: true,
      preview: true,
      method: 'URL',
      gateway: 'URL',
      action: 'discount',
      redirectUrl: 'https://example.com?sub=sub_456&code=CODE',
    });
  });
});
