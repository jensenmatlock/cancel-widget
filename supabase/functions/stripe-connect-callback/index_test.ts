import { getCorsHeaders, handler } from "./index.ts";
function assertEquals(a:unknown,b:unknown){if(a!==b)throw new Error(`Expected ${b}, got ${a}`);}
Deno.test("cors",()=>{const h=getCorsHeaders();assertEquals(h["Access-Control-Allow-Origin"],"*");});

Deno.test("missing params", async () => {
  const req = new Request("https://example.com/callback", { method: "GET" });
  const res = await handler(req);
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.error.includes("Missing"), true);
});

Deno.test("success redirect", async () => {
  const fetchFn = async (_url: string) =>
    new Response(JSON.stringify({
      stripe_user_id: "acct_1",
      access_token: "tok",
      livemode: false,
      refresh_token: "ref",
    }), { status: 200 });

  const req = new Request("https://example.com/callback?code=c&state=a", { method: "GET" });
  const res = await handler(req, fetchFn);
  assertEquals(res.status, 302);
});
