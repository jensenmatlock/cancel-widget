import { getCopy } from '../utils/getCopy';
import { fireAnalytics } from '../utils/tracking';
import { logEvent } from '../utils/logger';
import { discountIconSVG } from '../assets/discountIcon';

export async function renderDiscountPopup(strings, discount, config, copy, state, renderNextStep) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const popupCornerClass = {
    rounded: "rounded-popup",
    sharp: "sharp-popup"
  }[config.theme_config?.popup_corners || "rounded"];
  container.className = popupCornerClass;

  const styleClass = config.theme_config?.button_style === "outline" ? "outline" : "fill";
  const cornerClass = {
    rounded: "rounded-btn",
    sharp: "sharp-btn",
    pill: "pill-btn"
  }[config.theme_config?.button_corners || "rounded"];

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const headline = document.createElement("h2");
  headline.textContent = getCopy("discount.headline", config);

  const subheadline = document.createElement("p");
  const template = getCopy("discount.subheadline", config);
  subheadline.textContent = template
    .replace("{{amount}}", discount.amount)
    .replace("{{duration}}", discount.duration);

  const svgWrapper = document.createElement("div");
  svgWrapper.className = "illustration";
  svgWrapper.innerHTML = discountIconSVG;

  const applyBtn = document.createElement("button");
  applyBtn.textContent = getCopy("discount.cta_primary", config);
  applyBtn.className = `cta-primary ${styleClass} ${cornerClass}`;
  applyBtn.onclick = async () => {
    const redirectUrl = discount.redirect_template
      .replace("{{user_id}}", config.user_id || "")
      .replace("{{promo_code}}", discount.promo_code || "");

    fireAnalytics("discount_selected", config);

    await logEvent({
      accountId: config.account_id,
      step: "discount_selected",
      reasonKey: state.selectedReason
    });

    window.location.href = redirectUrl;
  };

  const continueBtn = document.createElement("button");
  continueBtn.textContent = getCopy("discount.cta_secondary", config);
  continueBtn.className = `cta-secondary ${styleClass} ${cornerClass}`;
  continueBtn.onclick = async () => {
    fireAnalytics("discount_skipped", config);

    await logEvent({
      accountId: config.account_id,
      step: "discount_skipped",
      reasonKey: state.selectedReason
    });

    state.currentStepIndex++;
    renderNextStep();
  };

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.append(applyBtn, continueBtn);

  wrapper.append(headline, subheadline, svgWrapper, buttonRow);
  container.appendChild(wrapper);
}
