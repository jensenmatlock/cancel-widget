import { getCopy } from '../utils/getCopy';
import { fireAnalytics } from '../utils/tracking';
import { logEvent } from '../utils/logger';

export function renderPausePopup(strings, settings, config, copy, state, renderNextStep) {
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
  headline.textContent = getCopy("pause.headline", config);

  const subheadline = document.createElement("p");
  subheadline.textContent = getCopy("pause.subheadline", config);

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
      opt.textContent = `${d} month${d > 1 ? 's' : ''}`;
      select.appendChild(opt);
    });
  } else {
    console.warn("⚠️ No durations provided for pause step");
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
  applyBtn.textContent = getCopy("pause.cta_primary", config);
  applyBtn.className = `cta-primary ${styleClass} ${cornerClass}`;
  applyBtn.onclick = async () => {
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
      reasonKey: state.selectedReason
    });

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      console.warn("⚠️ Redirect URL was empty — no redirect occurred");
    }
  };

  const continueBtn = document.createElement("button");
  continueBtn.textContent = getCopy("pause.cta_secondary", config);
  continueBtn.className = `cta-secondary ${styleClass} ${cornerClass}`;
  continueBtn.onclick = async () => {
    fireAnalytics("pause_skipped", config);

    await logEvent({
      accountId: config.account_id,
      step: "pause_skipped",
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
