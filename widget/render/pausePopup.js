import {
  createHeadline,
  createSubheadline,
  createButton,
} from '../utils/domHelpers.js';
import { getCopy } from '../utils/getCopy.js';
import { getButtonClass } from '../utils/buttonStyles.js';
import { renderPreviewRedirect } from '../utils/renderHelpers.js';
import { fireAnalytics } from '../utils/tracking.js';
import { logEvent } from '../utils/logger.js';
import { handleSaveMechanism } from '../utils/handleSaveMechanism.js';
import { getUserContext } from '../utils/configHelpers.js';
import { renderSuccessPopup } from './successPopup.js';

export async function renderPausePopup(
  strings,
  settings,
  config,
  copy,
  state,
  renderNextStep
) {
  const container = document.getElementById('widget-container');
  container.innerHTML = '';

  if (!Array.isArray(settings.durations) || settings.durations.length === 0) {
    console.warn('⚠️ No durations provided for pause step');
    fireAnalytics('pause_skipped_autoskip', config);
    state.currentStepIndex++;
    renderNextStep();
    return;
  }

  const user = await getUserContext(config);

  if (user.user_plan_interval !== 'month') {
    console.warn('ℹ️ Ineligible plan interval:', user.user_plan_interval);
    fireAnalytics('pause_skipped_autoskip', config);
    state.currentStepIndex++;
    renderNextStep();
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'popup-content';

  const headline = createHeadline(getCopy('pause.headline', config));
  const subheadline = createSubheadline(getCopy('pause.subheadline', config));

  const labelSelectWrapper = document.createElement('div');
  labelSelectWrapper.className = 'inline-label-select';

  const select = document.createElement('select');
  select.id = 'pause-duration';

  const label = document.createElement('label');
  label.htmlFor = select.id;
  label.textContent = getCopy('pause.dropdown_label', config);

  settings.durations.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = `${d} month${d > 1 ? 's' : ''}`;
    select.appendChild(opt);
  });

  labelSelectWrapper.appendChild(label);
  labelSelectWrapper.appendChild(select);

  const applyBtn = createButton(
    getCopy('pause.cta_primary', config),
    getButtonClass('primary', config),
    async () => {
      const duration = select.value;

      fireAnalytics('pause_selected', config);

      await logEvent({
        accountId: config.account_id,
        step: 'pause_selected',
        reasonKey: state.selectedReason,
        config,
      });

      const result = await handleSaveMechanism({
        type: 'pause',
        config,
        settings,
        userContext: await getUserContext(config),
        preview: config.preview,
        extra: { pause_duration: duration },
      });

      if (result?.preview) {
        renderPreviewRedirect(
          null,
          'Payment Gateway',
          result.gateway,
          result.action
        );
        return;
      }

      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      if (result?.handled) {
        renderSuccessPopup(config, 'pause', result.contextVars, state);
        return;
      }

      console.error('❌ Pause failed or unhandled result:', result);
      alert(
        'Something went wrong trying to pause the subscription. Please try again.'
      );
    }
  );

  const continueBtn = createButton(
    getCopy('pause.cta_secondary', config),
    getButtonClass('secondary', config),
    async () => {
      fireAnalytics('pause_skipped', config);

      await logEvent({
        accountId: config.account_id,
        step: 'pause_skipped',
        reasonKey: state.selectedReason,
        config,
      });

      state.currentStepIndex++;
      renderNextStep();
    }
  );

  const buttonRow = document.createElement('div');
  buttonRow.className = 'button-row';
  buttonRow.append(applyBtn, continueBtn);

  wrapper.append(headline, subheadline, labelSelectWrapper, buttonRow);
  container.appendChild(wrapper);
}
