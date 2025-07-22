export const widgetStyles = `
:root {
  --font-family: sans-serif;
  --title-font-color: #000000;
  --body-font-color: #4b5563;
  --primary-button-color: #3b82f6;
  --secondary-button-color: #64748b;
  --primary-button-font-color: #ffffff;
  --secondary-button-font-color: #ffffff;
  --button-style: fill;
  --button-corners: rounded;
}

body {
  font-family: var(--font-family);
  margin: 0;
  padding: 0;
  background: #f9fafb;
}

/* -------------------- */
/* Popup Containers */
/* -------------------- */
#widget-container,
.banner-container {
  background: #ffffff;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  max-width: 500px;
  margin: 40px auto;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-sizing: border-box;
  text-align: center;
  z-index: 10001;
  position: relative;
}

.banner-overlay,
.cancel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.popup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.button-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 36px;
}

/* -------------------- */
/* Headings, Copy, & Illustrations */
/* -------------------- */
h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--title-font-color);
  margin-bottom: 1rem;
}

p {
  font-size: 1rem;
  color: var(--body-font-color);
  margin-bottom: 16px;
}

#widget-container .illustration {
  margin: 16px 0;
  display: flex;
  justify-content: center;
  width: 100px;
  color: var(--primary-button-color);
}

#widget-container .illustration svg {
  width: 100px;
  height: auto;
  display: block;
}

/* -------------------- */
/* Inputs & Lists */
/* -------------------- */
#widget-container .reason-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin: 20px 20% 20px 20%;
  width: fit-content;
}

#widget-container .reason-list label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  white-space: nowrap;
}

#widget-container textarea,
#widget-container select{
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  margin-bottom: 16px;
  resize: vertical;
  box-sizing: border-box;
}

#widget-container input[type="radio"] {
  margin-right: 8px;
  transform: scale(1.1);
}

#widget-container label {
  display: flex;
  align-items: center;
  font-size: 1rem;
}

#widget-container .inline-label-select {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 16px 0;
}

#widget-container .inline-label-select label {
  margin: 0;
  font-size: 1rem;
  white-space: nowrap;
  flex: 0 0 auto;
}

#widget-container .inline-label-select select {
  margin: 0;
  font-size: 1rem;
  min-width: 160px;
}

/* -------------------- */
/* Button Styling */
/* -------------------- */
button {
  font-size: 1rem;
  padding: 12px 16px;
  border-radius: var(--button-corners);
  border: none;
  cursor: pointer;
  min-width: 140px;
  transition: background-color 0.2s ease, border 0.2s ease;
  box-sizing: border-box;
}

.cta-primary {
  background-color: var(--primary-button-color);
  color: var(--primary-button-font-color);
}

.cta-secondary {
  background-color: var(--secondary-button-color);
  color: var(--secondary-button-font-color);
}

.outline.cta-primary {
  background: transparent;
  border: 2px solid var(--primary-button-color);
  color: var(--primary-button-color);
}

.outline.cta-secondary {
  background: transparent;
  border: 2px solid var(--secondary-button-color);
  color: var(--secondary-button-color);
}

.rounded-btn {
  border-radius: 8px;
}

.sharp-btn {
  border-radius: 0px;
}

.pill-btn {
  border-radius: 999px;
}

/* -------------------- */
/* Banner Styles */
/* -------------------- */
#banner {
  width: 100%;
  background: var(--primary-button-color);
  color: var(--primary-button-font-color);
  font-family: var(--font-family);
  padding: 12px 40px 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  position: relative;
  z-index: 9999;
  flex-wrap: wrap;
  gap: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.banner-message {
  font-size: 1rem;
  font-weight: 500;
  flex: 1 1 auto;
}

.banner-close {
  position: absolute;
  right: 12px;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  color: var(--primary-button-font-color);
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.banner-close:hover {
  opacity: 1;
}

.banner-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  flex: 0 0 auto;
}

#banner .cta-primary {
  background-color: var(--primary-button-font-color);
  color: var(--primary-button-color);
}

#banner .cta-secondary {
  background-color: var(--secondary-button-font-color);
  color: var(--secondary-button-color);
}

/* Danger (solid + outline support) */
.danger {
  background-color: #dc2626;
  color: #ffffff;
}
.outline.danger {
  background: transparent;
  border: 2px solid #dc2626;
  color: #dc2626;
}

/* -------------------- */
/* Mobile Adjustments */
/* -------------------- */
@media (max-width: 640px) {
body.widget-active {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  #widget-container,
  .banner-container {
    margin: 0 12px;
    max-width: 100%;
    border-radius: 2px;
  }

  #widget-container .reason-list {
    margin: 20px 10% 20px 10%;
  }

  #banner {
    flex-direction: column;
    align-items: stretch;
    text-align: left;
    gap: 6px;
  }

  .banner-buttons {
    justify-content: flex-start;
    width: 100%;
    margin-top: 8px;
  }

  .popup-content {
    max-width: 90%;
    padding: 16px;
  }

  .button-row button {
    min-width: auto;
    width: 100%;
  }

}

`;
