import { loadConfig } from './configLoader';
import { loadCancelFlow } from './render/reasonPopup';
import { getUserContext } from './utils/configHelpers';
import { widgetStyles } from './styles/injectedStyles';

// Get account ID from script tag, global var, or query param
function getAccountId() {
  const scripts = document.querySelectorAll("script");
  for (let script of scripts) {
    const attr = script.getAttribute("data-account-id");
    if (attr) return attr;
  }

  if (window.__widget_account_id) return window.__widget_account_id;

  const paramId = new URLSearchParams(window.location.search).get("account_id");
  if (paramId) return paramId;

  return null; // no fallback
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

injectStyles(widgetStyles);

function ensureWidgetContainer() {
  if (!document.getElementById("widget-container")) {
    const div = document.createElement("div");
    div.id = "widget-container";
    document.body.appendChild(div);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const account_id = getAccountId();

  if (!account_id) {
    console.error("❌ No account ID provided.");
    return;
  }

  ensureWidgetContainer();

  const config = await loadConfig(account_id);
  if (!config) return;

  const userData = getUserContext();
  const enrichedConfig = {
    ...config,
    ...userData,
    account_id,
    preview: isPreviewMode()
  };

  console.log("✅ Loaded config for account:", account_id, enrichedConfig);
  loadCancelFlow(enrichedConfig);
});
