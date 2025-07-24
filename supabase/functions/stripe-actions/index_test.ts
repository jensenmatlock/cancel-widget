import { getCorsHeaders, handler } from "./index.ts";

function assertEquals(a: unknown, b: unknown) {
  if (a !== b) throw new Error(`Expected ${b}, got ${a}`);
}

Deno.test("getCorsHeaders", () => {
  const h = getCorsHeaders();
  assertEquals(h["Content-Type"], "application/json");
});

Deno.test("missing stripe key returns 400", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ action: "cancel_pause", data: {} }),
  });
  const res = await handler(req);
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.error, "Missing Stripe key");
});

Deno.test("unpause_now success", async () => {
  const mockStripe = () => ({
    subscriptions: {
      create: async () => ({ id: "sub_123" }),
    },
  });

  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({
      action: "unpause_now",
      data: {
        stripe_key: "sk_test",
        customer_id: "cus_123",
        price_id: "price_123",
        account_id: "acct_1",
      },
    }),
  });

  const res = await handler(req, mockStripe);
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.subscription_id, "sub_123");
});
