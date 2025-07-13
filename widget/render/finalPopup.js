import { getCopy } from '../utils/getCopy';
import { renderPreviewRedirect } from "../utils/renderHelpers";


export function renderFinalMessage(config) {
  const container = document.getElementById("widget-container");
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "popup-content";

  const headline = document.createElement("h2");
  headline.textContent = getCopy("final.headline", config);

  const subheadline = document.createElement("p");
  subheadline.textContent = getCopy("final.subheadline", config);;

  wrapper.append(headline, subheadline);
  container.appendChild(wrapper);


  setTimeout(() => {
  if (config.preview) {
    renderPreviewRedirect();
  } else {
    document.getElementById("widget-container")?.remove();
  }}, 3000);
}
