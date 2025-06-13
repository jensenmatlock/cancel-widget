import { getCopy } from '../utils/getCopy';
import { fireAnalytics } from '../utils/tracking';
import { logEvent } from '../utils/logger';

export function renderPlanSwitchPopup(strings, settings, config, copy, state, renderNextStep) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const popupCornerClass = {
    rounded: "rounded-popup",
    sharp: "sharp-popup"
  }[config.theme_config?.popup_corners || "rounded"];
  container.className = popupCornerClass;

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const headline = document.createElement("h2");
  headline.textContent = getCopy("plan_switch.headline", config);

  const subheadline = document.createElement("p");
  subheadline.textContent = getCopy("plan_switch.subheadline", config);

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

  const styleClass = config.theme_config?.button_style === "outline" ? "outline" : "fill";
  const cornerClass = {
    rounded: "rounded-btn",
    sharp: "sharp-btn",
    pill: "pill-btn"
  }[config.theme_config?.button_corners || "rounded"];

  const applyBtn = document.createElement("button");
  applyBtn.textContent = getCopy("plan_switch.cta_primary", config);
  applyBtn.className = `cta-primary ${styleClass} ${cornerClass}`;
  applyBtn.onclick = async () => {
    const selectedPlan = select.value;
    const redirectTemplate = settings.redirect_template || "";
    const userId = config.user_id || "";

    const redirectUrl = redirectTemplate
      .replace("{{user_id}}", userId.toString())
      .replace("{{plan_id}}", selectedPlan.toString());

    fireAnalytics("planSwitch_selected", config);

    await logEvent({
      accountId: config.account_id,
      step: "planSwitch_selected",
      reasonKey: state.selectedReason
    });

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      console.warn("⚠️ Redirect URL was empty — no redirect occurred");
    }
  };

  const continueBtn = document.createElement("button");
  continueBtn.textContent = getCopy("plan_switch.cta_secondary", config);
  continueBtn.className = `cta-secondary ${styleClass} ${cornerClass}`;
  continueBtn.onclick = async () => {
    fireAnalytics("planSwitch_skipped", config);

    await logEvent({
      accountId: config.account_id,
      step: "planSwitch_skipped",
      reasonKey: state.selectedReason
    });

    state.currentStepIndex++;
    renderNextStep();
  };

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.append(applyBtn, continueBtn);

  wrapper.append(headline, subheadline, labelSelectWrapper, buttonRow);
  container.appendChild(wrapper);
}
