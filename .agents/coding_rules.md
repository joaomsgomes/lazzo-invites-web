# Coding rules

**Repository:** lazzo-invites-web.

*Quick reference: tokens, TypeScript/React conventions, quality gates, what to avoid.*

## Design tokens

- Use `app/design/constants` for colors (`BrandColors`), spacing (`Spacing`), and typography (`Typography`).
- Do not hardcode hex values or magic numbers in components; use the same token set as the main app where applicable.

## Quality gates

- TypeScript strict; no `any` without justification.
- Components use design tokens; no inline styles with raw pixel/hex values.
- API keys and secrets only in env; never in client code.
- Small, focused components; shared logic in `lib/`.

### Required analyzers (before opening a PR)

- **Always run** `npm run lint` in the `invites-web/` directory after any code change.
- Do not ignore any warnings or errors introduced by your changes; fix them before opening a PR.

## Naming and conventions

- Components: PascalCase. Files: PascalCase for components (e.g. `EventPage.tsx`), camelCase or kebab-case for utilities.
- API routes: kebab-case in path (e.g. `set-cover-photo`, `event-guests`).
- Keep naming aligned with main app where concepts overlap (events, guests, photos).

## What agents must avoid

- Hardcoding Supabase URLs or anon keys in source.
- Duplicating backend/schema logic that lives in lazzo-web-version; reference main app docs and schema.
- Putting business or schema rules in the UI layer; keep them in `lib/` or API routes.
- Skipping error handling and loading states in invite flows.
