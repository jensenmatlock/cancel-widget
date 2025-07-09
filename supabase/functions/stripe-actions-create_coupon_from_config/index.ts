import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  try {
    const { amount, duration, promo_code, stripe_key, account_id = "unknown" } = await req.json();

    if (!stripe_key || !amount || !duration) {
      return badRequest("Missing required fields or Stripe key");
    }

    const stripe = Stripe(stripe_key, { apiVersion: "2022-11-15" });

    const couponParams = {
      percent_off: amount,
      duration: "repeating",
      duration_in_months: duration,
      name: promo_code,
    };

    const coupon = await stripe.coupons.create(couponParams);

    return new Response(JSON.stringify({ coupon_id: coupon.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    await logError("stripe_error", "create_coupon", err, account_id);
    return errorResponse("Coupon creation failed", err.message);
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
