import { getCorsHeaders, handler } from "./index.ts";
function assertEquals(a:unknown,b:unknown){if(a!==b)throw new Error(`Expected ${b}, got ${a}`);}
Deno.test("cors",()=>{const h=getCorsHeaders();assertEquals(h["Content-Type"],"application/json");});

Deno.test("missing fields returns 400", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ config: {}, account_id: null }),
  });
  const res = await handler(req);
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.error.includes("Missing"), true);
});

Deno.test("creates promo code", async () => {
  const fetchFn = async (_url: string, _opts?: any) =>
    new Response(JSON.stringify([{ access_token: "tok" }]), { status: 200 });
  const mockStripe = () => ({
    coupons: { create: async () => ({ id: "c1" }) },
    promotionCodes: { create: async () => ({ id: "p1" }) },
  });

  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({
      account_id: "a1",
      config: { discount: { amount: 10, duration: 1, promo_code: "SAVE", type: "percent" } },
    }),
  });
  const res = await handler(req, { stripe: mockStripe, fetchFn });
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.promo.id, "p1");
});
