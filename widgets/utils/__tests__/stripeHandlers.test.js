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

  it('cancelPauseSubscription seeds cache', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: { p: 1 } }) });
    await handlers.cancelPauseSubscription('subx', 'sk', 'acct');
    expect(sessionStorage.getItem('subjolt_planinfo_subx')).not.toBeNull();
  });

  it('unpauseNow seeds cache when subscription_id returned', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: { subscription_id: 'suby', plan: 2 } }) });
    await handlers.unpauseNow('cust', 'price', 'sk', 'acct');
    expect(sessionStorage.getItem('subjolt_planinfo_suby')).not.toBeNull();
  });

  it('cancelSchedule seeds cache', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: { subscription_id: 'subz', plan: 3 } }) });
    await handlers.cancelSchedule('sched', 'sk', 'acct');
    expect(sessionStorage.getItem('subjolt_planinfo_subz')).not.toBeNull();
  });

  it('throws error when Stripe call fails', async () => {
    fetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'bad' }) });
    await expect(handlers.applyStripeDiscount('s','c','sk','acct')).rejects.toThrow('bad');
  });
});
