# SubJolt

Cancel flow widget and Stripe-powered save mechanisms for subscription recovery.

## Local Development

- Install [Deno](https://deno.land) using `curl -fsSL https://deno.land/install.sh | sh` or your platform's installer
- If `deno test` fails to download modules due to TLS errors, ensure your CA certificates are up to date and run tests with `DENO_TLS_CA_STORE=system`
- Run `npm install`
- Add `.env` files to root and/or `widget/` with:
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`
  - `VITE_EDGE_BASE_URL=...`
- Dev build: `npm run dev`
- Prod build: `npm run build` → outputs files under `dist/`
- Run unit tests: `npm test`
- Run edge function tests: `DENO_TLS_CA_STORE=system deno test supabase/functions/<function>/` (may require network access)

## Supabase CLI

- Start local containers: `supabase start`
- Deploy edge functions: `supabase functions deploy`
