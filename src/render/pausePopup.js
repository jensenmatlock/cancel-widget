import { createHeadline, createSubheadline, createButton } from "../utils/domHelpers";
import { getCopy } from '../utils/getCopy';
import { getButtonClass } from "../utils/buttonStyles";
import { renderPreviewRedirect } from "../utils/renderHelpers";
import { fireAnalytics } from '../utils/tracking';
import { logEvent } from '../utils/logger';

export function renderPausePopup(strings, settings, config, copy, state, renderNextStep) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const headline = createHeadline(getCopy("pause.headline", config));
  const subheadline = createSubheadline(getCopy("pause.subheadline", config));

  const labelSelectWrapper = document.createElement("div");
  labelSelectWrapper.className = "inline-label-select";

  const select = document.createElement("select");
  select.id = "pause-duration";

  const label = document.createElement("label");
  label.htmlFor = select.id;
  label.textContent = getCopy("pause.dropdown_label", config);

  if (Array.isArray(settings.durations) && settings.durations.length > 0) {
    settings.durations.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = `${d} billing cycle${d > 1 ? 's' : ''}`;
      select.appendChild(opt);
    });
  } else {
    console.warn("⚠️ No durations provided for pause step");
  }

  labelSelectWrapper.appendChild(label);
  labelSelectWrapper.appendChild(select);

  const applyBtn = createButton(
    getCopy("pause.cta_primary", config),
    getButtonClass("primary", config),
    async () => {
      const duration = select.value;
      const redirectTemplate = settings.redirect_template || "";
      const userId = config.user_id || "";

      const redirectUrl = redirectTemplate
        .replace("{{user_id}}", userId.toString())
        .replace("{{pause_duration}}", duration.toString());

      fireAnalytics("pause_selected", config);

      await logEvent({
        accountId: config.account_id,
        step: "pause_selected",
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
    getCopy("pause.cta_secondary", config),
    getButtonClass("secondary", config),
    async () => {
      fireAnalytics("pause_skipped", config);

      await logEvent({
        accountId: config.account_id,
        step: "pause_skipped",
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

  wrapper.append(headline, subheadline, labelSelectWrapper, buttonRow);
  container.appendChild(wrapper);
}
