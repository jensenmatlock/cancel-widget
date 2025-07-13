import { createHeadline, createSubheadline, createButton } from "../utils/domHelpers";
import { getCopy } from "../utils/getCopy";
import { getButtonClass } from "../utils/buttonStyles";
import { fireAnalytics } from "../utils/tracking";
import { logEvent } from "../utils/logger";

export async function renderSuccessPopup(config, type, contextVars = {}, state = null) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  if (typeof type !== "string") {
    console.error("❌ Invalid success popup type:", type);
    return;
  }

  const rawHeadline =
    getCopy(`success.${type}.headline`, config) || getCopy(`${type}.success_headline`, config);
  const rawSubheadline =
    getCopy(`success.${type}.subheadline`, config) || getCopy(`${type}.success_subheadline`, config);
  const ctaText = getCopy(`success.cta_primary`, config) || "Close";

  const headlineText = interpolateCopy(rawHeadline, contextVars);
  const subheadlineText = interpolateCopy(rawSubheadline, contextVars);

  const headline = createHeadline(headlineText);
  const subheadline = createSubheadline(subheadlineText);

  const closeBtn = createButton(
    ctaText,
    getButtonClass("primary", config),
    () => {
      document.getElementById("widget-container")?.remove();
    }
  );

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.appendChild(closeBtn);

  wrapper.append(headline, subheadline, buttonRow);
  container.appendChild(wrapper);

  // ✅ Fire analytics + log event
  fireAnalytics(`${type}_completed`, config);

  await logEvent({
    accountId: config.account_id,
    step: `${type}_completed`,
    reasonKey: state?.selectedReason ?? null,
    config
  });
}

// 🔧 Interpolate {{var}} tags with values from contextVars
function interpolateCopy(template = "", vars = {}) {
  return template.replace(/{{(.*?)}}/g, (_, key) => vars[key.trim()] ?? "");
}
