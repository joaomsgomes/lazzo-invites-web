# Lazzo Web

**Guest flow for invites, RSVP, and event memories.**

Lazzo Invites Web is the browser companion to the Lazzo iOS app. Guests open an invite link, RSVP, and upload photos without installing anything. Hosts create and manage events in the mobile app; this repo owns the entire guest-facing experience.

Main app repository: https://github.com/El-Proyecto/lazzo-web-version

---

## What this repository is

- **Guest-facing web experience** for event participation.
- **Primary route:** `/i/[token]` — token-gated invite page covering the full guest lifecycle: RSVP → photo upload → memory view.
- **Zero app install required** — designed to convert invite opens into contributions with no friction.

This is not the main app repository. Event creation is exclusive to the iOS app.

---

## Built with

- **Frontend:** Next.js 16 (App Router, React Server Components), React 19, TypeScript 5 (strict), Tailwind CSS 4, React Compiler (auto-memoization via Babel plugin)
- **Backend integration:** Supabase — PostgreSQL, RLS, Realtime (WebSocket channels), Storage, auth
- **Analytics:** PostHog JS 1.354 (Cloud EU) — full funnel instrumentation, platform-tagged events, feature flags
- **Hosting:** Vercel (preview deploys on PR, production on main via GitHub Actions)

---

## Architecture notes

**Hybrid rendering (Server + Client Components):**
- Server Components fetch event data via Supabase RPC — no client-side waterfalls on initial load.
- Client Components (`'use client'`) handle state, OTP auth flow, and real-time updates.
- PostHog is initialized at module scope (before `useEffect`) to capture server-rendered page views correctly.

**Dual Supabase client strategy:**

| Client | Key | Usage |
|---|---|---|
| `createBrowserSupabase()` | Anon | Client-side auth, RPC calls |
| `createServerSupabase()` | Anon + `no-store` | RSC data fetching (no caching) |
| `createServiceSupabase()` | Service role | Admin ops in API routes only |

The service role key is **never exposed to the browser** — used exclusively in server-side API routes for user provisioning and storage operations.

**Token-gated access:** Invite links carry tokens validated against the `event_invite_links` table (checked for expiry and revocation) in a Server Component before any data is returned.

**Guest authentication (OTP magic-link):**
- New guests enter email → receive OTP → JWT issued.
- Session persists in `localStorage` with 48-hour email fallback for repeat visits.
- Users are provisioned on-demand during photo upload (upsert on duplicate email) — no pre-registration needed.

**Dynamic OG/SEO metadata:** Each invite token generates server-side `<meta>` tags including event title, emoji, and host name. Produces rich previews in WhatsApp, iMessage, and social media cards without client-side rendering.

**Real-time sync:** Supabase Realtime channels (WebSocket) sync photo uploads and RSVP updates live between the web guest page and the native app.

**Design system:** Brand colors, spacing, and typography are defined as constants in `app/design/constants.ts` and kept in sync with the Flutter app's token system. No hardcoded hex values in components.

**API routes (server-side, service role):**
- `POST /api/upload-photo` — validates JWT or email session, provisions user, uploads to storage
- `GET /api/event-guests` — normalizes app participants + web guests into a unified list
- `GET /api/check-guest-rsvp` — RSVP status lookup
- `GET /api/event-photos` — photo fetching with signed URLs
- `POST /api/set-cover-photo` — cover photo management

---

## Running the project locally

**Prerequisites:** Node.js 20, npm.

1. Go to the web app folder:

```bash
cd invites-web
```

2. Install dependencies:

```bash
npm install
```

3. Create local env file:

```bash
cp .env.example .env.local
```

4. Start development server:

```bash
npm run dev
```

Open http://localhost:3000.

---

## Environment variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, never exposed to the browser

Analytics:

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (default: `https://eu.i.posthog.com`)

---

## How this connects to the app

- The app and this repo share the same Supabase backend (single PostgreSQL database).
- Invite links created in the app are consumed here via `/i/[token]`.
- Guest actions on web (auth, RSVP, photo uploads) feed the same event lifecycle and data layer used by the app.
- Photo uploads appear in the host's app in real time via Supabase Realtime.

---

## Current status

- **Production:** https://getlazzo.com
- **Role in beta:** guest participation surface for events created in the iOS app
- **Beta cohort (April 2026):** 25 invite opens → 19 RSVPs (76% conversion). Funnel tracked end-to-end via PostHog.

---

## Links

- **Website:** https://getlazzo.com
- **Main app repo:** https://github.com/El-Proyecto/lazzo-web-version

---

For architecture, coding rules, and agent guidelines, see `AGENTS.md` and `.agents/`.
