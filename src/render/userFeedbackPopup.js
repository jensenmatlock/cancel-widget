import { getCopy } from '../utils/getCopy';
import { fireAnalytics } from '../utils/tracking';
import { logEvent } from '../utils/logger';

export function renderUserFeedbackPopup(strings = {}, config, copy, state, renderNextStep) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const popupCornerClass = {
    rounded: "rounded-popup",
    sharp: "sharp-popup"
  }[config.theme_config?.popup_corners || "rounded"];
  container.className = popupCornerClass;

  const reasonKey = state.selectedReason;
  const feedbackKey = copy.user_feedback?.[reasonKey] ? reasonKey : "any_reason";
  const basePath = `user_feedback.${feedbackKey}`;

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const headline = document.createElement("h2");
  headline.textContent = strings.headline || getCopy(`${basePath}.headline`, config);

  const subheadline = document.createElement("p");
  subheadline.textContent = strings.subheadline || getCopy(`${basePath}.subheadline`, config);

  const textarea = document.createElement("textarea");
  textarea.rows = 5;
  textarea.cols = 40;
  textarea.placeholder = strings.placeholder || getCopy(`${basePath}.placeholder`, config);

  const styleClass = config.theme_config?.button_style === "outline" ? "outline" : "fill";
  const cornerClass = {
    rounded: "rounded-btn",
    sharp: "sharp-btn",
    pill: "pill-btn"
  }[config.theme_config?.button_corners || "rounded"];

  const exitBtn = document.createElement("button");
  exitBtn.textContent = strings.cta_primary || getCopy(`${basePath}.cta_primary`, config);
  exitBtn.className = `cta-primary ${styleClass} ${cornerClass}`;
  exitBtn.onclick = async () => {
    fireAnalytics("userFeedback_exit", config);

    await logEvent({
      accountId: config.account_id,
      step: "userFeedback_exit",
      reasonKey: state.selectedReason
    });

    window.location.href = config.flow.default_cancel_url;
  };

  const continueBtn = document.createElement("button");
  continueBtn.textContent = strings.cta_secondary || getCopy(`${basePath}.cta_secondary`, config);
  continueBtn.className = `cta-secondary ${styleClass} ${cornerClass}`;
  continueBtn.onclick = async () => {
    fireAnalytics("userFeedback_continue", config);

    const rawInput = textarea.value.trim();
    const sanitized = rawInput
      .replace(/<[^>]*>?/gm, "") // Remove HTML tags
      .replace(/script/gi, "")   // Block the word "script"
      .replace(/[<>]/g, "");     // Remove angle brackets just in case

    console.log("Feedback (sanitized):", sanitized);

    await logEvent({
      accountId: config.account_id,
      step: "userFeedback_continue",
      reasonKey: state.selectedReason,
      write_in: sanitized
    });

    state.currentStepIndex++;
    renderNextStep();
  };

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.append(exitBtn, continueBtn);

  wrapper.append(headline, subheadline, textarea, buttonRow);
  container.appendChild(wrapper);
}
