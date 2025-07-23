import { getCorsHeaders } from "./index.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}`);
  }
}

Deno.test("getCorsHeaders returns expected headers", () => {
  const headers = getCorsHeaders();
  assertEquals(headers["Content-Type"], "application/json");
  assertEquals(headers["Access-Control-Allow-Origin"], "*");
});
