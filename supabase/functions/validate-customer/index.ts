import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

let supabaseUrl = Deno.env.get('PROJECT_URL');
let supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY');

console.log('✅ validate-customer function loaded');

export async function handler(
  req: Request,
  deps: { supabase?: any } = {},
) {
  supabaseUrl = supabaseUrl || Deno.env.get('PROJECT_URL');
  supabaseServiceKey = supabaseServiceKey || Deno.env.get('SERVICE_ROLE_KEY');
  const supabase =
    deps.supabase || createClient(supabaseUrl, supabaseServiceKey);
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(),
    });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables.');
      return new Response(
        JSON.stringify({ error: 'Server misconfigured (missing env vars)' }),
        { status: 500, headers: getCorsHeaders() }
      );
    }

    const { account_id, domain } = await req.json();
    if (!account_id || !domain) {
      return new Response(
        JSON.stringify({ error: 'Missing account_id or domain' }),
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const normalizedDomain = domain.replace(/:\d+$/, '');

    // Fetch customer record
    const { data: customer, error: customerError } = await supabase
      .from('accounts')
      .select('*')
      .eq('account_id', account_id)
      .maybeSingle();

    if (customerError) {
      console.error('❌ Supabase customer query error:', customerError.message);
      return new Response(JSON.stringify({ error: 'Database query failed' }), {
        status: 500,
        headers: getCorsHeaders(),
      });
    }

    if (!customer) {
      return new Response(JSON.stringify({ error: 'Account not found' }), {
        status: 404,
        headers: getCorsHeaders(),
      });
    }

    const allowedDomains = customer.domain || [];
    if (!allowedDomains.includes(normalizedDomain)) {
      return new Response(JSON.stringify({ error: 'Unauthorized domain' }), {
        status: 403,
        headers: getCorsHeaders(),
      });
    }

    // Fetch Stripe credentials
    const { data: creds, error: credsError } = await supabase
      .from('credentials')
      .select('access_token, gateway')
      .eq('account_id', account_id)
      .maybeSingle();

    if (credsError) {
      console.error('❌ Supabase credentials query error:', credsError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to load credentials' }),
        { status: 500, headers: getCorsHeaders() }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        tier: customer.tier,
        credentials: {
          stripe_secret_key: creds?.access_token ?? null,
          gateway: creds?.gateway ?? null,
        },
      }),
      { status: 200, headers: getCorsHeaders() }
    );
  } catch (err) {
    console.error('validate-customer error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: getCorsHeaders(),
    });
  }
}

if (import.meta.main) {
  serve((req) => handler(req));
}

export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}
