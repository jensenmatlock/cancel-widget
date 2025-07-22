// widgets/cancel/index.js
import { loadCancelFlow as loadReasonPopupFlow } from './reasonPopup.js';

/**
 * Entry point for the cancel flow widget.
 * Mirrors the banner's API so main.js can call it consistently.
 *
 * @param {object} config - Fully enriched config (account_id, credentials, user data, etc.)
 * @param {string} containerId - Optional DOM ID for mounting (defaults to 'widget-container')
 */
export function loadCancelFlow(config, containerId = 'widget-container') {
  // Ensure a container exists (banner does not need one, but cancel does)
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  // Pass the enriched config down — reasonPopup handles steps, analytics, etc.
  loadReasonPopupFlow(config);
}
