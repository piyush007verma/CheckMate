# RentNest

Rental and shared-living marketplace. React + Vite (JavaScript), Supabase, Leaflet/OpenStreetMap, Gemini via a Vercel serverless function.

## Run locally
```bash
npm install
cp .env.example .env     # optional: app runs on demo data without it
npm run dev
```
Build check: `npm run build`

## Environment
| Variable | Where | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | frontend | anon key only (RLS protects data) |
| `GEMINI_API_KEY` | server only | used by `api/gemini.js`; never `VITE_` prefixed |
| `GEMINI_MODEL` | server only | default `gemini-flash-latest` |

Without Supabase vars: demo data and demo login (not secure, for demonstration only).
Without Gemini key: `/api/gemini` returns 503 and the UI uses rule-based fallbacks.

Local dev: `npm run dev` also serves `/api/gemini` (see `vite.config.js`) and reads `GEMINI_API_KEY` from `.env`, so no Vercel is needed locally. On Vercel the `api/` folder is used instead.

## Features
Marketplace (search, filters, sort, favourites, compare, list/map view with Leaflet + OpenStreetMap), shared living (compatibility scoring, create-your-roommate-profile), owner portal (add/edit/delete, photo upload, availability, enquiries), user dashboard (profile, saved, enquiries, listings), Smart search / Picks for you / property summaries / roommate explanations (Gemini when configured, rule-based otherwise).

Everything works with **no keys**: demo data, a clearly labelled demo login (not secure) and rule-based AI. Keys only switch on the real services.

## Deploy to Vercel
1. Push the repo to GitHub (`.env` is git-ignored; never commit keys).
2. Vercel > Add New Project > import the repo. Framework preset: Vite (build `npm run build`, output `dist`).
3. Settings > Environment Variables (Production + Preview), all optional at first:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public anon key only; never the service-role key)
   - `GEMINI_API_KEY` (server-side only, used by `api/gemini.js`), optional `GEMINI_MODEL` (default `gemini-flash-latest`)
4. Deploy. `vercel.json` handles SPA routing and the `/api` function.
5. After adding or changing env vars, redeploy (Vite bakes `VITE_*` values at build time).
6. Supabase: Authentication > URL Configuration, set Site URL to your Vercel URL and add it to Redirect URLs.
7. Check: `/api/gemini` should answer 405 to a GET (function is live); Smart search should then say "Interpreted by Gemini".

Map tiles come from the public OpenStreetMap tile server with attribution, which is fine for light/demo traffic. For production-scale traffic use a tile provider or self-host (see OSM Tile Usage Policy).

## Supabase setup
1. Create a project at supabase.com. Copy the Project URL and anon key into `.env` (and Vercel env vars).
2. SQL Editor: paste and run `supabase/schema.sql` (tables, RLS, profile trigger, `property-images` storage bucket).
3. Authentication > Providers: Email is enabled by default. For quick demos, turn off "Confirm email" under Auth settings.
4. Restart `npm run dev`. The navbar and login pages switch from demo mode to real Supabase Auth automatically.

Once the `properties` table has rows, the marketplace shows those instead of the built-in demo listings.


## Upgrading an existing Supabase project
Re-run `supabase/schema.sql` in the SQL Editor (safe to repeat). It adds `properties.pg_for`, the `messages` table (enquiry chat) and its policies/Realtime.
