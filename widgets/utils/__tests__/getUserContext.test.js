import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../stripeHandlers.js', () => ({
  fetchUserPlanInfo: vi.fn(() => Promise.resolve({
    plan_id: 'cache-plan',
    plan_name: 'Cached',
  }))
}));
import { getUserContext } from '../configHelpers.js';
import * as stripeHandlers from '../stripeHandlers.js';

describe('getUserContext', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('uses cached Stripe plan info when available', async () => {
    const root = document.createElement('div');
    root.dataset.userSubscriptionId = 'sub_1';
    root.dataset.userPlanName = 'Pro';
    document.body.appendChild(root);
    sessionStorage.setItem('subjolt_planinfo_sub_1', JSON.stringify({ plan_id: 'plan123', plan_name: 'Gold' }));
    const result = await getUserContext({ account_id: 'acct', credentials: { gateway: 'stripe', stripe_secret_key: 'sk' } });
    expect(result.user_plan_name).toBe('Gold');
    expect(stripeHandlers.fetchUserPlanInfo).not.toHaveBeenCalled();
  });

  it('fetches plan info when cache missing', async () => {
    const root = document.createElement('div');
    root.dataset.userSubscriptionId = 'sub_2';
    document.body.appendChild(root);
    const result = await getUserContext({ account_id: 'acct', credentials: { gateway: 'stripe', stripe_secret_key: 'sk' } });
    expect(stripeHandlers.fetchUserPlanInfo).toHaveBeenCalled();
    expect(result.user_plan_id).toBe('cache-plan');
  });
});
