import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  try {
    const { current_price_id, stripe_key, account_id = "unknown" } = await req.json();

    if (!stripe_key || !current_price_id) {
      return badRequest("Missing stripe_key or current_price_id");
    }

    const stripe = Stripe(stripe_key, { apiVersion: "2022-11-15" });

    const currentPrice = await stripe.prices.retrieve(current_price_id);
    const currentInterval = currentPrice.recurring?.interval;
    const currentAmount = currentPrice.unit_amount || 0;

    const prices = await stripe.prices.list({ active: true, expand: ["data.product"] });

    const filtered = prices.data.filter((price) =>
      price.recurring &&
      price.recurring.interval === currentInterval &&
      price.unit_amount !== null &&
      price.unit_amount <= currentAmount
    ).map((price) => ({
      id: price.id,
      nickname: price.nickname || (price.product as any)?.name,
      amount: (price.unit_amount || 0) / 100,
      currency: price.currency,
      interval: price.recurring?.interval,
    }));

    return new Response(JSON.stringify({ plans: filtered }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    await logError("stripe_error", "get_valid_plans", err, account_id);
    return errorResponse("Plan filtering failed", err.message);
  }
});

async function logError(type, source, err, account_id) {
  await fetch("http://localhost:54321/rest/v1/error_logs", {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type,
      source,
      message: err.message,
      details: err,
      account_id,
      timestamp: new Date().toISOString()
    }),
  });
}

function badRequest(msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message, details) {
  return new Response(JSON.stringify({ error: message, details }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
