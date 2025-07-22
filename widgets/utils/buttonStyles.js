// utils/buttonStyles.js
export function getButtonClass(type, config) {
  // Primary vs secondary color class
  const baseClass = type === 'primary' ? 'cta-primary' : 'cta-secondary';

  // Pull from config.theme_config, with fallbacks
  const style = config?.theme_config?.button_style || 'fill';
  const corners = config?.theme_config?.button_corners || 'rounded';

  // Map style to CSS class (our styles use `outline` vs `fill`)
  const styleClass = style === 'outline' ? 'outline' : ''; // default is fill, no class needed

  // Map corner types to class
  let cornerClass = 'rounded-btn';
  if (corners === 'sharp') cornerClass = 'sharp-btn';
  if (corners === 'pill') cornerClass = 'pill-btn';

  return `${baseClass} ${styleClass} ${cornerClass}`.trim();
}
