'use client';

import posthog from 'posthog-js';

// ═══════════════════════════════════════════════════════════════════
// Analytics — PostHog wrapper for Lazzo web (Vercel)
//
// Cost-safe configuration:
// - autocapture: OFF
// - session_recording: OFF
// - capture_pageview: OFF (manual only)
// - capture_pageleave: OFF
//
// Identity flow:
// 1. Page loads → PostHog generates anonymous distinct_id
// 2. Guest auth (OTP verified) → identify(supabase_user_id)
// 3. All prior events merge into authenticated user
//
// Follows METRICS.md taxonomy — same event names as Flutter app.
// ═══════════════════════════════════════════════════════════════════

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

let _initialized = false;

// ── Initialization ──────────────────────────────────────────────

/**
 * Initialize PostHog. Call once in the app layout (client-side only).
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initPostHog(): void {
  if (typeof window === 'undefined') return;
  if (_initialized) return;
  if (!POSTHOG_KEY) {
    console.warn('[Analytics] NEXT_PUBLIC_POSTHOG_KEY not set — analytics disabled');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,

    // COST OPTIMIZATION — critical for $0 bill
    autocapture: false,
    disable_session_recording: true,
    capture_pageview: false,
    capture_pageleave: false,

    // Feature flags — bootstrap empty, loaded on init
    bootstrap: {
      featureFlags: {},
    },

    // Privacy
    respect_dnt: true,
    persistence: 'localStorage',
  });

  _initialized = true;
}

/**
 * Check if PostHog is initialized and ready.
 */
function isReady(): boolean {
  return _initialized && typeof window !== 'undefined' && !!POSTHOG_KEY;
}

// ── Core Tracking ──────────────────────────────────────────────

/**
 * Track a named event with optional properties.
 * Properties are merged with PostHog's automatic properties.
 *
 * Always includes `platform: 'web'` automatically.
 */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (!isReady()) return;

  posthog.capture(event, {
    platform: 'web',
    ...properties,
  });
}

// ── Screen Views (selective — critical screens only) ──────────

/**
 * Track a critical screen view. Only call for screens listed in METRICS.md:
 * - invite_landing, event_detail, event_living, event_recap,
 *   memory_viewer, memory_ready
 *
 * Do NOT call for every navigation, modal, or bottom sheet.
 */
export function trackScreenView(
  screenName: string,
  properties?: Record<string, unknown>,
): void {
  if (!isReady()) return;

  posthog.capture('screen_viewed', {
    screen_name: screenName,
    platform: 'web',
    ...properties,
  });
}

// ── Identity ────────────────────────────────────────────────────

/**
 * Identify a user after authentication completes.
 * PostHog aliases the anonymous distinct_id → userId and merges history.
 *
 * Call on:
 * - guest_auth_completed (OTP verified for RSVP)
 * - photo upload auth (OTP verified for upload)
 *
 * @param userId - Supabase user UUID
 * @param properties - Optional user properties (role, email prefix, etc.)
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, string | boolean | number>,
): void {
  if (!isReady()) return;

  posthog.identify(userId, {
    platform: 'web',
    ...properties,
  });
}

/**
 * Reset identity on logout / session clear.
 * Generates a new anonymous distinct_id.
 */
export function resetIdentity(): void {
  if (!isReady()) return;
  posthog.reset();
}

// ── Feature Flags ──────────────────────────────────────────────

/**
 * Get a feature flag value (from local cache — no network call).
 * Safe to call in render paths.
 */
export function getFeatureFlag(key: string): string | boolean | undefined {
  if (!isReady()) return undefined;
  return posthog.getFeatureFlag(key);
}

/**
 * Check if a feature flag is enabled (boolean flags).
 */
export function isFeatureEnabled(key: string): boolean {
  if (!isReady()) return false;
  const value = posthog.getFeatureFlag(key);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value !== 'false' && value !== '';
  return false;
}

/**
 * Register a callback for when feature flags are loaded.
 * Useful for applying flag-dependent UI on first page load.
 */
export function onFeatureFlags(callback: () => void): void {
  if (!isReady()) return;
  posthog.onFeatureFlags(callback);
}

