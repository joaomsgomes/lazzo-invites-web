# Lazzo Invites — Agent Guide

**Repository:** lazzo-invites-web (Next.js invites app).

**Audience:** engineering agents & copilots. **Goal:** ship invite-flow features fast without breaking the app. This repo is the **public invite web app** (Next.js, React); it shares the same Supabase backend as the main Flutter app (lazzo-web-version). The invite link handles the whole event cycle; creating events is exclusive to the main app. Maintaining, fixing bugs, and improving or adding features are equally important.

| Task type | Load first |
|-----------|-------------|
| Fix a bug | [.agents/coding_rules.md](.agents/coding_rules.md), [.agents/workflows.md](.agents/workflows.md) |
| Small improvement | [.agents/coding_rules.md](.agents/coding_rules.md), [.agents/workflows.md](.agents/workflows.md) |
| New feature | [.agents/workflows.md](.agents/workflows.md), [.agents/architecture.md](.agents/architecture.md), [.agents/coding_rules.md](.agents/coding_rules.md) |
| Database change | [.agents/database.md](.agents/database.md), [.agents/workflows.md](.agents/workflows.md) |
| Refactoring | [.agents/architecture.md](.agents/architecture.md), [.agents/coding_rules.md](.agents/coding_rules.md) |

## Non-negotiable rules

Always read and follow these, regardless of task:

- **No direct Supabase in UI** — Use `lib/` and API routes for data access; components never call Supabase directly.
- **Tokens-only UI** — Use `app/design/constants` (BrandColors, Spacing, Typography); no hardcoded hex or magic numbers in components.
- **Reusable UI** — Shared design and constants in `app/design/`; keep data access and types in `lib/`.
- **Main app as backend source of truth** — Do not duplicate schema or backend logic; reference lazzo-web-version for schema and Supabase rules (see [.agents/database.md](.agents/database.md)).
- **Move-don't-delete** — When relocating components or code, move or replace; do not delete without a replacement.

## Repository structure

```
invites-web/
├─ app/                    design | i/[token] | providers | api
├─ lib/                    supabase client, types, analytics, utils
└─ (schema in main app)    supabase_structure.sql, supabase_schema.sql in lazzo-web-version
```

Schema source of truth lives in **lazzo-web-version** (see [.agents/database.md](.agents/database.md)).

Full rules and workflows live in `.agents/`. Use the index below to load the relevant doc.

## Documentation index

- [.agents/architecture.md](.agents/architecture.md) — Repo layout, app/ and lib/ structure, API routes.
- [.agents/coding_rules.md](.agents/coding_rules.md) — Conventions, tokens, quality gates, what to avoid.
- [.agents/workflows.md](.agents/workflows.md) — Adding pages/routes, API routes, integrating with main app.
- [.agents/database.md](.agents/database.md) — Database docs (references main app); how this app uses the backend.

---

When in doubt—whether fixing, improving, or adding—apply: **tokenize, separate data access from UI, reference main app for schema and backend rules, move-don't-delete**.
