import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const stripeClientId = Deno.env.get('STRIPE_CLIENT_ID');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('PROJECT_URL');
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY');

console.log('✅ stripe-connect-callback function loaded');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(),
    });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  console.log('🧪 Stripe callback params:', { code, state, error });

  if (error) {
    return new Response(
      JSON.stringify({ error: 'User denied Stripe access' }),
      {
        status: 400,
        headers: getCorsHeaders(),
      }
    );
  }

  if (!code || !state) {
    return new Response(
      JSON.stringify({ error: 'Missing code or state from Stripe callback' }),
      {
        status: 400,
        headers: getCorsHeaders(),
      }
    );
  }

  const tokenRes = await fetch('https://connect.stripe.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: stripeClientId || '',
      client_secret: stripeSecret || '',
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error('❌ Stripe token exchange failed:', tokenData);
    return new Response(
      JSON.stringify({ error: 'Token exchange failed', details: tokenData }),
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }

  const { stripe_user_id, access_token, livemode, refresh_token } = tokenData;

  console.log('🧪 Insert Stripe credentials for account:', state);

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/credentials`, {
    method: 'POST',
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      account_id: state,
      gateway: 'stripe',
      access_token,
      refresh_token,
      external_id: stripe_user_id,
      livemode,
    }),
  });

  const insertData = await insertRes.json();

  if (!insertRes.ok) {
    console.error('❌ Insert into credentials table failed:', insertData);
    return new Response(
      JSON.stringify({
        error: 'Failed to store credentials',
        details: insertData,
      }),
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: 'https://yourdomain.com/success?connected=true', // Replace with real destination
      ...getCorsHeaders(),
    },
  });
});

export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
