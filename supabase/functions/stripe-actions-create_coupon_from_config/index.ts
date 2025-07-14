import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

const supabaseUrl = Deno.env.get("PROJECT_URL");
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

console.log("✅ create_coupon_from_config function loaded");

serve(async (req) => {
  // ✅ Handle preflight (CORS) request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(),
    });
  }

  try {
    const { config, account_id } = await req.json();

    if (!account_id || !config?.discount) {
      return new Response(
        JSON.stringify({ error: "Missing account_id or config.discount" }),
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // 1. Fetch Stripe access_token from credentials
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

    // 2. Use connected account access token
    const stripe = Stripe(credentials.access_token, {
      apiVersion: "2022-11-15",
    });

    const { amount, duration, promo_code } = config.discount;

    if (!amount || !duration || !promo_code) {
      return new Response(
        JSON.stringify({ error: "Missing coupon config fields" }),
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // 3. Create the coupon
    const coupon = await stripe.coupons.create({
      percent_off: config.discount.type === "percent" ? amount : undefined,
      amount_off: config.discount.type === "dollar" ? Math.round(amount * 100) : undefined,
      duration: "repeating",
      duration_in_months: duration,
    });

    // 4. Create promo code with user-specified name
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: promo_code,
      max_redemptions: 1,
    });

    return new Response(JSON.stringify({ promo }), {
      status: 200,
      headers: getCorsHeaders(),
    });

  } catch (err) {
    console.error("❌ create_coupon_from_config error", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: err.message }),
      { status: 500, headers: getCorsHeaders() }
    );
  }
});

// 🔧 CORS headers
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}
