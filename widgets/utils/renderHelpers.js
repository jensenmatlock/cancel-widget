// Helper to escape HTML special characters
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderPreviewRedirect(
  redirectUrl,
  method = 'URL',
  gateway = null,
  action = null
) {
  const container = document.getElementById('widget-container');
  if (!container) {
    console.warn('Widget container element not found');
    return;
  }
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'popup-content';

  const headline = document.createElement('h2');
  headline.textContent = 'Preview Mode';

  const subheadline = document.createElement('p');

  if (method === 'Payment Gateway') {
    const displayGateway = gateway
      ? gateway.charAt(0).toUpperCase() + gateway.slice(1)
      : 'your payment gateway';

    const displayAction = action || 'this action';

    const sanitizedGateway = escapeHTML(displayGateway);
    const sanitizedAction = escapeHTML(displayAction);

    subheadline.innerHTML = `
      In live mode, <strong>${sanitizedGateway}</strong> would have processed a <em>${sanitizedAction}</em> here.<br><br>
      No redirect occurs in preview.
    `;
  } else if (redirectUrl) {
    const safeUrl = escapeHTML(redirectUrl);
    subheadline.innerHTML = `In live mode, the user would have been redirected to:<br><br><code>${safeUrl}</code>`;
  } else {
    subheadline.innerHTML = `In live mode, the widget would have <strong>closed</strong> and returned control to your site.`;
  }

  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = 'Restart Flow';
  refreshBtn.className = 'cta-primary rounded-btn';
  refreshBtn.onclick = () => window.location.reload();

  const buttonRow = document.createElement('div');
  buttonRow.className = 'button-row';
  buttonRow.appendChild(refreshBtn);

  wrapper.append(headline, subheadline, buttonRow);
  container.appendChild(wrapper);
}
