# Database & Supabase

**Repository:** lazzo-invites-web.

*Quick reference: this app uses the same Supabase backend as the main app; full schema and guidelines live in lazzo-web-version.*

## Where database documentation lives

This repository (**lazzo-invites-web**) is the Next.js invite web app. It uses the **same Supabase backend** as the main Flutter app. Schema, RLS, and performance guidelines are maintained in the main app repository.

**For schema source of truth, Supabase guidelines, and performance rules, see the main app documentation:**

- [lazzo-web-version/.agents/database.md](../lazzo-web-version/.agents/database.md)

The schema files `supabase_structure.sql` and `supabase_schema.sql` are maintained in the **lazzo-web-version** repository. Use them for lookups and runnable dumps when working on backend or shared data.

## How this app uses the database

- **Read-only and scoped writes:** Invite app typically reads event, guest, and photo data and may write RSVPs, photos, or cover photo via API routes.
- **Access pattern:** Data access is centralized in `lib/supabase.ts` and in `app/api/` route handlers; UI components do not call Supabase directly.
- **RLS:** All access respects the same Row Level Security policies as the main app; no service role or admin keys in this app.

When adding or changing server-side data access, follow the same minimal-select, indexing, and RLS rules described in the main app database documentation.
