export const getCopy = (keyPath, config = {}) => {
  const keys = keyPath.split(".");
  let current = config.copy;

  // Support global sections like "success.plan_switch.headline"
  if (keys[0] === "success") {
    current = config.copy?.success;
    keys.shift(); // Remove "success"
  }

  for (const key of keys) {
    if (!current || typeof current !== "object") {
      console.error(`❌ Missing copy: "${keyPath}" — path invalid at "${key}"`);
      return `[missing-copy:${keyPath}]`;
    }
    current = current[key];
  }

  if (current === undefined) {
    console.error(`❌ Missing copy: "${keyPath}" — value not defined`);
    return `[missing-copy:${keyPath}]`;
  }

  return current;
};
