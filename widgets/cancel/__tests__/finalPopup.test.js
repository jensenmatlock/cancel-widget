import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.useFakeTimers();
vi.mock('../../utils/tracking.js', () => ({ fireAnalytics: vi.fn() }));
vi.mock('../../utils/logger.js', () => ({ logEvent: vi.fn() }));
vi.mock('../../utils/renderHelpers.js', () => ({ renderPreviewRedirect: vi.fn() }));
vi.mock('../../utils/stripeHandlers.js', () => ({ cancelStripeSubscription: vi.fn(() => Promise.resolve()) }));
vi.mock('../../utils/configHelpers.js', () => ({ getUserContext: vi.fn(() => Promise.resolve({ user_subscription_id: 'sub' })) }));

import { fireAnalytics } from '../../utils/tracking.js';
import { logEvent } from '../../utils/logger.js';
import { renderPreviewRedirect } from '../../utils/renderHelpers.js';
import { cancelStripeSubscription } from '../../utils/stripeHandlers.js';
import { getUserContext } from '../../utils/configHelpers.js';

const analytics = vi.mocked(fireAnalytics);
const logger = vi.mocked(logEvent);
const preview = vi.mocked(renderPreviewRedirect);
const cancel = vi.mocked(cancelStripeSubscription);
const userCtx = vi.mocked(getUserContext);

import { renderFinalMessage } from '../finalPopup.js';

describe('renderFinalMessage', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="widget-container"></div>';
    vi.clearAllMocks();
  });

  it('renders final message and triggers analytics', async () => {
    const config = { account_id: 'a', preview: true, final: { cancel_enabled: false } };
    const state = { selectedReason: 'r', writeInFeedback: 'hi' };
    const copy = { final: {}};
    const promise = renderFinalMessage(config, copy, state);
    await vi.runAllTimersAsync();
    await promise;
    expect(analytics).toHaveBeenCalledWith('cancel_completed', config);
    expect(logger).toHaveBeenCalledWith({
      accountId: 'a',
      step: 'cancel_completed',
      reasonKey: 'r',
      write_in: 'hi',
      config,
    });
    expect(preview).toHaveBeenCalled();
  });
});
