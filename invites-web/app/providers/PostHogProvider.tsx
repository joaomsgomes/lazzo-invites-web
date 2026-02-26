'use client';

import { initPostHog } from '../../lib/analytics';

// ═══════════════════════════════════════════════════════════════════
// PostHogProvider — Initializes PostHog synchronously during hydration.
//
// Intentionally does NOT use useEffect — PostHog must be ready before
// any child component's useEffect fires (React runs child effects
// before parent effects, so a parent useEffect would be too late).
//
// initPostHog() is idempotent (guarded by _initialized flag) and
// safe to call during render — it no-ops on the server via
// the typeof window === 'undefined' guard inside it.
// ═══════════════════════════════════════════════════════════════════

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Synchronous init — runs during client hydration before any child effects
  initPostHog();

  return <>{children}</>;
}
