import { getCorsHeaders, handler } from "./index.ts";

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

Deno.test("domain normalization strips port", () => {
  const input = "example.com:8080";
  const normalized = input.replace(/:\d+$/, "");
  assertEquals(normalized, "example.com");
});

Deno.test("missing params returns 400", async () => {
  Deno.env.set("PROJECT_URL", "http://example.com");
  Deno.env.set("SERVICE_ROLE_KEY", "key");
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const res = await handler(req, { supabase: createStub() });
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.error, "Missing account_id or domain");
});

Deno.test("valid customer", async () => {
  Deno.env.set("PROJECT_URL", "http://example.com");
  Deno.env.set("SERVICE_ROLE_KEY", "key");
  const supabase = createStub();
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ account_id: "a1", domain: "example.com" }),
  });
  const res = await handler(req, { supabase });
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.valid, true);
  assertEquals(body.tier, "pro");
});

function createStub() {
  return {
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle: async () => {
          if (table === "accounts") {
            return { data: { domain: ["example.com"], tier: "pro" }, error: null };
          }
          if (table === "credentials") {
            return { data: { access_token: "sk", gateway: "stripe" }, error: null };
          }
          return { data: null, error: null };
        },
      } as any;
    },
  } as any;
}
