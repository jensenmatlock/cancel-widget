# SubJolt

Cancel flow widget and Stripe-powered save mechanisms for subscription recovery.

## Local Development

- Run `npm install`
- Add `.env` files to root and/or `widget/` with:
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`
- Dev build: `npm run dev`
- Prod build: `npm run build` → outputs to `site/widget.js`
- Run unit tests: `npm test`
- Run edge function tests: `deno test supabase/functions/<function>/`

## Supabase CLI

- Start local containers: `supabase start`
- Deploy edge functions: `supabase functions deploy`
