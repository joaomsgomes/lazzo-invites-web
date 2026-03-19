# Workflows

**Repository:** lazzo-invites-web.

*Quick reference: adding pages/routes, API routes, integrating with main app backend.*

## Adding a new page or section in the invite flow

1. Add or extend components under `app/i/[token]/` (or a new segment under `app/`).
2. Use design tokens from `app/design/constants`.
3. Fetch or mutate data via `lib/supabase` or existing API routes; do not call Supabase directly from UI components.
4. Add analytics where relevant via `lib/analytics`.

## Adding an API route

1. Create a route under `app/api/` (e.g. `app/api/my-action/route.ts`).
2. Use server-side Supabase client or existing helpers from `lib/`.
3. Validate input and return clear status codes and error messages.
4. Document the contract (method, body, response) in the route or a nearby README if non-trivial.

## Integrating with main app backend

- This app uses the **same** Supabase project and schema as lazzo-web-version. Schema and RLS are defined and maintained in the main app.
- For schema, types, and query patterns, see [database.md](database.md) (which points to lazzo-web-version documentation).
- When adding new server-side behavior, ensure it respects the same RLS and conventions as the main app; coordinate with P2/main app when changing schema or policies.
