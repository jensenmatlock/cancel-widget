import { loadConfig } from './configLoader';
import { loadCancelFlow } from './render/reasonPopup';
import { getUserContext } from './utils/configHelpers';
import { widgetStyles } from './styles/injectedStyles';

// 🔧 DEV fallback ID
const DEV_ACCOUNT_ID = "acct_12345";

// Get account ID from script tag, global var, query param, or fallback
function getAccountId() {
  // Option 1: <script src=... data-account-id="..." />
  const scripts = document.querySelectorAll("script");
  for (let script of scripts) {
    const attr = script.getAttribute("data-account-id");
    if (attr) return attr;
  }

  // Option 2: window.__widget_account_id
  if (window.__widget_account_id) return window.__widget_account_id;

  // Option 3: query param
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get("account_id");
  if (paramId) return paramId;

  // Default for dev preview
  return DEV_ACCOUNT_ID;
}

function injectStyles(cssText) {
  const styleTag = document.createElement('style');
  styleTag.textContent = cssText;
  document.head.appendChild(styleTag);
}

injectStyles(widgetStyles);

// Inject widget container if missing
function ensureWidgetContainer() {
  if (!document.getElementById("widget-container")) {
    const div = document.createElement("div");
    div.id = "widget-container";
    document.body.appendChild(div);
  }
}

// Wait for DOM ready and start widget
window.addEventListener("DOMContentLoaded", async () => {
  const account_id = getAccountId();
  ensureWidgetContainer();

  const config = await loadConfig(account_id);
  if (!config) return; // Fail UI already shown inside loadConfig()

  const userData = getUserContext();
  const enrichedConfig = {
    ...config,
    ...userData,
	account_id
  };

  console.log("✅ Loaded config for account:", account_id, enrichedConfig);
  loadCancelFlow(enrichedConfig);
});
