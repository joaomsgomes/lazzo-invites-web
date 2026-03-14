# Architecture

**Repository:** lazzo-invites-web.

*Quick reference: Next.js App Router layout, invites-web/app/ and lib/, API routes, design tokens.*

## Repository layout

This repo contains the **invites-web** Next.js app. Typical layout:

```
invites-web/
├─ app/                    # Next.js App Router
│  ├─ design/              # design constants (BrandColors, Spacing, Typography)
│  ├─ i/[token]/           # invite flow: event page, RSVP, living, recap, sheets
│  ├─ providers/           # app-wide providers (e.g. PostHog)
│  ├─ privacy/             # privacy page
│  ├─ layout.tsx
│  ├─ page.tsx             # landing
│  └─ not-found.tsx
├─ lib/                    # shared logic and data access
│  ├─ supabase.ts          # Supabase client and types (event, guests, photos)
│  ├─ analytics.ts         # analytics helpers
│  └─ photoUtils.ts        # photo utilities
└─ app/api/                # API routes (e.g. event-guests, event-photos, set-cover-photo)
```

**Where to put things**

- Pages and UI for invite flow → `app/i/[token]/` (and nested components/sheets).
- Design tokens and shared UI constants → `app/design/constants`.
- Supabase client, types, and data helpers → `lib/`.
- Server-side or server-safe API endpoints → `app/api/`.
- App-wide providers → `app/providers/`.

For database schema and Supabase documentation, see [database.md](database.md).

## Responsibilities

- **app/** — Routes, pages, and UI components; use design tokens; no raw Supabase in components—use `lib/` or API routes.
- **lib/** — Supabase client, types (EventData, EventPhoto, GuestRecord, etc.), analytics; single place for backend access patterns.
- **app/api/** — Route handlers for external or server-side operations (e.g. fetching/updating event data, cover photo).

## Navigation and routing

- Next.js App Router; dynamic route `app/i/[token]/` for invite links.
- Use `Link` and router for in-app navigation; external links to main app where appropriate.
