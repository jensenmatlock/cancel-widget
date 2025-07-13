export function getButtonClass(type, config) {
  const baseClass = type === "primary" ? "cta-primary" : "cta-secondary";

  const styleClass = config._styleClass || "fill";
  const cornerClass = config._cornerClass || "rounded-btn";

  return `${baseClass} ${styleClass} ${cornerClass}`;
}
