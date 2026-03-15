# Lazzo Web

**Guest flow for invites, RSVP, and event memories.**

Lazzo Invites Web is the browser companion to the Lazzo app. Guests open an invite link, RSVP, and upload photos without installing anything. Hosts still create and manage events primarily in the mobile app.

Main app repository:
- https://github.com/El-Proyecto/lazzo-web-version

---

## What this repository is

- **Guest-facing web experience** for event participation.
- **Primary route:** `/i/{token}` for invite access.
- **Companion scope:** RSVP, guest auth flow, and photo contribution.

This is not the main app repository.

---

## Built with

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend integration:** Supabase (auth, database, storage)
- **Analytics:** PostHog (optional)
- **Hosting:** Vercel

---

## Running the project locally

**Prerequisites:** Node.js and npm.

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
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (default: https://eu.i.posthog.com)

---

## How this connects to the app

- The app and this web repo share the same Supabase backend.
- Invite links created from the app are consumed here through `/i/[token]`.
- Guest actions on web (auth, RSVP, photos) feed the same event lifecycle used by the app.

---

## Current status

- **Production web:** https://getlazzo.com
- **Role in beta:** guest participation surface for events created in the app

---

## Links

- **Web companion repo:** https://github.com/El-Proyecto/lazzo-invites-web
- **Main app repo:** https://github.com/El-Proyecto/lazzo-web-version
- **Website:** https://getlazzo.com