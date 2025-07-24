import { getCorsHeaders, handler } from "./index.ts";
function assertEquals(a:unknown,b:unknown){ if(a!==b) throw new Error(`Expected ${b}, got ${a}`); }
Deno.test("cors",()=>{const h=getCorsHeaders();assertEquals(h["Access-Control-Allow-Origin"],"*");});

Deno.test("missing account_id returns 400", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const res = await handler(req);
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.error, "Missing account_id");
});

Deno.test("returns plans", async () => {
  const fetchFn = async (_url: string, _opts?: any) =>
    new Response(JSON.stringify([{ access_token: "tok" }]), { status: 200 });
  const mockStripe = () => ({
    prices: {
      list: async () => ({
        data: [
          {
            id: "p1",
            recurring: { interval: "month" },
            unit_amount: 1000,
            deleted: false,
            product: { name: "Pro" },
          },
        ],
      }),
    },
  });

  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ account_id: "a1" }),
  });
  const res = await handler(req, { stripe: mockStripe, fetchFn });
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.plans[0].id, "p1");
});
