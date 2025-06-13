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

#widget-container {
  background: #ffffff;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  max-width: 500px;
  margin: 40px auto;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-sizing: border-box;
  text-align: center;
}

#widget-container .popup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

#widget-container .button-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 36px;
}

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

/* Mobile */
@media (max-width: 640px) {
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  #widget-container {
    margin: 0 12px;
    max-width: 100%;
    border-radius: 2px;
  }
  
  #widget-container .reason-list {
    margin: 20px 10% 20px 10%;
  }
}

#widget-container h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--title-font-color);
  margin-bottom: 1rem;
}

#widget-container p {
  font-size: 1rem;
  color: var(--body-font-color);
  margin-bottom: 16px;
}

#widget-container textarea {
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

#widget-container select {
  width: 100%;
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

#widget-container button {
  font-size: 1rem;
  padding: 12px 16px;
  border-radius: var(--button-corners);
  border: none;
  cursor: pointer;
  min-width: 140px;
  transition: background-color 0.2s ease, border 0.2s ease;
  box-sizing: border-box;
}

#widget-container .cta-primary {
  background-color: var(--primary-button-color);
  color: var(--primary-button-font-color);
}

#widget-container .cta-secondary {
  background-color: var(--secondary-button-color);
  color: var(--secondary-button-font-color);
}

#widget-container .outline.cta-primary {
  background: transparent;
  border: 2px solid var(--primary-button-color);
  color: var(--primary-button-color);
}

#widget-container .outline.cta-secondary {
  background: transparent;
  border: 2px solid var(--secondary-button-color);
  color: var(--secondary-button-color);
}

#widget-container .rounded-btn {
  border-radius: 8px;
}

#widget-container .sharp-btn {
  border-radius: 0px;
}

#widget-container .pill-btn {
  border-radius: 999px;
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

`;