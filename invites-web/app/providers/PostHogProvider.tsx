'use client';

import { useEffect } from 'react';
import { initPostHog } from '../../lib/analytics';

// ═══════════════════════════════════════════════════════════════════
// PostHogProvider — Initializes PostHog on the client side.
//
// Added to the root layout. Runs once on mount.
// Does NOT use React context — analytics is accessed via
// direct imports from lib/analytics.ts (module singleton).
// ═══════════════════════════════════════════════════════════════════

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}
