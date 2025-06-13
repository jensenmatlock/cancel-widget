export function applyTheme(config = {}) {
  const theme = config.theme_config || {};
  const root = document.documentElement;

  // Load Google Font if specified
  if (theme.font) {
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.font)}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);

    root.style.setProperty("--font-family", `${theme.font}, sans-serif`);
  }

  // Font colors
  if (theme.title_font_color) {
    root.style.setProperty("--title-font-color", theme.title_font_color);
  }

  if (theme.body_font_color) {
    root.style.setProperty("--body-font-color", theme.body_font_color);
  }

  // Button background colors
  if (theme.primary_button_color) {
    root.style.setProperty("--primary-button-color", theme.primary_button_color);
  }

  if (theme.secondary_button_color) {
    root.style.setProperty("--secondary-button-color", theme.secondary_button_color);
  }

  // Button text colors
  if (theme.primary_button_font_color) {
    root.style.setProperty("--primary-button-font-color", theme.primary_button_font_color);
  }

  if (theme.secondary_button_font_color) {
    root.style.setProperty("--secondary-button-font-color", theme.secondary_button_font_color);
  }
}
