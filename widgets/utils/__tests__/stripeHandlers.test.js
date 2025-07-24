import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as handlers from '../stripeHandlers.js';

global.fetch = vi.fn();

describe('stripeHandlers', () => {
  beforeEach(() => {
    fetch.mockReset();
    sessionStorage.clear();
  });

  it('applyStripeDiscount posts correct payload', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    await handlers.applyStripeDiscount('sub', 'coupon', 'sk', 'acct');
    const call = fetch.mock.calls[0];
    expect(JSON.parse(call[1].body)).toEqual({
      action: 'apply_discount',
      data: { subscription_id: 'sub', coupon_id: 'coupon', stripe_key: 'sk', account_id: 'acct' },
    });
  });

  it('switchStripePlan seeds cache', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: { plan: 'p' } }) });
    await handlers.switchStripePlan('sub', 'price', 'sk', 'acct');
    const cache = sessionStorage.getItem('subjolt_planinfo_sub');
    expect(cache).not.toBeNull();
  });
});
