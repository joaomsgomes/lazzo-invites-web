'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

// ═══════════════════════════════════════════════════════════════════
// PostHogProvider — Single 'use client' boundary for PostHog init.
//
// This is the ONLY place posthog-js is initialized. There must be
// NO separate PostHog "array snippet" or <script> tag anywhere.
//
// posthog-js queues posthog.capture() calls made before init and
// flushes them automatically once init completes. So child components
// firing events in their useEffect (even before this one runs) works
// correctly — events are buffered and sent after init.
// ═══════════════════════════════════════════════════════════════════

const IS_DEBUG = process.env.NEXT_PUBLIC_POSTHOG_DEBUG === 'true';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

    if (!key) {
      console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set — analytics disabled');
      return;
    }

    if (posthog.__loaded) {
      if (IS_DEBUG) console.log('[PostHog] already initialized');
      return;
    }

    console.log(
      `[PostHog] init — host: ${host}, key present: ${!!key}`,
    );

    posthog.init(key, {
      api_host: host,
      ui_host: 'https://eu.posthog.com',

      // ── Cost-safe: disable all auto-collection ──
      autocapture: false,
      disable_session_recording: true,
      capture_pageview: false,
      capture_pageleave: false,

      // ── Prevent 404s to eu-assets.i.posthog.com/array/.../config.js ──
      // The SDK's RequestRouter tries to fetch remote config from the
      // assets CDN, which returns 404 for self-serve EU projects.
      // Disabling decide + external deps stops those requests entirely.
      advanced_disable_decide: true,
      advanced_disable_feature_flags: true,
      disable_external_dependency_loading: true,

      // Privacy
      respect_dnt: true,
      persistence: 'localStorage',

      loaded: (ph) => {
        console.log(`[PostHog] ready — distinct_id: ${ph.get_distinct_id()}`);

        // ── Debug mode (set NEXT_PUBLIC_POSTHOG_DEBUG=true on Vercel) ──
        if (IS_DEBUG) {
          // Expose on window so DevTools can call window.posthog.capture(...)
          (window as unknown as Record<string, unknown>).posthog = ph;
          if (typeof ph.debug === 'function') {
            ph.debug(true);
          }
          console.log(
            '[PostHog] DEBUG mode ON — window.posthog available.\n' +
            'Test: window.posthog.capture("debug_web_test", { t: Date.now() })',
          );
        }
      },
    });
  }, []);

  return <>{children}</>;
}
