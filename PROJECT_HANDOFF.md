# PROJECT_HANDOFF.md (RentNest)

_Last updated: Phase 8 (nearby fix, delete fix, animated home). Before that, Phase 7 (map pin picker, enquiry chat, listings-disappear fix, ~92 sample listings + university PG filter). Module graph bundles with bun and pure logic is unit-tested; `npm run build`, the browser UI and ALL Supabase paths are UNTESTED (sandbox cannot reach the npm registry or Supabase)._

## Overview
RentNest: unified rental + shared-living marketplace (students, professionals, families, individuals, owners).
Stack: React 18 + Vite 5, JavaScript only, React Router 6, plain CSS, lucide-react, Supabase (Postgres/Auth/Storage), Leaflet + react-leaflet 4 + OSM tiles, Gemini via `api/gemini.js` (Vercel). Deploy: Vercel + GitHub.
Rule: demo-data fallback whenever Supabase/Gemini isn't configured. Never expose Gemini key or service-role key to the frontend.

## Completed
- Vite project config, package.json, vercel.json (SPA rewrite), .gitignore, .env.example
- Router with all routes (placeholder pages), Layout, responsive Navbar, Footer
- Global CSS design tokens + buttons/cards/chips/navbar/footer (coral accent #f0562e, Plus Jakarta Sans)
- `src/lib/supabase.js` (exports `supabase` or null, and `isSupabaseConfigured`)
- `src/lib/gemini.js` client helper -> POST /api/gemini; returns `{ok,text,source}`
- `api/gemini.js` serverless proxy (tasks: recommend, search, roommate, summarize; 503 if no key)

- Phase 2: demo data (12 properties, `src/data/properties.js` with CATEGORIES, PROPERTY_TYPES, FURNISHING, AMENITIES, MAX_RENT, formatINR, categoryLabel, DEMO_OWNER_ID)
- Hooks: `useStoredList` (+ `useFavorites`, `useCompare` max 3, synced via window event), `useProperties`/`useProperty` (demo + `rentnest_demo_listings`)
- Components: SafeImage (fallback on broken URL), PropertyCard (save + compare), CompareBar (global tray in Layout)
- Marketplace: `features/marketplace/filterProperties.js` + `Filters.jsx`; pages Properties (search, filters, sort; reads ?q=&max=&category=), PropertyDetail (gallery, amenities, demo enquiry -> `rentnest_demo_enquiries`), Compare (/compare)
- Home: Hero (location+budget search), AudienceTabs (4 audiences), Featured, SharedPromo, Benefits, OwnerCta

- Phase 3 shared living: `data/roommates.js` (8 profiles, SHARING_TYPES), `features/shared-living/matching.js` (scoreMatch: budget 30, location 25, sharing 15, lifestyle 30; rankMatches, explainRule, summaryRule), `RoommateCard.jsx` (score ring, tags, "Why this match?" -> Gemini 'roommate' w/ rule fallback, shortlist -> `rentnest_roommate_saved`), `pages/SharedLiving.jsx` (preferences persisted in `rentnest_roommate_prefs`, ranked cards, "Recommend my best match" -> Gemini 'roommates' w/ rule fallback). api/gemini.js has task 'roommates'.
- Phase 3 owner portal (demo mode, localStorage): `features/owner/{listingsApi.js, PropertyForm.jsx, MyListings.jsx, EnquiriesPanel.jsx}`, `pages/OwnerPortal.jsx`; photo upload via `lib/storage.js` (data-URL resize in demo; Supabase Storage bucket `property-images` branch written but UNTESTED); `lib/localStore.js` (readJSON/writeJSON + STORAGE_EVENT); `hooks/useCurrentUser.js` is a PLACEHOLDER returning id 'local-owner'; `useProperties` now reactive to localStorage. `CITY_COORDS` exported from data/properties.js.

- Phase 4: `supabase/schema.sql` (5 tables, constraints, indexes, RLS, signup trigger creating profile, `property-images` bucket + policies; README has setup steps). `context/AuthContext.jsx` (Supabase Auth when configured; else DEMO login in `rentnest_demo_user`, demo user id 'local-owner', UI states it is NOT secure), `components/RequireAuth.jsx` (guards /owner, /dashboard), `pages/AuthForm.jsx` (+Login/Register), Navbar shows user/logout. `useCurrentUser()` returns user or null. `hooks/useProperties.js`: Supabase rows if table non-empty, else demo + local listings; refetch on DATA_EVENT. `features/owner/listingsApi.js` is async w/ Supabase branches: saveListing, deleteListing, setAvailability, submitEnquiry (real DB only for uuid property ids + logged-in user; demo properties stay local), getEnquiries(userId), setEnquiryStatus. EnquiriesPanel takes userId.

## Local Gemini (no Vercel)
`vite.config.js` has a dev-only plugin that serves `/api/gemini` by running `api/gemini.js` inside `npm run dev`; it loads `GEMINI_API_KEY`/`GEMINI_MODEL` from `.env` (Node side only, never in the client bundle). Verified: no key -> 503, GET -> 405, key present -> reaches Google call. Default model `gemini-flash-latest` (gemini-2.0-flash is deprecated).

## Nearby stays (real data, no keys)
`/nearby` (`pages/Nearby.jsx`, `lib/overpass.js`, `features/nearby/NearbyMap.jsx`): real PGs/hostels/guest houses from OpenStreetMap via the free Overpass API, cached 24h in localStorage, with map+list, type/radius/name filters, phone/website when mapped, "Open in Google Maps" link. NO rent/availability exists in this data and none is invented. Live Overpass NOT tested from sandbox (parser + UI tested with a mocked response, incl. error state). Google Maps/Places API NOT used (no rent data, billing required, ToS forbids scraping/storing). Real rentals must come from Supabase `properties` (owners or CSV import).

## Phase 6 (DONE)
- Dashboard: `features/dashboard/DashboardSections.jsx` (ProfileCard w/ edit name + logout + demo "not secure" notice, SavedProperties, SentEnquiries, OwnerSummary) + `pages/Dashboard.jsx`. AuthContext gained `updateProfile({name})`.
- `listingsApi.getSentEnquiries(userId)`; demo enquiries now store `sender_id`.
- Roommate profile: `features/shared-living/{profilesApi.js, MyProfileForm.jsx}`; demo key `rentnest_my_roommate`; Supabase `roommate_profiles` upsert/delete/list branches (UNTESTED). SharedLiving ranks remote profiles + demo ones; own profile is NOT ranked against yourself.
- Favourites sync: `lib/FavoritesSync.jsx` (mounted in Layout) merges server favourites on login and mirrors uuid-property toggles to `favorites` (UNTESTED). Demo = localStorage only.
- Polish: ErrorBoundary around routes and map, lazy-loaded map (`features/maps/LazyMap.jsx`, main bundle ~497 kB), skip link, removed PagePlaceholder and .gitkeep files, market bar wraps on mobile, avatar override on dashboard.
- README: features + Vercel deploy steps.

## Phase 7 (DONE, this session)
1. **Map pin picker** (replaces lat/lng inputs): `features/maps/LocationPicker.jsx` + `LazyLocationPicker.jsx` (lazy, ErrorBoundary). Click map / drag pin / search a place (OSM Nominatim, one request per submit, India only) / "Use my location". New listings REQUIRE a pin ("Drop a pin..."). Changing city re-frames the map and clears the pin only if it is >40 km from the new city. Form shows "About X km from <university>".
2. **Chat per enquiry**: `features/chat/{chatApi.js, ChatThread.jsx}`. Thread = one enquiry; the enquiry's own message is the first bubble. Shown (a) inline on PropertyDetail right after sending an enquiry, (b) Dashboard "Recent enquiries" -> "Chat with owner", (c) Owner portal Enquiries -> "Chat". Remote (uuid enquiry + Supabase): table `messages`, Realtime INSERT subscription + 10 s poll fallback. Demo: localStorage key `rentnest_demo_messages` (`{id, enquiry_id, role, body, created_at, auto?}`); sample listings (owner_id `demo-owner-*`) get a clearly labelled "Demo auto-reply" after 1.2 s. First owner reply flips enquiry status new -> contacted. `listingsApi`: `submitEnquiry` now returns `{ok, remote, enquiry}`; `getEnquiries`/`getSentEnquiries` merge remote + local demo enquiries and include `sender_id`/`owner_id`.
3. **Disappearing listings bug FIXED**: `hooks/useProperties.js` used to show ONLY Supabase rows once the table had any row, hiding every sample/local listing the moment one real listing was saved. Now `mergeProperties(remote, local)` = remote + local + samples, de-duplicated by id (exported + unit-tested). Also photos are compressed harder (720px, q0.6) so demo-mode localStorage quota is hit later.
4. **Sample data + university filter**: `data/dummyListings.js` (GENERATED, 92 fictional listings: Patiala, Rajpura, Chandigarh, Mohali (incl. Gharuan/Landran/Kharar), Zirakpur, Panchkula, Phagwara, Ambala, Kurukshetra, Karnal, Rohtak, Gurugram; ~58 student / 16 professional / 17 family / 13 individual; 49 PG/Hostel). `data/properties.js`: `DEMO_PROPERTIES = [12 original, ...92 generated]`, `isSampleListing()`, `CITY_COORDS` now 14 cities. `data/universities.js`: Chitkara, CU, CGC Landran, LPU, Thapar, PU, Punjabi Univ., KUK, MDU, MMU with approximate coords + `distanceKm`, `distanceToUniversity`, `nearestUniversity`. New property field `pg_for` (Boys|Girls|Co-ed). Filters: `university`, `maxDistance` (km, 0=any), `pgOnly`, `pgFor` in `DEFAULT_FILTERS`; sidebar block "PG near a university", quick chip strip on /properties, URL `?university=<id>`, sort "Nearest to <uni>", distance shown on cards. Distance is computed from coordinates at runtime (works for owner-added listings too).
- **Supabase: RE-RUN `supabase/schema.sql`** (idempotent): adds `properties.pg_for`, table `messages`, `is_enquiry_party()`, RLS, Realtime publication. If `pg_for` is missing, `saveListing` retries without it; chat on real enquiries needs the `messages` table.
- Sample data is fictional with approximate coordinates; it is always shown (also with Supabase on) by design. To hide it later, drop `DUMMY_PROPERTIES` from `DEMO_PROPERTIES` or filter with `isSampleListing`.
- The generator is not in the repo (output committed). To tweak data, edit `dummyListings.js` directly or regenerate with a seeded script.

## Phase 8 (DONE): fixes + home redesign
- **Nearby stays**: `lib/overpass.js` now tries 4 public Overpass servers in turn (30 s timeout each, rejects non-`elements` bodies such as "runtime error"); Nearby page error shows Try again + link to RentNest listings. Falls back to 24 h cache (stale) as before. Unit-tested with a mocked fetch; live Overpass still UNTESTED.
- **Delete bug**: `deleteListing`/`setAvailability` sent non-uuid ids (`local-123`, listings made in demo mode) to Supabase, which failed silently, so they came back on reload. Now non-uuid ids are handled in localStorage; Supabase deletes use `.select()` so an RLS-blocked delete (0 rows) is reported as failure; `MyListings` alerts on failure. Built-in sample listings are not owned by anyone and cannot be deleted.
- **Home page**: `components/Reveal.jsx` (`Reveal` scroll-reveal with variants up/pop/zoom/left/right + stagger `delay`, `CountUp`), `hooks/useInView.js`, `components/ScrollProgress.jsx` (in Layout). New hero (aurora blobs, line-by-line headline, gradient text, scroll parallax collage, floating glass chips, live stats), `Marquee`, `UniversityShowcase` (tiles link to `/properties?university=<id>`), `HowItWorks`, animated promo/benefits/owner CTA, card hover zoom/glow. All CSS is in the "Home page motion & polish" block at the end of `index.css`. `prefers-reduced-motion` disables the animations. Visual result UNTESTED in a browser (no npm registry in sandbox); check mobile widths.

## Incomplete / ideas if time remains
- Test all Supabase paths with real keys (user does this): schema.sql, auth, storage upload, enquiries, favorites, roommate_profiles.
- No per-user inbox for roommate contact (profiles show no contact details by design).
- Chat has no unread badge / email notification and no /messages inbox page (threads live under enquiries). Demo owner and seeker share one browser, so the owner side is only testable by switching demo user/role.
- Nominatim search in the pin picker is a public service with rate limits; replace with a hosted geocoder if traffic grows.
- Demo enquiries list for owners shows ALL local enquiries (demo only).
- No account deletion (needs a server function with service role; do not do from frontend).
- Optional: check Unsplash images load, add tests, eslint.

## Routes (unchanged in Phase 7; `/properties?university=cu` added)
/ , /properties , /properties/:id , /compare , /shared-living , /owner , /dashboard , /login , /register , * (404). Placeholder still: dashboard (guarded by RequireAuth). /owner and /dashboard redirect to /login when signed out.

## Folder structure
src/{components,pages,features/{home,marketplace,shared-living,dashboard,owner,maps,ai},lib,hooks,data}, supabase/schema.sql, api/gemini.js

## Dependencies
react, react-dom, react-router-dom, lucide-react, leaflet, react-leaflet@4, @supabase/supabase-js; dev: vite, @vitejs/plugin-react

## Supabase
Not configured yet (user will add keys later). `supabase/schema.sql` is COMPLETE (profiles, properties, favorites, roommate_profiles, enquiries; RLS; signup trigger; `property-images` bucket + policies). Code has Supabase branches guarded by `isSupabaseConfigured`; all untested against a real project.

## Gemini: scaffolded (api/gemini.js, lib/gemini.js), no UI yet, untested. Map: not started (react-leaflet@4 + OSM tiles with attribution; add List/Map toggle on Properties).

## Data structures / localStorage keys
`rentnest_favorites` (ids), `rentnest_compare` (ids, max 3), `rentnest_demo_listings` (owner-added properties), `rentnest_roommate_prefs`, `rentnest_roommate_saved` (ids), `rentnest_demo_enquiries` (objects: id, property_id, property_title, owner_id, name, phone, message, status, created_at). `rentnest_demo_user` (demo login user object), `rentnest_demo_messages` (chat messages).
Property shape (+ optional `pg_for` for PG/Hostel): id, owner_id, title, description, category(student|professional|family|individual), property_type, city, locality, latitude, longitude, monthly_rent, security_deposit, bedrooms, bathrooms, furnishing, amenities[], images[], available, created_at.

## Handoff log
- HANDOFF #3 after Phase 5. HANDOFF #4 after Phase 6. HANDOFF #5 after Phase 7. HANDOFF #6 after Phase 8 (this file).
- HANDOFF #1 issued after Phase 1 (superseded). HANDOFF #2 issued after Phase 4. Next account starts Phase 5.
- User will configure Supabase/Gemini/Vercel later; build everything fully on demo fallbacks first.
- Open question: name is RentNest (original brief once said "Nestora").

## Known bugs / risks
- `npm install` and `npm run build` not yet run (sandbox had no registry access); verify first, then click through: pin picker, chat (3 places), university chips, owner add-property keeps samples.
- Unsplash image IDs unverified; SafeImage shows a placeholder if any fail.
- CSS `.grid` cards use `.pcard__body` bottom padding for the action buttons; check mobile.

## Exact next task
Phase 7 is done. Next account should: (1) `npm install && npm run build`, (2) run the app and click through every route in demo mode, (3) after the user adds keys, test Supabase + Gemini paths and fix issues, (4) deploy per README. Do not rebuild anything.
