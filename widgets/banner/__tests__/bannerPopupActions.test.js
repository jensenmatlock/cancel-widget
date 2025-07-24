import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../supabaseClient.js', () => ({ supabase: {} }));
vi.mock('../../utils/tracking.js', () => ({ fireAnalytics: vi.fn() }));
vi.mock('../../utils/logger.js', () => ({ logEvent: vi.fn(() => Promise.resolve()) }));
vi.mock('../../utils/stripeHandlers.js', () => ({
  cancelSchedule: vi.fn(() => {
    sessionStorage.setItem('subjolt_planinfo_sub123', JSON.stringify({ plan: 'p' }));
    return Promise.resolve({ data: { subscription_id: 'sub123' } });
  }),
  unpauseNow: vi.fn(() => {
    sessionStorage.setItem('subjolt_planinfo_sub123', JSON.stringify({ plan: 'p' }));
    return Promise.resolve({ data: { subscription_id: 'sub123' } });
  }),
  cancelStripeSubscription: vi.fn(() => Promise.resolve()),
  cancelPauseSubscription: vi.fn(() => Promise.resolve()),
}));

import { renderBannerPopup } from '../bannerPopups.js';
import { fireAnalytics } from '../../utils/tracking.js';
import { logEvent } from '../../utils/logger.js';
import * as stripeHandlers from '../../utils/stripeHandlers.js';

/** Ensure global var so bannerPopups does not throw when referencing bannerEl */
let bannerElement;

describe('banner popups', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
    vi.clearAllMocks();
    bannerElement = null;
    global.bannerEl = bannerElement;
  });

  it('confirming action removes overlay and seeds cache', async () => {
    const config = { account_id: 'acct', credentials: { stripe_secret_key: 'sk' } };
    const user = {
      schedule_id: 'sch_1',
      user_subscription_id: 'sub123',
      customer_id: 'cus_1',
      plan_id: 'plan_1',
    };

    renderBannerPopup('upcoming_pause', config, user);
    const confirmBtn = document.querySelector('#banner-overlay button');
    await confirmBtn.onclick();

    expect(stripeHandlers.cancelSchedule).toHaveBeenCalled();
    expect(document.getElementById('banner-overlay')).toBeNull();
    expect(sessionStorage.getItem('subjolt_planinfo_sub123')).not.toBeNull();
    expect(fireAnalytics).toHaveBeenCalledWith('popup_confirm_upcoming_pause', config);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'acct',
        step: 'popup_confirm_upcoming_pause',
        reasonKey: 'upcoming_pause',
      })
    );
  });

  it('canceling action removes overlay and logs event', () => {
    const config = { account_id: 'acct' };

    renderBannerPopup('upcoming_pause', config, {});
    const cancelBtn = document.querySelectorAll('#banner-overlay button')[1];
    cancelBtn.onclick();

    expect(stripeHandlers.cancelSchedule).not.toHaveBeenCalled();
    expect(document.getElementById('banner-overlay')).toBeNull();
    expect(fireAnalytics).toHaveBeenCalledWith('popup_cancel_upcoming_pause', config);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'acct',
        step: 'popup_cancel_upcoming_pause',
        reasonKey: 'upcoming_pause',
      })
    );
  });
});
