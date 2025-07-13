export function applyTheme(config = {}) {
  const theme = config.theme_config || {};
  const root = document.documentElement;

  // Safely set font with timeout
  if (theme.font) {
    const fontName = theme.font;
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}&display=swap`;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontUrl;

    let fontLoaded = false;

    const timeout = setTimeout(() => {
      if (!fontLoaded) {
        console.warn("⚠️ Google Font load timed out. Falling back to sans-serif.");
        root.style.setProperty("--font-family", `sans-serif`);
      }
    }, 2000);

    link.onload = () => {
      fontLoaded = true;
      clearTimeout(timeout);
      root.style.setProperty("--font-family", `'${fontName}', sans-serif`);
      console.log("✅ Google Font loaded:", fontName);
    };

    link.onerror = () => {
      clearTimeout(timeout);
      console.warn("❌ Failed to load Google Font:", fontName);
      root.style.setProperty("--font-family", `sans-serif`);
    };

    document.head.appendChild(link);
  } else {
    // fallback if no font set
    root.style.setProperty("--font-family", `sans-serif`);
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
