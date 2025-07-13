import { createHeadline, createSubheadline, createButton } from "../utils/domHelpers";
import { getCopy } from "../utils/getCopy";
import { getButtonClass } from "../utils/buttonStyles";
import { renderPreviewRedirect } from "../utils/renderHelpers";
import { fireAnalytics } from "../utils/tracking";
import { logEvent } from "../utils/logger";
import { handleSaveMechanism } from "../utils/handleSaveMechanism";
import { getUserContext } from "../utils/configHelpers";
import { renderSuccessPopup } from "./successPopup";

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
    settings.durations.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = `${d} billing cycle${d > 1 ? "s" : ""}`;
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

      fireAnalytics("pause_selected", config);

      await logEvent({
        accountId: config.account_id,
        step: "pause_selected",
        reasonKey: state.selectedReason,
        config,
      });

      const result = await handleSaveMechanism({
        type: "pause",
        config,
        settings,
        userContext: getUserContext(),
        preview: config.preview,
        extra: { pause_duration: duration },
      });

      if (result?.preview) {
        renderPreviewRedirect(null, "Payment Gateway", result.gateway, result.action);
        return;
      }

      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      if (result?.handled) {
        renderSuccessPopup(config, "pause", { pause_duration: duration }, state);
        return;
      }

      console.error("❌ Pause failed or unhandled result:", result);
      alert("Something went wrong trying to pause the subscription. Please try again.");
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
        config,
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
