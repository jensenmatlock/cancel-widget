import { renderDiscountPopup } from './discountPopup.js';
import { renderPausePopup } from './pausePopup.js';
import { renderPlanSwitchPopup } from './planSwitchPopup.js';
import { renderUserFeedbackPopup } from './userFeedbackPopup.js';
import { renderBillingCycleSwitchPopup } from './billingCycleSwitchPopup.js';
import { renderFinalMessage } from './finalPopup.js';
import {
  createHeadline,
  createSubheadline,
  createButton,
} from '../utils/domHelpers.js';
import { getCopy } from '../utils/getCopy.js';
import { applyTheme } from '../utils/applyTheme.js';
import { getButtonClass } from '../utils/buttonStyles.js';
import { renderPreviewRedirect } from '../utils/renderHelpers.js';
import { fireAnalytics } from '../utils/tracking.js';
import { logEvent } from '../utils/logger.js';

export async function loadCancelFlow(config) {
  await applyTheme(config); // wait for font load
  const state = {
    selectedReason: null,
    currentStepIndex: 0,
    currentStepSet: [],
    writeInFeedback: null,
  };
  renderInitialPopup(config, state);
}

function renderInitialPopup(config, state) {
  const overlay = document.createElement('div');
  overlay.id = 'cancel-overlay';
  overlay.className = 'cancel-overlay';

  const container = document.getElementById('widget-container');
  container.innerHTML = '';

  const copy = config.copy || {};
  const headline = createHeadline(getCopy('general.headline', config));
  const subheadline = createSubheadline(getCopy('general.subheadline', config));

  const reasonWrapper = document.createElement('div');
  reasonWrapper.className = 'reason-list';

  const cancelReasons = config.flow.cancel_reasons || [];
  const reasonLabels = config.copy?.cancel_reasons || {};

  cancelReasons.forEach((reasonKey) => {
    const label = document.createElement('label');

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'cancel_reason';
    input.value = reasonKey;

    input.addEventListener('change', () => {
      state.selectedReason = reasonKey;
      console.log('Selected reason:', reasonKey);
    });

    label.appendChild(input);
    label.append(` ${reasonLabels[reasonKey] || reasonKey}`);
    reasonWrapper.appendChild(label);
  });

  const exitBtn = createButton(
    getCopy('general.cta_primary', config),
    getButtonClass('primary', config),
    async () => {
      fireAnalytics('reason_exit', config);
      await logEvent({
        accountId: config.account_id,
        step: 'reason_exit',
        config,
      });

      if (config.preview) {
        renderPreviewRedirect(); // will show "closing widget" fallback
      } else {
        document.getElementById('widget-container')?.remove();
        document.getElementById('cancel-overlay')?.remove();
        document.body.classList.remove('widget-active');
      }
    }
  );

  const continueBtn = createButton(
    getCopy('general.cta_secondary', config),
    getButtonClass('secondary', config),
    async () => {
      if (!state.selectedReason) {
        console.warn('No reason selected');
        return;
      }

      const reasonLogic = config.flow.logic.find(
        (entry) => entry.reasonKey === state.selectedReason
      );
      const steps = reasonLogic?.steps || [];
      console.log('Configured steps for selected reason:', steps);

      state.currentStepSet = steps.filter((step) => {
        if (step.enabled === false) return false;
        const [type] = step.type.split('.');
        if (type === 'discount' && config.discount?.enabled === false)
          return false;
        if (type === 'pause' && config.pause?.enabled === false) return false;
        if (type === 'plan_switch' && config.plan_switch?.enabled === false)
          return false;
        if (
          type === 'billing_cycle_switch' &&
          config.billing_cycle_switch?.enabled === false
        )
          return false;
        return true;
      });

      state.currentStepIndex = 0;

      if (state.currentStepSet.length === 0) {
        console.warn('No enabled steps found — staying on page (debug mode)');
        return;
      }

      fireAnalytics('reason_continue', config);
      await logEvent({
        accountId: config.account_id,
        step: 'reason_continue',
        reasonKey: state.selectedReason,
        config,
      });

      renderNextStep(config, config.copy, state);
    }
  );

  const buttonRow = document.createElement('div');
  buttonRow.className = 'button-row';
  buttonRow.append(exitBtn, continueBtn);

  container.append(headline, subheadline, reasonWrapper, buttonRow);
  document.body.appendChild(overlay);
}

function renderNextStep(config, copy, state) {
  const step = state.currentStepSet[state.currentStepIndex];
  if (!step) {
    renderFinalMessage(config, copy, state);
    return;
  }

  const goNext = () => renderNextStep(config, copy, state);
  const [baseType, subType] = step.type.split('.');
  const renderer = stepRenderers[baseType];

  if (renderer) {
    if (baseType === 'user_feedback') {
      const messageId = subType || 'any_reason';
      const prompt = copy.user_feedback?.[messageId] || {};
      renderer(prompt, config, copy, state, goNext);
    } else if (baseType === 'pause') {
      renderer(copy.pause, config.pause || {}, config, copy, state, goNext);
    } else if (baseType === 'billing_cycle_switch') {
      renderer(
        copy.billing_cycle_switch,
        config.billing_cycle_switch || {},
        config,
        copy,
        state,
        goNext
      );
    } else if (baseType === 'plan_switch') {
      renderer(
        copy.plan_switch,
        config.plan_switch || {},
        config,
        copy,
        state,
        goNext
      );
    } else {
      renderer(copy[baseType], step, config, copy, state, goNext);
    }
  } else {
    console.warn('⚠️ Unknown step type:', step.type);
    state.currentStepIndex++;
    renderNextStep(config, copy, state);
  }
}

const stepRenderers = {
  discount: (strings, step, config, copy, state, goNext) =>
    renderDiscountPopup(
      strings,
      config.discount || {},
      config,
      copy,
      state,
      goNext
    ),

  pause: renderPausePopup,
  plan_switch: renderPlanSwitchPopup,
  billing_cycle_switch: renderBillingCycleSwitchPopup,

  user_feedback: (prompt, config, copy, state, goNext) =>
    renderUserFeedbackPopup(prompt, config, copy, state, goNext),
};

// Expose internal functions for testing purposes
export { renderNextStep, stepRenderers };
