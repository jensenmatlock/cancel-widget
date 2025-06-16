export function renderPreviewRedirect(redirectUrl) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const headline = document.createElement("h2");
  headline.textContent = "Preview Mode";

  const subheadline = document.createElement("p");
  subheadline.innerHTML = redirectUrl
    ? `In live mode, the user would have been redirected to:<br><br><code>${redirectUrl}</code>`
    : `In live mode, the widget would have <strong>closed</strong> and returned control to your site.`;

  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "Restart Flow";
  refreshBtn.className = "cta-primary rounded-btn";
  refreshBtn.onclick = () => window.location.reload();

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.appendChild(refreshBtn);

  wrapper.append(headline, subheadline, buttonRow);
  container.appendChild(wrapper);
}
