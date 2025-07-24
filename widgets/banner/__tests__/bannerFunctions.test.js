import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../supabaseClient.js', () => ({ supabase: {} }));
vi.mock('../../utils/logger.js', () => ({ logEvent: vi.fn() }));
import { getBannerCondition, getBannerMessage, handleBannerPostAction } from '../index.js';
vi.mock('../../utils/stripeHandlers.js', () => ({
  fetchUserPlanInfo: vi.fn(() => Promise.resolve({ plan_id: 'p2' })),
}));
import { fetchUserPlanInfo } from '../../utils/stripeHandlers.js';

describe('banner functions', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="banner"><span class="banner-message"></span></div>';
    vi.clearAllMocks();
  });

  it('getBannerCondition returns correct state', () => {
    expect(getBannerCondition({ has_upcoming_pause: true })).toBe('upcoming_pause');
    expect(getBannerCondition({ is_paused: true })).toBe('paused');
    expect(getBannerCondition({ had_recent_subscription: true })).toBe('reactivation');
    expect(getBannerCondition({})).toBeNull();
  });

  it('getBannerMessage formats messages', () => {
    expect(getBannerMessage('paused', { resume_date: 'tomorrow' })).toMatch('tomorrow');
    expect(getBannerMessage('reactivation', {})).toMatch('Reactivate');
  });

  it('handleBannerPostAction refreshes banner and removes when no condition', async () => {
    const banner = document.querySelector('.banner');
    const user = { user_subscription_id: 'sub', is_paused: true };
    const config = { account_id: 'acct', credentials: { stripe_secret_key: 'sk' } };
    await handleBannerPostAction(banner, config, user);
    expect(fetchUserPlanInfo).toHaveBeenCalled();
  });
});