/**
 * Force reload feature flags from PostHog server.
 * Call sparingly — on auth complete or on long-lived sessions.
 */
export function reloadFeatureFlags(): void {
  if (!isReady()) return;
  posthog.reloadFeatureFlags();
}

// ── Convenience: Typed Event Helpers ───────────────────────────
// These follow the exact taxonomy from METRICS.md

/** Guest opens invite link (top of guest funnel) */
export function trackInviteLinkOpened(eventId: string): void {
  trackEvent('invite_link_opened', {
    event_id: eventId,
    referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'unknown',
    is_new_visitor: !hasExistingSession(),
  });
}

/** Guest completes lightweight auth (OTP verified) */
export function trackGuestAuthCompleted(
  eventId: string,
  userId: string,
): void {
  trackEvent('guest_auth_completed', {
    event_id: eventId,
    auth_method: 'email',
    user_id: userId,
  });
}

/** Guest submits RSVP vote */
export function trackRsvpSubmitted(
  eventId: string,
  vote: 'going' | 'not_going',
  timeToRsvpSeconds: number,
): void {
  trackEvent('rsvp_submitted', {
    event_id: eventId,
    vote: vote === 'going' ? 'going' : 'cant',
    time_to_rsvp_seconds: timeToRsvpSeconds,
    user_role: 'guest',
  });
}

/** Guest changes RSVP vote */
export function trackRsvpChanged(
  eventId: string,
  fromVote: string,
  toVote: string,
): void {
  trackEvent('rsvp_changed', {
    event_id: eventId,
    from_vote: fromVote,
    to_vote: toVote,
    user_role: 'guest',
  });
}

/** Photo upload started */
export function trackPhotoUploadStarted(
  eventId: string,
  source: 'camera' | 'gallery',
  photoCount: number,
): void {
  trackEvent('photo_upload_started', {
    event_id: eventId,
    source,
    photo_count: photoCount,
  });
}

/** Photo successfully uploaded */
export function trackPhotoUploaded(
  eventId: string,
  uploadDurationMs: number,
  fileSizeKb: number,
): void {
  trackEvent('photo_uploaded', {
    event_id: eventId,
    upload_duration_ms: uploadDurationMs,
    file_size_kb: fileSizeKb,
    is_cover: false,
  });
}

/** Photo upload failed */
export function trackPhotoUploadFailed(
  eventId: string,
  errorType: string,
  retryCount: number,
): void {
  trackEvent('photo_upload_failed', {
    event_id: eventId,
    error_type: errorType,
    retry_count: retryCount,
  });
}

/** Recap viewed by guest */
export function trackRecapViewed(
  eventId: string,
  photoCount: number,
): void {
  trackEvent('recap_viewed', {
    event_id: eventId,
    viewer_role: 'guest',
    photo_count: photoCount,
  });
}

/** Invite link shared (via share sheet) */
export function trackInviteLinkShared(
  eventId: string,
  shareChannel: string,
): void {
  trackEvent('invite_link_shared', {
    event_id: eventId,
    share_channel: shareChannel,
    user_role: 'guest',
  });
}

/** Event phase change detected (via polling) */
export function trackEventPhaseChanged(
  eventId: string,
  fromPhase: string,
  toPhase: string,
): void {
  trackEvent('event_phase_changed', {
    event_id: eventId,
    from_phase: fromPhase,
    to_phase: toPhase,
    trigger: 'auto',
  });
}

// ── Helpers ─────────────────────────────────────────────────────

/** Check if user has any localStorage session (indicates returning visitor) */
function hasExistingSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('lazzo_session_') || key.startsWith('lazzo_rsvp_'))) {
        return true;
      }
    }
  } catch {
    // localStorage unavailable
  }
  return false;
}

// ── Page Load Timestamp (for time_to_rsvp calculation) ────────

let _pageLoadTime: number | null = null;

/** Record page load time. Call once when invite page mounts. */
export function recordPageLoadTime(): void {
  _pageLoadTime = Date.now();
}

/** Get seconds since page loaded (for time_to_rsvp_seconds). */
export function getSecondsSincePageLoad(): number {
  if (!_pageLoadTime) return 0;
  return Math.round((Date.now() - _pageLoadTime) / 1000);
}

export { posthog };
