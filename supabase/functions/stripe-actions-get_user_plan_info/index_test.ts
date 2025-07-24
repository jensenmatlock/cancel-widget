import { getCorsHeaders, handler } from "./index.ts";
function assertEquals(a:unknown,b:unknown){if(a!==b)throw new Error(`Expected ${b}, got ${a}`);}
Deno.test("cors",()=>{const h=getCorsHeaders();assertEquals(h["Content-Type"],"application/json");});

Deno.test("missing params returns 400", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ data: {} }),
  });
  const res = await handler(req);
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.error.includes("Missing"), true);
});

Deno.test("returns plan info", async () => {
  const mockStripe = () => ({
    subscriptions: {
      retrieve: async () => ({
        customer: "cus_1",
        status: "active",
        items: { data: [{ price: { id: "p1", unit_amount: 1000, recurring: { interval: "month" }, product: { name: "Pro" } }, quantity: 1 }] },
        cancel_at: null,
      }),
      list: async () => ({ data: [] }),
    },
    subscriptionSchedules: {
      list: async () => ({ data: [] }),
    },
  });

  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ data: { stripe_key: "sk", subscription_id: "sub_1" } }),
  });
  const res = await handler(req, mockStripe);
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.plan_id, "p1");
});
