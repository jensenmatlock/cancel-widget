import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

const supabaseUrl = Deno.env.get("PROJECT_URL");
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

console.log("✅ get_valid_plans function loaded");

serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(),
    });
  }

  try {
    const { account_id, interval = "month" } = await req.json();

    if (!account_id) {
      return new Response(
        JSON.stringify({ error: "Missing account_id" }),
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // 1. Fetch access token from credentials
    const credsRes = await fetch(`${supabaseUrl}/rest/v1/credentials?account_id=eq.${account_id}&gateway=eq.stripe`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });

    const [credentials] = await credsRes.json();

    if (!credentials?.access_token) {
      return new Response(
        JSON.stringify({ error: "No Stripe credentials found for account" }),
        { status: 403, headers: getCorsHeaders() }
      );
    }

    // 2. Use connected account Stripe token
    const stripe = Stripe(credentials.access_token, {
      apiVersion: "2022-11-15",
    });

    // 3. Fetch prices with the specified interval
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
      limit: 100,
    });

    const filtered = prices.data.filter(
      (p) =>
        p.recurring?.interval === interval &&
        typeof p.unit_amount === "number" &&
        !p.deleted
    );

    const mapped = filtered.map((price) => ({
      id: price.id,
      name: typeof price.product === "object" ? price.product.name : price.id,
      price: `$${((price.unit_amount || 0) / 100).toFixed(2)}`,
      interval: price.recurring?.interval,
    }));

    return new Response(JSON.stringify({ plans: mapped }), {
      status: 200,
      headers: getCorsHeaders(),
    });

  } catch (err) {
    console.error("❌ get_valid_plans error", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: err.message }),
      { status: 500, headers: getCorsHeaders() }
    );
  }
});

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}
