// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.6.0?target=deno';

const supabaseUrl = Deno.env.get('PROJECT_URL');
const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

console.log('✅ stripe-actions-get_user_plan_info function loaded');

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(),
    });
  }

  try {
    const body = await req.json();
    const data = body?.data;

    if (!data || !data.account_id || !data.subscription_id) {
      return new Response(
        JSON.stringify({ error: 'Missing account_id or subscription_id' }),
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const { account_id, subscription_id } = data;

    // 1. Fetch Stripe credentials for this account
    const credsRes = await fetch(
      `${supabaseUrl}/rest/v1/credentials?account_id=eq.${account_id}&gateway=eq.stripe`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const [credentials] = await credsRes.json();

    if (!credentials?.access_token) {
      return new Response(
        JSON.stringify({ error: 'No Stripe credentials found for account' }),
        { status: 403, headers: getCorsHeaders() }
      );
    }

    // 2. Use Stripe with connected account token
    const stripe = Stripe(credentials.access_token, {
      apiVersion: '2022-11-15',
    });

    // 3. Get subscription and current plan details
    const subscription = await stripe.subscriptions.retrieve(subscription_id);

    if (!subscription?.items?.data?.length) {
      return new Response(
        JSON.stringify({ error: 'No subscription items found' }),
        { status: 404, headers: getCorsHeaders() }
      );
    }

    const item = subscription.items.data[0];
    const price = await stripe.prices.retrieve(item.price.id, {
      expand: ['product'],
    });

    const response = {
      plan_id: price.id,
      plan_name:
        typeof price.product === 'object' ? price.product.name : price.id,
      plan_interval: price.recurring?.interval,
      plan_price: `$${((price.unit_amount || 0) / 100).toFixed(2)}`,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (err: any) {
    console.error('❌ get_user_plan_info error', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: err?.message || 'Unknown error',
      }),
      { status: 500, headers: getCorsHeaders() }
    );
  }
});

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}
