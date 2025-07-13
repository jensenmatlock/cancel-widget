import { createHeadline, createSubheadline, createButton } from "../utils/domHelpers";
import { getCopy } from "../utils/getCopy";
import { getButtonClass } from "../utils/buttonStyles";
import { renderPreviewRedirect } from "../utils/renderHelpers";
import { fireAnalytics } from "../utils/tracking";
import { logEvent } from "../utils/logger";
import { getUserContext } from "../utils/configHelpers";
import { handleSaveMechanism } from "../utils/handleSaveMechanism";
import { renderSuccessPopup } from "./successPopup";

function parsePrice(priceString) {
  return parseFloat(priceString.replace(/[^0-9.]/g, ""));
}

export function renderPlanSwitchPopup(strings, settings, config, copy, state, renderNextStep) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const user = getUserContext();
  const allPlans = settings.plans || [];

  const currentPlan = allPlans.find((p) => p.id === user.user_plan_id);

  if (!currentPlan) {
    console.warn("⚠️ Current user_plan_id not found in plan list:", user.user_plan_id);
    fireAnalytics("plan_switch_skipped_missing_plan_id", config);
    state.currentStepIndex++;
    renderNextStep();
    return;
  }

  const currentPrice = parsePrice(currentPlan.price);
  const currentInterval = currentPlan.interval;

  const validPlans = allPlans.filter(
    (plan) =>
      plan.interval === currentInterval && parsePrice(plan.price) < currentPrice
  );

  if (validPlans.length === 0) {
    console.info("ℹ️ No valid plan switch options. Skipping step.");
    fireAnalytics("plan_switch_skipped_autoskip", config);
    state.currentStepIndex++;
    renderNextStep();
    return;
  }

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

  validPlans.forEach((plan) => {
    const opt = document.createElement("option");
    opt.value = plan.id;
    opt.textContent = `${plan.name} - ${plan.price}`;
    select.appendChild(opt);
  });

  labelSelectWrapper.appendChild(label);
  labelSelectWrapper.appendChild(select);

  const applyBtn = createButton(
    getCopy("plan_switch.cta_primary", config),
    getButtonClass("primary", config),
    async () => {
      const selectedPlanId = select.value;
      const selectedPlan = allPlans.find((p) => p.id === selectedPlanId);

      fireAnalytics("plan_switch_selected", config);

      await logEvent({
        accountId: config.account_id,
        step: "plan_switch_selected",
        reasonKey: state.selectedReason,
        config,
      });

      const result = await handleSaveMechanism({
        type: "plan_switch",
        config,
        settings: { ...settings, price_id: selectedPlanId },
        userContext: user,
        preview: config.preview,
        extra: {
          plan_from: currentPlan.name,
          plan_to: selectedPlan?.name,
          price_to: selectedPlan?.price,
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
        renderSuccessPopup(config, "plan_switch", {
          plan_from: currentPlan.name,
          plan_to: selectedPlan?.name,
          price_to: selectedPlan?.price,
        },
		state);
        return;
      }

      console.error("❌ Plan switch failed or unhandled result:", result);
      alert("Something went wrong trying to switch plans. Please try again.");
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