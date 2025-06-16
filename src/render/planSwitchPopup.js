import { createHeadline, createSubheadline, createButton } from "../utils/domHelpers";
import { getCopy } from '../utils/getCopy';
import { getButtonClass } from "../utils/buttonStyles";
import { renderPreviewRedirect } from "../utils/renderHelpers";
import { fireAnalytics } from '../utils/tracking';
import { logEvent } from '../utils/logger';

export function renderPlanSwitchPopup(strings, settings, config, copy, state, renderNextStep) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const headline = createHeadline(getCopy("plan_switch.headline", config));
  const subheadline = createSubheadline(getCopy("plan_switch.subheadline", config));

  const labelSelectWrapper = document.createElement("div");
  labelSelectWrapper.className = "inline-label-select";

  const select = document.createElement("select");
  select.id = "plan-switch-dropdown";

  const label = document.createElement("label");
  label.htmlFor = select.id;
  label.textContent = getCopy("plan_switch.dropdown_label", config);

  if (Array.isArray(settings.plans) && settings.plans.length > 0) {
    settings.plans.forEach(plan => {
      const opt = document.createElement("option");
      opt.value = plan.id;
      opt.textContent = `${plan.name} - ${plan.price}`;
      select.appendChild(opt);
    });
  } else {
    console.warn("⚠️ No plans provided for plan_switch step");
  }

  labelSelectWrapper.appendChild(label);
  labelSelectWrapper.appendChild(select);

  const applyBtn = createButton(
    getCopy("plan_switch.cta_primary", config),
    getButtonClass("primary", config),
    async () => {
      const selectedPlan = select.value;
      const redirectUrl = (settings.redirect_template || "")
        .replace("{{user_id}}", config.user_id || "")
        .replace("{{plan_id}}", selectedPlan);

      fireAnalytics("plan_switch_selected", config);

      await logEvent({
        accountId: config.account_id,
        step: "plan_switch_selected",
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
    getCopy("plan_switch.cta_secondary", config),
    getButtonClass("secondary", config),
    async () => {
      fireAnalytics("plan_switch_skipped", config);

      await logEvent({
        accountId: config.account_id,
        step: "plan_switch_skipped",
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
