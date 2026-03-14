# Lazzo Invites — Agent Guide

**Repository:** lazzo-invites-web (Next.js invites app).

**Audience:** engineering agents & copilots. **Goal:** ship invite-flow features fast without breaking the app. This repo is the **public invite web app** (Next.js, React); it shares the same Supabase backend as the main Flutter app (lazzo-web-version).

> **Key rule:** Use design tokens from `app/design/constants`; keep API and data access in `lib/` and route handlers. Do not duplicate backend logic—consume the same schema and APIs as the main app.

Full rules and workflows live in `.agents/`. Use the index below to load the relevant doc.

## Documentation index

- [architecture.md](architecture.md) — Repo layout, app/ and lib/ structure, API routes.
- [coding_rules.md](coding_rules.md) — Conventions, tokens, quality gates, what to avoid.
- [workflows.md](workflows.md) — Adding pages/routes, API routes, integrating with main app.
- [database.md](database.md) — Database docs (references main app); how this app uses the backend.

---

Keep this guide up to date. When in doubt: **tokenize, separate data access from UI, reference main app for schema and backend rules**.
