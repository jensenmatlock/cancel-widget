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
import { discountIconSVG } from '../assets/discountIcon.js';
import { handleSaveMechanism } from '../utils/handleSaveMechanism.js';
import { getUserContext } from '../utils/configHelpers.js';
import { renderSuccessPopup } from './successPopup.js';

export async function renderDiscountPopup(
  strings,
  discount,
  config,
  copy,
  state,
  renderNextStep
) {
  const container = document.getElementById('widget-container');
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'popup-content';

  const templateHeadline = getCopy('discount.headline', config);
  const headlineText = templateHeadline
    .replace('{{amount}}', discount.amount)
    .replace('{{duration}}', discount.duration);
  const headline = createHeadline(headlineText);

  const templateSubheadline = getCopy('discount.subheadline', config);
  const subheadlineText = templateSubheadline
    .replace('{{amount}}', discount.amount)
    .replace('{{duration}}', discount.duration);
  const subheadline = createSubheadline(subheadlineText);

  const svgWrapper = document.createElement('div');
  svgWrapper.className = 'illustration';
  svgWrapper.innerHTML = discountIconSVG;

  const applyBtn = createButton(
    getCopy('discount.cta_primary', config),
    getButtonClass('primary', config),
    async () => {
      fireAnalytics('discount_selected', config);

      await logEvent({
        accountId: config.account_id,
        step: 'discount_selected',
        reasonKey: state.selectedReason,
        config,
      });

      const result = await handleSaveMechanism({
        type: 'discount',
        config,
        settings: discount,
        userContext: await getUserContext(config),
        preview: config.preview,
        extra: { promo_code: discount.promo_code },
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
        renderSuccessPopup(
          config,
          'discount',
          {
            amount: discount.amount,
            duration: discount.duration,
          },
          state
        );
        return;
      }

      console.error('❌ Discount failed or unhandled result:', result);
      alert('Something went wrong applying the discount. Please try again.');
    }
  );

  const continueBtn = createButton(
    getCopy('discount.cta_secondary', config),
    getButtonClass('secondary', config),
    async () => {
      fireAnalytics('discount_skipped', config);

      await logEvent({
        accountId: config.account_id,
        step: 'discount_skipped',
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

  wrapper.append(headline, subheadline, svgWrapper, buttonRow);
  container.appendChild(wrapper);
}
