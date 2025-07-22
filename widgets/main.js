import { loadConfig } from './configLoader.js';
import { getUserContext } from './utils/configHelpers.js';
import { widgetStyles } from './injectedStyles.js';
import { validateCustomer } from './utils/validateCustomer.js';

// Widget entry points
import { loadCancelFlow } from './cancel/index.js';
import { loadBannerWidget } from './banner/index.js';

function getAccountId() {
  const scripts = document.querySelectorAll('script');
  for (let script of scripts) {
    const attr = script.getAttribute('data-account-id');
    if (attr) return attr;
  }

  if (window.__widget_account_id) return window.__widget_account_id;

  const paramId = new URLSearchParams(window.location.search).get('account_id');
  return paramId || null;
}

function isPreviewMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get('previewMode') === 'true';
}

function getWidgetToRender() {
  const params = new URLSearchParams(window.location.search);
  return params.get('widget') || 'cancel'; // default to cancel flow
}

window.addEventListener('DOMContentLoaded', async () => {
  const account_id = getAccountId();
  const domain = window.location.hostname;

  if (!account_id) {
    console.error('❌ No account ID provided.');
    return;
  }

  const validation = await validateCustomer(account_id, domain);
  if (!validation?.valid) {
    console.error('❌ Domain not authorized for this widget.');
    return;
  }

  // Inject shared styles for cancel + banner
  const styleTag = document.createElement('style');
  styleTag.textContent = widgetStyles;
  document.head.appendChild(styleTag);

  const config = await loadConfig(account_id);
  if (!config) return;

  const enrichedBase = {
    ...config,
    account_id,
    preview: isPreviewMode(),
    customer_tier: validation.tier || 'free',
    credentials: validation.credentials || {},
  };

  const userData = await getUserContext(enrichedBase);
  const enrichedConfig = { ...enrichedBase, ...userData };

  // Disable Pro features for free tier (only for cancel widget)
  if (enrichedConfig.customer_tier === 'free') {
    ['discount', 'pause', 'plan_switch', 'billing_cycle_switch'].forEach(
      (key) => {
        if (enrichedConfig[key]) enrichedConfig[key].enabled = false;
      }
    );
    if (enrichedConfig.final) enrichedConfig.final.cancel_enabled = false;
  }

  console.log('✅ Loaded config for account:', account_id, enrichedConfig);

  // Expose widgets for manual trigger
  window.SubJolt = {
    renderCancelWidget: (containerId = 'widget-container') => {
      // Only cancel flow needs a dedicated container and body styling
      document.body.classList.add('widget-active');
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
      }
      loadCancelFlow(enrichedConfig, containerId);
    },
    renderBannerWidget: () => {
      // Banner doesn't need a dedicated container or body changes
      document.body.classList.remove('widget-active');
      loadBannerWidget(enrichedConfig, userData);
    },
  };

  // Auto-render widget based on ?widget= param
  const widgetToRender = getWidgetToRender();
  if (widgetToRender === 'banner') {
    window.SubJolt.renderBannerWidget();
  } else {
    window.SubJolt.renderCancelWidget();
  }
});
