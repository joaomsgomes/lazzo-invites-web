'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

// ═══════════════════════════════════════════════════════════════════
// PostHogProvider — Single 'use client' boundary for PostHog init.
//
// posthog-js queues posthog.capture() calls made before init and
// flushes them automatically once init completes. So child components
// firing events in their useEffect (even before this one runs) works
// correctly — events are buffered and sent after init.
// ═══════════════════════════════════════════════════════════════════

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

    if (!key) {
      console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set — analytics disabled');
      return;
    }

    if (posthog.__loaded) {
      console.log('[PostHog] already initialized');
      return;
    }

    console.log(`[PostHog] init — host: ${host}, key: ${key.slice(0, 12)}...`);

    posthog.init(key, {
      api_host: host,
      ui_host: 'https://eu.posthog.com',

      // Cost-safe: disable all auto-collection
      autocapture: false,
      disable_session_recording: true,
      capture_pageview: false,
      capture_pageleave: false,

      // Disable feature flags — not used on web
      advanced_disable_feature_flags: true,

      // Privacy
      respect_dnt: true,
      persistence: 'localStorage',

      loaded: (ph) => {
        console.log(`[PostHog] ready — distinct_id: ${ph.get_distinct_id()}`);
      },
    });
  }, []);

  return <>{children}</>;
}
