import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/tracking.js', () => ({ fireAnalytics: vi.fn() }));
vi.mock('../../utils/logger.js', () => ({ logEvent: vi.fn() }));
vi.mock('../../utils/handleSaveMechanism.js', () => ({ handleSaveMechanism: vi.fn(() => Promise.resolve({ handled: true })) }));
vi.mock('../../utils/configHelpers.js', () => ({ getUserContext: vi.fn(() => Promise.resolve({ user_plan_id: 'p1', user_plan_interval: 'month', user_subscription_id: 'sub' })) }));
vi.mock('../successPopup.js', () => ({ renderSuccessPopup: vi.fn() }));

import { fireAnalytics } from '../../utils/tracking.js';
import { logEvent } from '../../utils/logger.js';
import { handleSaveMechanism } from '../../utils/handleSaveMechanism.js';
import { getUserContext } from '../../utils/configHelpers.js';
import { renderSuccessPopup } from '../successPopup.js';
const analytics = vi.mocked(fireAnalytics);
const logger = vi.mocked(logEvent);
const saveMechanism = vi.mocked(handleSaveMechanism);
const userCtx = vi.mocked(getUserContext);
const successPopup = vi.mocked(renderSuccessPopup);
const nextStep = vi.fn();

import { renderDiscountPopup } from '../discountPopup.js';
import { renderPausePopup } from '../pausePopup.js';
import { renderPlanSwitchPopup } from '../planSwitchPopup.js';
import { renderBillingCycleSwitchPopup } from '../billingCycleSwitchPopup.js';
import { renderUserFeedbackPopup } from '../userFeedbackPopup.js';

describe('popup callbacks', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="widget-container"></div><div id="cancel-overlay"></div>';
    document.body.classList.add('widget-active');
    vi.clearAllMocks();
  });

  it('discount popup apply and continue actions', async () => {
    const state = { currentStepIndex: 0, selectedReason: 'r' };
    await renderDiscountPopup({}, { amount: '10%', duration: '1m' }, { account_id: 'a' }, {}, state, nextStep);
    const buttons = document.querySelectorAll('button');
    await buttons[0].click();
    await Promise.resolve();
    await Promise.resolve();
    expect(analytics).toHaveBeenCalledWith('discount_selected', { account_id: 'a' });
    expect(successPopup).toHaveBeenCalled();

    await buttons[1].click();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(analytics).toHaveBeenCalledWith('discount_skipped', { account_id: 'a' });
    expect(state.currentStepIndex).toBe(1);
    expect(nextStep).toHaveBeenCalled();
  });

  it('pause popup apply and continue actions', async () => {
    const state = { currentStepIndex: 0, selectedReason: 'r' };
    await renderPausePopup({}, { durations: [1] }, { account_id: 'a' }, {}, state, nextStep);
    const buttons = document.querySelectorAll('button');
    await buttons[0].click();
    await Promise.resolve();
    await Promise.resolve();
    expect(analytics).toHaveBeenCalledWith('pause_selected', { account_id: 'a' });
    expect(successPopup).toHaveBeenCalled();

    await buttons[1].click();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(analytics).toHaveBeenCalledWith('pause_skipped', { account_id: 'a' });
    expect(state.currentStepIndex).toBe(1);
    expect(nextStep).toHaveBeenCalled();
  });

  it('plan switch popup apply and continue actions', async () => {
    const state = { currentStepIndex: 0, selectedReason: 'r' };
    const plans = [
      { id: 'p1', name: 'A', price: '$20', interval: 'month' },
      { id: 'p2', name: 'B', price: '$10', interval: 'month' },
    ];
    await renderPlanSwitchPopup({}, { plans }, { account_id: 'a' }, {}, state, nextStep);
    const buttons = document.querySelectorAll('button');
    await buttons[0].click();
    await Promise.resolve();
    await Promise.resolve();
    expect(analytics).toHaveBeenCalledWith('plan_switch_selected', { account_id: 'a' });
    expect(successPopup).toHaveBeenCalled();

    await buttons[1].click();
    await Promise.resolve();
    await Promise.resolve();
    expect(analytics).toHaveBeenCalledWith('plan_switch_skipped', { account_id: 'a' });
    expect(state.currentStepIndex).toBe(1);
    expect(nextStep).toHaveBeenCalled();
  });

  it('billing cycle switch popup apply and continue actions', async () => {
    const state = { currentStepIndex: 0, selectedReason: 'r' };
    const plans = [
      { id: 'p1', name: 'A Yearly', price: '$30', interval: 'year' },
      { id: 'p2', name: 'A Monthly', price: '$20', interval: 'month' },
    ];
    await renderBillingCycleSwitchPopup({}, { plans }, { account_id: 'a' }, {}, state, nextStep);
    const buttons = document.querySelectorAll('button');
    await buttons[0].click();
    await Promise.resolve();
    await Promise.resolve();
    expect(analytics).toHaveBeenCalledWith('billing_cycle_switch_selected', { account_id: 'a' });
    expect(successPopup).toHaveBeenCalled();

    await buttons[1].click();
    await Promise.resolve();
    expect(analytics).toHaveBeenCalledWith('billing_cycle_switch_skipped', { account_id: 'a' });
    expect(state.currentStepIndex).toBe(1);
    expect(nextStep).toHaveBeenCalled();
  });

  it('user feedback popup exit and continue actions', async () => {
    const state = { currentStepIndex: 0, selectedReason: 'r', writeInFeedback: null };
    await renderUserFeedbackPopup({}, { account_id: 'a' }, {}, state, nextStep);
    const buttons = document.querySelectorAll('button');
    await buttons[0].click();
    expect(analytics).toHaveBeenCalledWith('user_feedback_exit', { account_id: 'a' });
    expect(document.getElementById('widget-container')).toBeNull();
    expect(document.body.classList.contains('widget-active')).toBe(false);

    document.body.innerHTML = '<div id="widget-container"></div><div id="cancel-overlay"></div>';
    document.body.classList.add('widget-active');
    await renderUserFeedbackPopup({}, { account_id: 'a' }, {}, state, nextStep);
    const contButtons = document.querySelectorAll('button');
    const textarea = document.querySelector('textarea');
    textarea.value = 'hello';
    await contButtons[1].click();
    await Promise.resolve();
    await Promise.resolve();
    expect(analytics).toHaveBeenCalledWith('user_feedback_continue', { account_id: 'a' });
    expect(state.writeInFeedback).toBe('hello');
    expect(state.currentStepIndex).toBe(1);
    expect(nextStep).toHaveBeenCalled();
  });
});
