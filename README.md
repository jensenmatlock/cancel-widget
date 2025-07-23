# SubJolt

Cancel flow widget and Stripe-powered save mechanisms for subscription recovery.

## Local Development

- Install [Deno](https://deno.land) using `curl -fsSL https://deno.land/install.sh | sh` or your platform's installer
- Run `npm install`
- Add `.env` files to root and/or `widget/` with:
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`
  - `VITE_EDGE_BASE_URL=...`
- Dev build: `npm run dev`
- Prod build: `npm run build` → outputs to `site/widget.js`
- Run unit tests: `npm test`
- Run edge function tests: `deno test supabase/functions/<function>/` (may require network or certificate configuration)

## Supabase CLI

- Start local containers: `supabase start`
- Deploy edge functions: `supabase functions deploy`
