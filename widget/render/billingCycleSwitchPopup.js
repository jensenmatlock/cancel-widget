import { createHeadline, createSubheadline, createButton } from "../utils/domHelpers";
import { getCopy } from "../utils/getCopy";
import { getButtonClass } from "../utils/buttonStyles";
import { renderPreviewRedirect } from "../utils/renderHelpers";
import { fireAnalytics } from "../utils/tracking";
import { logEvent } from "../utils/logger";
import { getUserContext } from "../utils/configHelpers";
import { handleSaveMechanism } from "../utils/handleSaveMechanism";
import { renderSuccessPopup } from "./successPopup";

export function renderBillingCycleSwitchPopup(strings, settings, config, copy, state, renderNextStep) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const user = getUserContext();
  const mappings = config.billing_cycle_switch?.mappings || [];

  const matched = mappings.find(m => m.from.id === user.user_plan_id);
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

  const templateHeadline = getCopy("billing_cycle_switch.headline", config);
  const headlineText = templateHeadline
    .replace("{{from_name}}", fromPlan.name)
    .replace("{{from_price}}", fromPlan.price)
    .replace("{{to_name}}", toPlan.name)
    .replace("{{to_price}}", toPlan.price);
  const headline = createHeadline(headlineText);

  const templateSubheadline = getCopy("billing_cycle_switch.subheadline", config);
  const subheadlineText = templateSubheadline
    .replace("{{from_name}}", fromPlan.name)
    .replace("{{from_price}}", fromPlan.price)
    .replace("{{to_name}}", toPlan.name)
    .replace("{{to_price}}", toPlan.price);
  const subheadline = createSubheadline(subheadlineText);

  const applyBtn = createButton(
    getCopy("billing_cycle_switch.cta_primary", config) || "Switch Billing Cycle",
    getButtonClass("primary", config),
    async () => {
      fireAnalytics("billing_cycle_switch_selected", config);

      await logEvent({
        accountId: config.account_id,
        step: "billing_cycle_switch_selected",
        reasonKey: state.selectedReason,
        config,
      });

      const result = await handleSaveMechanism({
        type: "billing_cycle_switch",
        config,
        settings,
        userContext: user,
        preview: config.preview,
        extra: {
          from_name: fromPlan.name,
          from_price: fromPlan.price,
          to_name: toPlan.name,
          to_price: toPlan.price,
        },
      });

      if (result?.preview) {
        renderPreviewRedirect(null, result.method, result.gateway, result.action);
        return;
      }

      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      if (result?.handled) {
        renderSuccessPopup(config, "billing_cycle_switch", {
          from_name: fromPlan.name,
          from_price: fromPlan.price,
          to_name: toPlan.name,
          to_price: toPlan.price,
        },
		state);
        return;
      }

      console.error("❌ Billing cycle switch failed or unhandled result:", result);
      alert("Something went wrong trying to switch billing cycle. Please try again.");
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
        config,
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
