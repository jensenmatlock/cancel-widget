import { getCorsHeaders } from "./index.ts";

function assertEquals(a: unknown, b: unknown) {
  if (a !== b) throw new Error(`Expected ${b}, got ${a}`);
}

Deno.test("getCorsHeaders", () => {
  const h = getCorsHeaders();
  assertEquals(h["Content-Type"], "application/json");
});
