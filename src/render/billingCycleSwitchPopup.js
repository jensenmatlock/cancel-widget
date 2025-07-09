import { createHeadline, createSubheadline, createButton } from "../utils/domHelpers";
import { getCopy } from "../utils/getCopy";
import { getButtonClass } from "../utils/buttonStyles";
import { renderPreviewRedirect } from "../utils/renderHelpers";
import { fireAnalytics } from "../utils/tracking";
import { logEvent } from "../utils/logger";
import { getUserContext } from "../utils/configHelpers";

export function renderBillingCycleSwitchPopup(strings, settings, config, copy, state, renderNextStep) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const user = getUserContext();
  const mappings = config.billing_cycle_switch?.mappings || [];

  const matched = mappings.find(m => m.from.id === user.user_plan);
  if (!matched) {
    fireAnalytics("billing_cycle_switch_skipped_autoskip", config);
    state.currentStepIndex++;
    renderNextStep();
    return;
  }

  const fromPlan = matched.from;
  const toPlan = matched.to;

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const headline = createHeadline(getCopy("billing_cycle_switch.headline", config));
  const template = getCopy("billing_cycle_switch.subheadline", config);
  const subheadlineText = template
    .replace("{{from_name}}", fromPlan.name)
	.replace("{{from_price}}", fromPlan.price)
    .replace("{{to_name}}", toPlan.name)
    .replace("{{to_price}}", toPlan.price);
  const subheadline = createSubheadline(subheadlineText);

  const applyBtn = createButton(
    getCopy("billing_cycle_switch.cta_primary", config) || "Switch Billing Cycle",
    getButtonClass("primary", config),
    async () => {
      const redirect = config.billing_cycle_switch?.redirect_template || "";
      const url = redirect
        .replace("{{user_id}}", config.user_id || "")
        .replace("{{from_id}}", fromPlan.id)
        .replace("{{to_id}}", toPlan.id);

      fireAnalytics("billing_cycle_switch_selected", config);

      await logEvent({
        accountId: config.account_id,
        step: "billing_cycle_switch_selected",
        reasonKey: state.selectedReason,
        config
      });

      if (config.preview) {
        renderPreviewRedirect(url);
      } else {
        window.location.href = url;
      }
    }
  );

  const continueBtn = createButton(
    getCopy("billing_cycle_switch.cta_secondary", config) || "Continue to Cancel",
    getButtonClass("secondary", config),
    async () => {
      fireAnalytics("billing_cycle_switch_skipped", config);

      await logEvent({
        accountId: config.account_id,
        step: "billing_cycle_switch_skipped",
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

  wrapper.append(headline, subheadline, buttonRow);
  container.appendChild(wrapper);
}
