import { createHeadline, createSubheadline, createButton } from "../utils/domHelpers";
import { getCopy } from '../utils/getCopy';
import { getButtonClass } from "../utils/buttonStyles";
import { renderPreviewRedirect } from "../utils/renderHelpers";
import { fireAnalytics } from '../utils/tracking';
import { logEvent } from '../utils/logger';
import { discountIconSVG } from '../assets/discountIcon';

export async function renderDiscountPopup(strings, discount, config, copy, state, renderNextStep) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const headline = createHeadline(getCopy("discount.headline", config));

  const template = getCopy("discount.subheadline", config);
  const subheadlineText = template
    .replace("{{amount}}", discount.amount)
    .replace("{{duration}}", discount.duration);
  const subheadline = createSubheadline(subheadlineText);

  const svgWrapper = document.createElement("div");
  svgWrapper.className = "illustration";
  svgWrapper.innerHTML = discountIconSVG;

  const applyBtn = createButton(
    getCopy("discount.cta_primary", config),
    getButtonClass("primary", config),
    async () => {
      const redirectUrl = discount.redirect_template
        .replace("{{user_id}}", config.user_id || "")
        .replace("{{promo_code}}", discount.promo_code || "");

      fireAnalytics("discount_selected", config);

      await logEvent({
        accountId: config.account_id,
        step: "discount_selected",
        reasonKey: state.selectedReason,
        config
      });

      if (config.preview) {
        renderPreviewRedirect(redirectUrl);
      } else {
        window.location.href = redirectUrl;
      }
    }
  );

  const continueBtn = createButton(
    getCopy("discount.cta_secondary", config),
    getButtonClass("secondary", config),
    async () => {
      fireAnalytics("discount_skipped", config);

      await logEvent({
        accountId: config.account_id,
        step: "discount_skipped",
        reasonKey: state.selectedReason,
        config
      });

      state.currentStepIndex++;
      renderNextStep();
    }
  );

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.append(applyBtn, continueBtn);

  wrapper.append(headline, subheadline, svgWrapper, buttonRow);
  container.appendChild(wrapper);
}
