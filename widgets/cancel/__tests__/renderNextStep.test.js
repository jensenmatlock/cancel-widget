import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../discountPopup.js', () => ({ renderDiscountPopup: vi.fn() }));
vi.mock('../pausePopup.js', () => ({ renderPausePopup: vi.fn() }));
vi.mock('../planSwitchPopup.js', () => ({ renderPlanSwitchPopup: vi.fn() }));
vi.mock('../billingCycleSwitchPopup.js', () => ({ renderBillingCycleSwitchPopup: vi.fn() }));
vi.mock('../userFeedbackPopup.js', () => ({ renderUserFeedbackPopup: vi.fn() }));
vi.mock('../finalPopup.js', () => ({ renderFinalMessage: vi.fn() }));
vi.mock('../../utils/logger.js', () => ({ logEvent: vi.fn() }));
vi.mock('../../utils/tracking.js', () => ({ fireAnalytics: vi.fn() }));

import { renderDiscountPopup } from '../discountPopup.js';
import { renderPausePopup } from '../pausePopup.js';
import { renderPlanSwitchPopup } from '../planSwitchPopup.js';
import { renderBillingCycleSwitchPopup } from '../billingCycleSwitchPopup.js';
import { renderUserFeedbackPopup } from '../userFeedbackPopup.js';
import { renderFinalMessage } from '../finalPopup.js';
import { renderNextStep } from '../reasonPopup.js';

const discountMock = vi.mocked(renderDiscountPopup);
const pauseMock = vi.mocked(renderPausePopup);
const planMock = vi.mocked(renderPlanSwitchPopup);
const billingMock = vi.mocked(renderBillingCycleSwitchPopup);
const feedbackMock = vi.mocked(renderUserFeedbackPopup);
const finalMock = vi.mocked(renderFinalMessage);

describe('renderNextStep', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="widget-container"></div>';
    discountMock.mockClear();
    pauseMock.mockClear();
    planMock.mockClear();
    billingMock.mockClear();
    feedbackMock.mockClear();
    finalMock.mockClear();
  });

  it('invokes discount popup renderer', () => {
    const state = { currentStepIndex: 0, currentStepSet: [{ type: 'discount.offer' }] };
    renderNextStep({}, {}, state);
    expect(discountMock).toHaveBeenCalled();
  });

  it('invokes pause popup renderer', () => {
    const state = { currentStepIndex: 0, currentStepSet: [{ type: 'pause.default' }] };
    renderNextStep({}, {}, state);
    expect(pauseMock).toHaveBeenCalled();
  });

  it('handles unknown step type and shows final message', () => {
    const state = { currentStepIndex: 0, currentStepSet: [{ type: 'unknown' }] };
    renderNextStep({}, {}, state);
    expect(finalMock).toHaveBeenCalled();
    expect(state.currentStepIndex).toBe(1);
  });

  it('renders final message when no steps left', () => {
    const state = { currentStepIndex: 0, currentStepSet: [] };
    renderNextStep({}, {}, state);
    expect(finalMock).toHaveBeenCalled();
  });
});
