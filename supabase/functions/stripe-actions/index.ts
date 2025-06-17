// supabase/functions/stripe-actions/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
});

serve(async (req) => {
  try {
    const { action, data } = await req.json();

    switch (action) {
      case "pause_subscription": {
        const subscriptionId = data.subscription_id;
        if (!subscriptionId) {
          return badRequest("Missing subscription_id");
        }

        const updated = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: { behavior: "mark_uncollectible" },
        });

        return success(`Subscription ${subscriptionId} paused`, updated);
      }

      case "apply_discount": {
        const { subscription_id, coupon_id } = data;
        if (!subscription_id || !coupon_id) {
          return badRequest("Missing subscription_id or coupon_id");
        }

        const updated = await stripe.subscriptions.update(subscription_id, {
          coupon: coupon_id,
        });

        return success(`Coupon ${coupon_id} applied to ${subscription_id}`, updated);
      }

      case "switch_plan": {
        const { subscription_id, new_price_id } = data;
        if (!subscription_id || !new_price_id) {
          return badRequest("Missing subscription_id or new_price_id");
        }

        // Get current subscription to preserve quantity
        const subscription = await stripe.subscriptions.retrieve(subscription_id);
        const currentItem = subscription.items.data[0];

        const updated = await stripe.subscriptions.update(subscription_id, {
          items: [{
            id: currentItem.id,
            price: new_price_id,
            quantity: currentItem.quantity || 1,
          }],
        });

        return success(`Subscription ${subscription_id} switched to ${new_price_id}`, updated);
      }

      case "cancel_subscription": {
        const subscriptionId = data.subscription_id;
        if (!subscriptionId) {
          return badRequest("Missing subscription_id");
        }

        const cancelled = await stripe.subscriptions.cancel(subscriptionId);

        return success(`Subscription ${subscriptionId} cancelled`, cancelled);
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }

  } catch (err) {
    console.error("❌ Stripe function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Utility: success response
function success(message: string, data: unknown) {
  return new Response(JSON.stringify({ message, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// Utility: 400 response
function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
