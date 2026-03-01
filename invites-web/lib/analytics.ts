import posthog from 'posthog-js';

// ═══════════════════════════════════════════════════════════════════
// Analytics — PostHog helpers for Lazzo web (Vercel)
//
// posthog-js is initialized at module scope in
// app/providers/PostHogProvider.tsx (runs before any useEffect).
//
// DO NOT add 'use client' here — this is a plain utility module.
// It is only imported from 'use client' components, so it is
// already part of the client bundle.
//
// Follows METRICS.md taxonomy — same event names as Flutter app.
// Each helper has exactly one console.log for debug visibility.
// ═══════════════════════════════════════════════════════════════════

// ── Core Tracking ──────────────────────────────────────────────

/**
 * Track a named event with optional properties.
 * Always includes `platform: 'web'` automatically.
 */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  const payload = { platform: 'web', ...properties };
  console.log(`[PostHog] event: ${event}`, payload);
  posthog.capture(event, payload);
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
  if (typeof window === 'undefined') return;
  const payload = { screen_name: screenName, platform: 'web', ...properties };
  console.log(`[PostHog] screen_viewed: ${screenName}`, payload);
  posthog.capture('screen_viewed', payload);
}

// ── Identity ────────────────────────────────────────────────────

/**
 * Identify a user after authentication completes.
 * PostHog aliases the anonymous distinct_id → userId and merges history.
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, string | boolean | number>,
): void {
  if (typeof window === 'undefined') return;
  console.log(`[PostHog] identify: ${userId}`, { platform: 'web', ...properties });
  posthog.identify(userId, { platform: 'web', ...properties });
}

/**
 * Reset identity on logout / session clear.
 */
export function resetIdentity(): void {
  if (typeof window === 'undefined') return;
  console.log('[PostHog] reset identity');
  posthog.reset();
}

// ── Feature Flags ──────────────────────────────────────────────

export function getFeatureFlag(key: string): string | boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  return posthog.getFeatureFlag(key);
}

export function isFeatureEnabled(key: string): boolean {
  if (typeof window === 'undefined') return false;
  const value = posthog.getFeatureFlag(key);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value !== 'false' && value !== '';
  return false;
}

export function onFeatureFlags(callback: () => void): void {
  if (typeof window === 'undefined') return;
  posthog.onFeatureFlags(callback);
}

export function reloadFeatureFlags(): void {
  if (typeof window === 'undefined') return;
  posthog.reloadFeatureFlags();
}

// ── Typed Event Helpers ─────────────────────────────────────────
// Follow exact taxonomy from METRICS.md

export function trackInviteLinkOpened(eventId: string): void {
  trackEvent('invite_link_opened', {
    event_id: eventId,
    referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'unknown',
    is_new_visitor: !hasExistingSession(),
  });
}

export function trackGuestAuthCompleted(eventId: string, userId: string): void {
  trackEvent('guest_auth_completed', {
    event_id: eventId,
    auth_method: 'email',
    user_id: userId,
  });
}

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

export function trackRsvpChanged(eventId: string, fromVote: string, toVote: string): void {
  trackEvent('rsvp_changed', {
    event_id: eventId,
    from_vote: fromVote,
    to_vote: toVote,
    user_role: 'guest',
  });
}

/**
 * Track when a guest taps a vote button (Can / Can't) on web.
 * Fires BEFORE auth — lets us measure intent vs completion:
 *   rsvp_intent_started → guest_auth_completed → rsvp_submitted
 */
export function trackRsvpIntentStarted(
  eventId: string,
  vote: 'going' | 'not_going',
): void {
  trackEvent('rsvp_intent_started', {
    event_id: eventId,
    vote: vote === 'going' ? 'going' : 'cant',
    user_role: 'guest',
  });
}

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

export function trackRecapViewed(eventId: string, photoCount: number): void {
  trackEvent('recap_viewed', {
    event_id: eventId,
    viewer_role: 'guest',
    photo_count: photoCount,
  });
}

export function trackInviteLinkShared(
  eventId: string,
  shareMethod: 'copy_link' | 'share',
): void {
  trackEvent('invite_link_shared', {
    event_id: eventId,
    share_method: shareMethod,
    user_role: 'guest',
  });
}

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

function hasExistingSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('lazzo_session_') || key.startsWith('lazzo_rsvp_'))) {
        return true;
      }
    }
  } catch { /* localStorage unavailable */ }
  return false;
}

// ── Page Load Timestamp ─────────────────────────────────────────

let _pageLoadTime: number | null = null;

export function recordPageLoadTime(): void {
  _pageLoadTime = Date.now();
}

export function getSecondsSincePageLoad(): number {
  if (!_pageLoadTime) return 0;
  return Math.round((Date.now() - _pageLoadTime) / 1000);
}

export { posthog };
