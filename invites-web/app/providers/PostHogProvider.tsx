'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

// ═══════════════════════════════════════════════════════════════════
// PostHogProvider — Single 'use client' boundary for PostHog init.
//
// CRITICAL: posthog.init() runs at MODULE SCOPE (not useEffect).
// React runs child effects before parent effects, so if init were
// inside useEffect, page-level analytics (invite_landing, etc.)
// would fire before PostHog is initialized and be silently dropped.
//
// Module-scope init guarantees PostHog is ready before any
// component effect runs. This is the PostHog-recommended approach
// for Next.js App Router.
// ═══════════════════════════════════════════════════════════════════

const IS_DEBUG = process.env.NEXT_PUBLIC_POSTHOG_DEBUG === 'true';

// ── Module-scope init (runs once on import, before any useEffect) ──
if (typeof window !== 'undefined') {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

  if (!key) {
    console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set — analytics disabled');
  } else if (!posthog.__loaded) {
    console.log(`[PostHog] init — host: ${host}, key present: ${!!key}`);

    posthog.init(key, {
      api_host: host,
      ui_host: 'https://eu.posthog.com',

      // ── Cost-safe: disable all auto-collection ──
      autocapture: false,
      disable_session_recording: true,
      capture_pageview: false,
      capture_pageleave: false,

      // ── Prevent 404s to eu-assets.i.posthog.com/array/.../config.js ──
      advanced_disable_decide: true,
      advanced_disable_feature_flags: true,
      disable_external_dependency_loading: true,

      // Privacy
      respect_dnt: true,
      persistence: 'localStorage',

      loaded: (ph) => {
        console.log(`[PostHog] ready — distinct_id: ${ph.get_distinct_id()}`);
      },
    });
  }
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  // ── Debug mode (set NEXT_PUBLIC_POSTHOG_DEBUG=true on Vercel) ──
  useEffect(() => {
    if (!IS_DEBUG || typeof window === 'undefined' || !posthog.__loaded) return;

    (window as unknown as Record<string, unknown>).posthog = posthog;
    if (typeof posthog.debug === 'function') {
      posthog.debug(true);
    }
    console.log(
      '[PostHog] DEBUG mode ON — window.posthog available.\n' +
      'Test: window.posthog.capture("debug_web_test", { t: Date.now() })',
    );
  }, []);

  return <>{children}</>;
}
