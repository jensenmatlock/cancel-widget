import { loadConfig } from './configLoader';
import { loadCancelFlow } from './render/reasonPopup';
import { getUserContext } from './utils/configHelpers';
import { widgetStyles } from './styles/injectedStyles';
import { validateCustomer } from './utils/validateCustomer';

function getAccountId() {
  const scripts = document.querySelectorAll("script");
  for (let script of scripts) {
    const attr = script.getAttribute("data-account-id");
    if (attr) return attr;
  }

  if (window.__widget_account_id) return window.__widget_account_id;

  const paramId = new URLSearchParams(window.location.search).get("account_id");
  if (paramId) return paramId;

  return null;
}

function isPreviewMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("previewMode") === "true";
}

function injectStyles(cssText) {
  const styleTag = document.createElement('style');
  styleTag.textContent = cssText;
  document.head.appendChild(styleTag);
}

function ensureWidgetContainer() {
  if (!document.getElementById("widget-container")) {
    const div = document.createElement("div");
    div.id = "widget-container";
    document.body.appendChild(div);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const account_id = getAccountId();
  const domain = window.location.hostname;

  if (!account_id) {
    console.error("❌ No account ID provided.");
    return;
  }

  const validation = await validateCustomer(account_id, domain);
  if (!validation?.valid) {
    console.error("❌ Domain not authorized for this widget.");
    return;
  }

  ensureWidgetContainer();
  injectStyles(widgetStyles);

  const config = await loadConfig(account_id);
  if (!config) return;

  const userData = getUserContext();
  const enrichedConfig = {
    ...config,
    ...userData,
    account_id,
    preview: isPreviewMode(),
    customer_tier: validation.tier || "free",
	credentials: validation.credentials || {},
  };

  if (enrichedConfig.customer_tier === "free") {
    ["discount", "pause", "plan_switch", "billing_cycle_switch"].forEach((key) => {
      if (enrichedConfig[key]) enrichedConfig[key].enabled = false;
    });
  }

  console.log("✅ Loaded config for account:", account_id, enrichedConfig);
  loadCancelFlow(enrichedConfig);
});
