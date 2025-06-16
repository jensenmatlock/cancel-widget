import { createHeadline, createSubheadline, createButton } from "../utils/domHelpers";
import { getCopy } from '../utils/getCopy';
import { getButtonClass } from "../utils/buttonStyles";
import { renderPreviewRedirect } from "../utils/renderHelpers";
import { fireAnalytics } from '../utils/tracking';
import { logEvent } from '../utils/logger';

export function renderUserFeedbackPopup(strings = {}, config, copy, state, renderNextStep) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const reasonKey = state.selectedReason;
  const feedbackKey = copy.user_feedback?.[reasonKey] ? reasonKey : "any_reason";
  const basePath = `user_feedback.${feedbackKey}`;

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const headline = createHeadline(strings.headline || getCopy(`${basePath}.headline`, config));
  const subheadline = createSubheadline(strings.subheadline || getCopy(`${basePath}.subheadline`, config));

  const textarea = document.createElement("textarea");
  textarea.rows = 5;
  textarea.cols = 40;
  textarea.placeholder = strings.placeholder || getCopy(`${basePath}.placeholder`, config);

  const exitBtn = createButton(
    strings.cta_primary || getCopy(`${basePath}.cta_primary`, config),
    getButtonClass("primary", config),
    async () => {
      fireAnalytics("userFeedback_exit", config);
      await logEvent({
        accountId: config.account_id,
        step: "userFeedback_exit",
        reasonKey: state.selectedReason,
        config
      });

      if (config.preview) {
        renderPreviewRedirect();
      } else {
        document.getElementById("widget-container")?.remove();
      }
    }
  );

  const continueBtn = createButton(
    strings.cta_secondary || getCopy(`${basePath}.cta_secondary`, config),
    getButtonClass("secondary", config),
    async () => {
      fireAnalytics("userFeedback_continue", config);

      const rawInput = textarea.value.trim();
      const sanitized = rawInput
        .replace(/<[^>]*>?/gm, "")
        .replace(/script/gi, "")
        .replace(/[<>]/g, "");

      console.log("Feedback (sanitized):", sanitized);

      await logEvent({
        accountId: config.account_id,
        step: "userFeedback_continue",
        reasonKey: state.selectedReason,
        write_in: sanitized,
        config
      });

      state.currentStepIndex++;
      renderNextStep();
    }
  );

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.append(exitBtn, continueBtn);

  wrapper.append(headline, subheadline, textarea, buttonRow);
  container.appendChild(wrapper);
}
