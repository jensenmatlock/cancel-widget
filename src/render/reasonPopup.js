import { renderDiscountPopup } from './discountPopup';
import { renderPausePopup } from './pausePopup';
import { renderPlanSwitchPopup } from './planSwitchPopup';
import { renderUserFeedbackPopup } from './userFeedbackPopup';
import { getCopy } from "../utils/getCopy";
import { applyTheme } from "../utils/applyTheme";
import { fireAnalytics } from '../utils/tracking';
import { logEvent } from '../utils/logger';

export function loadCancelFlow(config) {
  applyTheme(config);

  const state = {
    selectedReason: null,
    currentStepIndex: 0,
    currentStepSet: []
  };

  renderInitialPopup(config, state);
}

function renderInitialPopup(config, state) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const copy = config.copy || {};

  const headline = document.createElement("h2");
  headline.textContent = getCopy("general.headline", config);

  const subheadline = document.createElement("p");
  subheadline.textContent = getCopy("general.subheadline", config);

  const reasonWrapper = document.createElement("div");
  reasonWrapper.className = "reason-list";

  const cancelReasons = config.flow.cancel_reasons || [];
  const reasonLabels = config.copy?.cancel_reasons || {};

  cancelReasons.forEach(reasonKey => {
    const label = document.createElement("label");

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "cancel_reason";
    input.value = reasonKey;

    input.addEventListener("change", () => {
      state.selectedReason = reasonKey;
      console.log("Selected reason:", reasonKey);
    });

    label.appendChild(input);
    label.append(` ${reasonLabels[reasonKey] || reasonKey}`);
    reasonWrapper.appendChild(label);
  });

  const styleClass = config.theme_config?.button_style === "outline" ? "outline" : "fill";
  const cornerClass = {
    rounded: "rounded-btn",
    sharp: "sharp-btn",
    pill: "pill-btn"
  }[config.theme_config?.button_corners || "rounded"];

  const exitBtn = document.createElement("button");
  exitBtn.textContent = getCopy("general.cta_primary", config);
  exitBtn.className = `cta-primary ${styleClass} ${cornerClass}`;
  exitBtn.onclick = async () => {
    fireAnalytics("reason_exit", config);
    await logEvent({ accountId: config.account_id, step: "reason_exit" });
    window.location.href = config.flow.default_cancel_url;
  };

  const continueBtn = document.createElement("button");
  continueBtn.textContent = getCopy("general.cta_secondary", config);
  continueBtn.className = `cta-secondary ${styleClass} ${cornerClass}`;
  continueBtn.onclick = async () => {
    if (!state.selectedReason) {
      console.warn("No reason selected");
      return;
    }

    const reasonLogic = config.flow.logic.find(entry => entry.reasonKey === state.selectedReason);
    const steps = reasonLogic?.steps || [];
    console.log("Configured steps for selected reason:", steps);

    state.currentStepSet = steps.filter(step => {
      if (step.enabled === false) return false;
      const [type] = step.type.split(".");
      if (type === "discount" && config.discount?.enabled === false) return false;
      if (type === "pause" && config.pause?.enabled === false) return false;
      if (type === "plan_switch" && config.plan_switch?.enabled === false) return false;
      return true;
    });

    state.currentStepIndex = 0;

    if (state.currentStepSet.length === 0) {
      console.warn("No enabled steps found — staying on page (debug mode)");
      return;
    }

    fireAnalytics("reason_continue", config);
    await logEvent({
      accountId: config.account_id,
      step: "reason_continue",
      reasonKey: state.selectedReason
    });

    renderNextStep(config, config.copy, state);
  };

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.appendChild(exitBtn);
  buttonRow.appendChild(continueBtn);

  container.appendChild(headline);
  container.appendChild(subheadline);
  container.appendChild(reasonWrapper);
  container.appendChild(buttonRow);
}

function renderNextStep(config, copy, state) {
  const step = state.currentStepSet[state.currentStepIndex];
  if (!step) {
    console.log("🚫 End of steps reached — no redirect (debug mode)");
    return;
  }

  const goNext = () => renderNextStep(config, copy, state);
  const [baseType, subType] = step.type.split(".");
  const renderer = stepRenderers[baseType];

  if (renderer) {
    if (baseType === "user_feedback") {
      const messageId = subType || "any_reason";
      const prompt = copy.user_feedback?.[messageId] || {};
      renderer(prompt, config, copy, state, goNext);
    } else if (baseType === "pause") {
      renderer(copy.pause, config.pause || {}, config, copy, state, goNext);
    } else if (baseType === "plan_switch") {
      renderer(copy.plan_switch, config.plan_switch || {}, config, copy, state, goNext);
    } else {
      renderer(copy[baseType], step, config, copy, state, goNext);
    }
  } else {
    console.warn("⚠️ Unknown step type:", step.type);
    state.currentStepIndex++;
    renderNextStep(config, copy, state);
  }
}

const stepRenderers = {
  discount: (strings, step, config, copy, state, goNext) =>
    renderDiscountPopup(strings, config.discount || {}, config, copy, state, goNext),

  pause: renderPausePopup,
  plan_switch: renderPlanSwitchPopup,

  user_feedback: (prompt, config, copy, state, goNext) =>
    renderUserFeedbackPopup(prompt, config, copy, state, goNext)
};
