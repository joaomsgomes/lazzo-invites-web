'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import RsvpSection from './RsvpSection';
import LivingSection from './LivingSection';
import RecapSection from './RecapSection';
import EndedSection from './EndedSection';
import EventAuthGate from './EventAuthGate';
import ManageGuestsSheet from './ManageGuestsSheet';
import LazzoHeader from './LazzoHeader';
import ShareSheet from './ShareSheet';
import { createBrowserSupabase } from '../../../lib/supabase';
import type { EventData, EventPhoto, GuestRecord } from '../../../lib/supabase';
import { resolveAvatarUrl } from '../../../lib/avatar';
import Link from 'next/link';
import {
  trackInviteLinkOpened,
  trackScreenView,
  trackEventPhaseChanged,
  trackMemoryViewed,
  recordPageLoadTime,
} from '../../../lib/analytics';

// ═══════════════════════════════════════════════════════════════════
// EventPage — Redesigned to match Flutter event detail page exactly
// Layout: Header → StatusChip → RSVP/Living/Recap → Details → Location → DateTime → Footer
// ═══════════════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatHeaderDateTime(startIso: string, endIso: string | null): string {
  const s = new Date(startIso);
  const sDay = s.getDate();
  const sMonth = MONTHS[s.getMonth()];
  const sTime = `${s.getHours().toString().padStart(2, '0')}:${s.getMinutes().toString().padStart(2, '0')}`;

  if (!endIso) return `${sDay} ${sMonth} · ${sTime}`;

  const e = new Date(endIso);
  const eDay = e.getDate();
  const eMonth = MONTHS[e.getMonth()];
  const eTime = `${e.getHours().toString().padStart(2, '0')}:${e.getMinutes().toString().padStart(2, '0')}`;

  if (isSameDay(s, e)) return `${sDay} ${sMonth} · ${sTime} - ${eTime}`;
  return `${sDay} ${sMonth} ${sTime} - ${eDay} ${eMonth} ${eTime}`;
}

function getDateRange(startIso: string, endIso: string | null): string {
  const s = new Date(startIso);
  if (!endIso) return `${WEEKDAYS[s.getDay()]}, ${s.getDate()} ${MONTHS_FULL[s.getMonth()]}`;

  const e = new Date(endIso);
  if (isSameDay(s, e)) return `${WEEKDAYS[s.getDay()]}, ${s.getDate()} ${MONTHS_FULL[s.getMonth()]}`;

  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${WEEKDAYS[s.getDay()]}, ${s.getDate()} - ${WEEKDAYS[e.getDay()]}, ${e.getDate()} ${MONTHS_FULL[s.getMonth()]}`;
  }
  return `${WEEKDAYS[s.getDay()]}, ${s.getDate()} ${MONTHS_FULL[s.getMonth()]} - ${WEEKDAYS[e.getDay()]}, ${e.getDate()} ${MONTHS_FULL[e.getMonth()]}`;
}

function getTimeRange(startIso: string, endIso: string | null): string {
  const s = new Date(startIso);
  const sTime = `${s.getHours().toString().padStart(2, '0')}:${s.getMinutes().toString().padStart(2, '0')}`;
  if (!endIso) return sTime;
  const e = new Date(endIso);
  const eTime = `${e.getHours().toString().padStart(2, '0')}:${e.getMinutes().toString().padStart(2, '0')}`;
  return `${sTime} - ${eTime}`;
}

function getStatusConfig(status: string): { label: string; color: string } {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmed', color: BrandColors.planning };
    case 'living':
      return { label: 'Live', color: BrandColors.living };
    case 'recap':
      return { label: 'Recap', color: BrandColors.recap };
    case 'ended':
      return { label: 'Ended', color: BrandColors.text2 };
    default:
      return { label: 'Pending', color: BrandColors.text2 };
  }
}

function getGoogleMapsUrl(lat: number | null, lng: number | null, name: string | null): string {
  https://getlazzo.com/i/InsX6ZhG9YTaXPlXI1jvjE8F  if (lat != null && lng != null) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  if (name) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  return '#';
}

// ── Component ────────────────────────────────────────────────────

interface EventPageProps {
  event: EventData;
  token: string;
  photos: EventPhoto[];
  guests: GuestRecord[];
}

export default function EventPage({ event, token, photos: initialPhotos, guests }: EventPageProps) {
  const [localGuests, setLocalGuests] = useState<GuestRecord[]>(guests);
  const [liveStatus, setLiveStatus] = useState(event.status);
  const [photos, setPhotos] = useState<EventPhoto[]>(initialPhotos);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const [showGuests, setShowGuests] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const prevStatusRef = useRef(event.status);

  // Track whether the current web visitor has already voted (RSVP'd)
  const [hasVoted, setHasVoted] = useState(false);

  // Check localStorage on mount for an existing vote
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`lazzo_rsvp_${token}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.vote) setHasVoted(true);
      }
    } catch { /* ignore */ }
  }, [token]);

  // ── Analytics: track invite link opened + screen view on mount ──
  useEffect(() => {
    recordPageLoadTime();
    trackInviteLinkOpened(event.event_id);

    // invite_landing — top of guest funnel (fires once, regardless of phase)
    trackScreenView('invite_landing', { event_id: event.event_id, event_phase: event.status });

    // Track appropriate screen_viewed based on event phase
    const screenName =
      event.status === 'living' ? 'event_living'
      : event.status === 'recap' ? 'event_recap'
      : 'event_detail';
    trackScreenView(screenName, { event_id: event.event_id, event_phase: event.status });

    // Track memory_viewed for recap events (replaces removed recap_viewed)
    if (event.status === 'recap') {
      trackMemoryViewed(event.event_id, 'recap', event.status);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive ALL vote counts from the single localGuests source of truth
  const goingCount = useMemo(() => localGuests.filter(g => g.rsvp === 'going').length, [localGuests]);
  const maybeCount = useMemo(() => localGuests.filter(g => g.rsvp === 'maybe').length, [localGuests]);
  const cantCount = useMemo(() => localGuests.filter(g => g.rsvp === 'not_going').length, [localGuests]);

  // Handler for when a new photo is uploaded from Living/Recap sections
  const handlePhotoUploaded = useCallback((newPhoto: EventPhoto) => {
    setPhotos((prev) => [newPhoto, ...prev]);
  }, []);

  // ── Fetch photos from DB client-side to ensure persistence ──
  // Runs on mount and every 30s so photos uploaded by anyone always appear.
  useEffect(() => {
    if (liveStatus !== 'living' && liveStatus !== 'recap') return;

    const fetchPhotos = async () => {
      try {
        const res = await fetch(`/api/event-photos?token=${encodeURIComponent(token)}`);
        if (!res.ok) return;
        const { photos: dbPhotos, coverPhotoId: dbCoverId } = await res.json() as { photos: EventPhoto[]; coverPhotoId: string | null };

        // Update cover photo ID
        if (dbCoverId !== undefined) setCoverPhotoId(dbCoverId);

        if (!dbPhotos || dbPhotos.length === 0) return;

        // Merge: keep any client-only photos (just uploaded, not yet in DB) + all DB photos
        setPhotos(prev => {
          const dbIds = new Set(dbPhotos.map(p => p.photo_id));
          const clientOnly = prev.filter(p => !dbIds.has(p.photo_id));
          return [...clientOnly, ...dbPhotos];
        });
      } catch {
        // Silent — graceful degradation
      }
    };

    // Fetch immediately on mount
    fetchPhotos();

    // Poll every 30 seconds
    const interval = setInterval(fetchPhotos, 30_000);
    return () => clearInterval(interval);
  }, [token, liveStatus]);

  // ── Poll event status to detect transitions (confirm, living, recap, ended) ──
  // Uses the token-gated RPC so it works without user authentication.
  // Polls every 15s normally, every 5s when near a known transition time.
  // Also sets precise timers at start_datetime and end_datetime for instant reaction.
  useEffect(() => {
    // No polling needed for ended events
    if (liveStatus === 'ended') return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let transitionTimeout: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    const poll = async () => {
      if (destroyed) return;
      try {
        const supabase = createBrowserSupabase();
        const { data } = await supabase
          .rpc('get_event_by_invite_token', { p_token: token })
          .single();
        const d = data as EventData | null;
        if (d?.status && d.status !== liveStatus) {
          // Track phase change
          trackEventPhaseChanged(event.event_id, liveStatus, d.status);

          // Track screen_viewed for new phase
          const newScreen =
            d.status === 'living' ? 'event_living'
            : d.status === 'recap' ? 'event_recap'
            : 'event_detail';
          trackScreenView(newScreen, { event_id: event.event_id, event_phase: d.status });

          // Track memory_viewed when transitioning to recap
          if (d.status === 'recap') {
            trackMemoryViewed(event.event_id, 'recap', d.status);
          }

          prevStatusRef.current = d.status;
          setLiveStatus(d.status);
        }
      } catch {
        // Silent — graceful degradation
      }
    };

    // Determine the next transition datetime for this status
    // pending/confirmed → living at start_datetime
    // living → recap at end_datetime
    const nextTransitionIso =
      (liveStatus === 'pending' || liveStatus === 'confirmed') ? event.start_datetime
      : liveStatus === 'living' ? event.end_datetime
      : null;

    const nextTransitionMs = nextTransitionIso ? new Date(nextTransitionIso).getTime() : null;
    const now = Date.now();

    // If within 2 min of transition, poll faster (5s); otherwise normal 15s
    const isNearTransition = nextTransitionMs != null && nextTransitionMs - now < 2 * 60 * 1000 && nextTransitionMs - now > 0;
    const pollMs = isNearTransition ? 5_000 : 15_000;

    pollInterval = setInterval(poll, pollMs);

    // Set a precise timer at the transition moment to trigger an immediate poll
    if (nextTransitionMs != null && nextTransitionMs > now) {
      const delay = nextTransitionMs - now + 1_000; // +1s buffer for server processing
      transitionTimeout = setTimeout(() => {
        if (destroyed) return;
        poll();
        // After the transition moment, switch to fast polling for 2 minutes
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(poll, 5_000);
        // Return to normal polling after 2 minutes
        setTimeout(() => {
          if (destroyed || !pollInterval) return;
          clearInterval(pollInterval);
          pollInterval = setInterval(poll, 15_000);
        }, 2 * 60 * 1000);
      }, delay);
    }

    return () => {
      destroyed = true;
      if (pollInterval) clearInterval(pollInterval);
      if (transitionTimeout) clearTimeout(transitionTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, liveStatus]);

  // ── Poll guests every 30s for fresh data ──
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const res = await fetch(`/api/event-guests?token=${encodeURIComponent(token)}`);
        if (!res.ok) return;
        const { guests: dbGuests } = await res.json() as { guests: GuestRecord[] };
        if (!dbGuests || dbGuests.length === 0) return;
        setLocalGuests(dbGuests);
      } catch {
        // Silent — graceful degradation
      }
    };

    // Initial fetch after 5s (give SSR data time to render first)
    const initialTimer = setTimeout(fetchGuests, 5_000);

    // Then poll every 30s
    const interval = setInterval(fetchGuests, 30_000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [token]);

  // Derive display values from liveStatus (reacts to status changes)
  const statusConfig = useMemo(() => getStatusConfig(liveStatus), [liveStatus]);
  const isLiving = liveStatus === 'living';
  const isRecap = liveStatus === 'recap';
  const isEnded = liveStatus === 'ended';
  const canVote = liveStatus === 'pending' || liveStatus === 'confirmed';
  const hasLocation = Boolean(event.location_name);
  const hasCoords = event.location_lat != null && event.location_lng != null;
  const hasDate = Boolean(event.start_datetime);

  const mapsUrl = useMemo(
    () => getGoogleMapsUrl(event.location_lat, event.location_lng, event.location_name),
    [event.location_lat, event.location_lng, event.location_name]
  );

  // Map preview using Google Maps embed (no API key).
  // Clicking the widget still opens the destination in Google Maps.
  const mapPreviewSrc = useMemo(() => {
    const hasNumericCoords = hasCoords
      && Number.isFinite(Number(event.location_lat))
      && Number.isFinite(Number(event.location_lng));

    const query = hasNumericCoords
      ? `${event.location_lat},${event.location_lng}`
      : [event.location_name, event.location_address].filter(Boolean).join(', ');

    if (!query) return null;
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  }, [hasCoords, event.location_lat, event.location_lng, event.location_name, event.location_address]);

  const handleVoteSubmitted = (vote: 'going' | 'not_going' | 'maybe', guestName: string) => {
    setHasVoted(true);
    setLocalGuests(prev => {
      const idx = prev.findIndex(g => g.name === guestName && g.source === 'web');
      if (idx >= 0) {
        // Update existing guest's vote
        const updated = [...prev];
        updated[idx] = { ...updated[idx], rsvp: vote, voted_at: new Date().toISOString() };
        return updated;
      }
      // Add new guest
      return [...prev, {
        id: String(Date.now()),
        name: guestName,
        rsvp: vote,
        source: 'web' as const,
        avatar_url: null,
        voted_at: new Date().toISOString(),
      }];
    });
  };

  const pageContent = (
    <>
      {/* ═══════════ LAZZO BRAND HEADER (all states) ═══════════ */}
      <LazzoHeader />

      <main style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${Spacing.lg} ${Spacing.md}`,
        paddingBottom: '100px',
        background: BrandColors.bg1,
      }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>

        {/* ═══════════ 1. EVENT HEADER (matching Flutter EventHeader) ═══════════ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: Spacing.xs,
        }}>
          {/* Giant Emoji */}
          <span style={{
            fontSize: '80px',
            lineHeight: 1,
            display: 'block',
          }}>
            {event.event_emoji || '📅'}
          </span>

          {/* Event Title */}
          <h1 style={{
            ...Typography.titleLargeEmph,
            color: BrandColors.text1,
            textAlign: 'center',
            marginTop: Spacing.xs,
          }}>
            {event.event_name}
          </h1>

          {/* Location Info Row — clickable → Google Maps (hidden when ended) */}
          {hasLocation && !isEnded && (
            <a
              href={hasCoords || event.location_name ? mapsUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: Spacing.xs,
                marginTop: Spacing.xs,
                color: BrandColors.text2,
                textDecoration: 'none',
                cursor: hasCoords || event.location_name ? 'pointer' : 'default',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ fontSize: '14px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.location_name}
              </span>
            </a>
          )}

          {/* Date Info Row (hidden when ended) */}
          {hasDate && !isEnded && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: Spacing.xs,
              marginTop: Spacing.xxs,
              color: BrandColors.text2,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span style={{ fontSize: '14px' }}>
                {formatHeaderDateTime(event.start_datetime!, event.end_datetime)}
              </span>
            </div>
          )}
        </div>

        {/* ═══════════ 2. STATUS CHIP (matching Flutter EventStatusChip) ═══════════ */}
        {/* Hidden for living (TimeLeftPill), recap (RecapTimerPill), and ended (EndedSection) */}
        {!isLiving && !isRecap && !isEnded && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: Spacing.lg,
            marginTop: Spacing.sm,
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 16px',
              borderRadius: Spacing.radiusPill,
              fontSize: '14px',
              fontWeight: 500,
              color: statusConfig.color === BrandColors.text2 ? BrandColors.text2 : '#FFFFFF',
              background: liveStatus === 'confirmed'
                ? BrandColors.planning
                : liveStatus === 'recap'
                ? BrandColors.recap
                : BrandColors.bg2,
              border: `1px solid ${liveStatus === 'pending' ? BrandColors.bg3 : 'transparent'}`,
              transition: 'all 0.4s ease',
            }}>
              {statusConfig.label}
            </span>
          </div>
        )}

        {/* ═══════════ 3. LIVING SECTION ═══════════ */}
        {isLiving && (
          <div style={{ marginBottom: Spacing.md }}>
            <LivingSection
              event={event}
              token={token}
              photos={photos}
              coverPhotoId={coverPhotoId}
              onCoverChanged={setCoverPhotoId}
              onPhotoUploaded={handlePhotoUploaded}
              onGuestsPress={() => setShowGuests(true)}
              onSharePress={() => setShowShare(true)}
            />
          </div>
        )}

        {/* ═══════════ 3b. RECAP SECTION ═══════════ */}
        {isRecap && (
          <div style={{ marginBottom: Spacing.md }}>
            <RecapSection
              event={event}
              token={token}
              photos={photos}
              coverPhotoId={coverPhotoId}
              onCoverChanged={setCoverPhotoId}
              onPhotoUploaded={handlePhotoUploaded}
              onSharePress={() => setShowShare(true)}
            />
          </div>
        )}

        {/* ═══════════ 3c. ENDED SECTION ═══════════ */}
        {isEnded && (
          <div style={{ marginBottom: Spacing.md }}>
            <EndedSection
              event={event}
              token={token}
              photos={photos}
              coverPhotoId={coverPhotoId}
              onSharePress={() => setShowShare(true)}
            />
          </div>
        )}

        {/* ═══════════ 4. RSVP SECTION (planning/confirmed only) ═══════════ */}
        {canVote && (
          <div style={{ marginBottom: Spacing.md }}>
            <RsvpSection
              token={token}
              eventId={event.event_id}
              initialGoingCount={goingCount}
              initialMaybeCount={maybeCount}
              initialCantCount={cantCount}
              eventStatus={event.status}
              onVoteSubmitted={handleVoteSubmitted}
              onGuestsPress={() => setShowGuests(true)}
            />
          </div>
        )}

        {/* ═══════════ 5. DETAILS CARD (hidden when ended) ═══════════ */}
        {event.event_description && !isEnded && (
          <SectionCard>
            <SectionHeader title="Details" />
            <div style={{ marginTop: Spacing.sm }}>
              <p style={{
                ...Typography.bodyMedium,
                color: BrandColors.text2,
                whiteSpace: 'pre-wrap',
              }}>
                {event.event_description}
              </p>
            </div>
          </SectionCard>
        )}

        {/* ═══════════ 6. LOCATION CARD (hidden when ended) ═══════════ */}
        {hasLocation && !isEnded && (
          <SectionCard>
            <div>
              <SectionHeader title="Location" />
              {(event.location_name || event.location_address) && (
                <p style={{
                  fontSize: '12px',
                  color: BrandColors.text2,
                  marginTop: '2px',
                }}>
                  {[event.location_name, event.location_address]
                    .filter(Boolean)
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .join(' • ')}
                </p>
              )}
            </div>

            {/* Map preview — users can "see" location without clicking. */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open event location in Maps"
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                background: BrandColors.bg3,
                borderRadius: Spacing.radiusSm,
                marginTop: Spacing.md,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                overflow: 'hidden',
              }}
            >
              {mapPreviewSrc ? (
                <iframe
                  title="Event location preview"
                  src={mapPreviewSrc}
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    border: 0,
                    // Make the preview non-interactive; tap anywhere opens Maps.
                    pointerEvents: 'none',
                    filter: 'saturate(0.95) contrast(0.95)',
                  }}
                />
              ) : (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                  </svg>
                </>
              )}

              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  padding: Spacing.sm,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: mapPreviewSrc ? 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0.1))' : 'transparent',
                  pointerEvents: 'none',
                }}
              >
                <span style={{
                  fontSize: '14px',
                  color: mapPreviewSrc ? '#FFFFFF' : BrandColors.text2,
                  marginTop: mapPreviewSrc ? 0 : Spacing.xs,
                  fontWeight: mapPreviewSrc ? 600 : 400,
                }}>
                  {mapPreviewSrc ? 'Open in Maps' : 'Tap to open in Maps'}
                </span>
              </div>
            </a>
          </SectionCard>
        )}

        {/* ═══════════ 7. DATE & TIME CARD (matching Flutter DateTimeWidget) ═══════════ */}
        {hasDate && !isLiving && !isRecap && !isEnded && (
          <SectionCard>
            <SectionHeader title="Date & Time" />
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: Spacing.sm,
              marginTop: Spacing.md,
            }}>
              {/* Calendar Icon Square */}
              <CalendarIconSquare
                startDatetime={event.start_datetime!}
                endDatetime={event.end_datetime}
              />
              {/* Date and time text */}
              <div style={{ flex: 1 }}>
                <p style={{
                  ...Typography.bodyMediumEmph,
                  color: BrandColors.text1,
                }}>
                  {getDateRange(event.start_datetime!, event.end_datetime)}
                </p>
                <p style={{
                  ...Typography.bodyMedium,
                  color: BrandColors.text2,
                  marginTop: Spacing.xxs,
                }}>
                  {getTimeRange(event.start_datetime!, event.end_datetime)}
                </p>
              </div>
            </div>

          </SectionCard>
        )}

        {/* ═══════════ 8. ORGANIZER + GUESTS (hidden when ended) ═══════════ */}
        {/* Only clickable when user has voted OR event is past voting phase (living/recap/ended) */}
        {!isEnded && (() => {
          const guestsUnlocked = hasVoted || !canVote; // canVote = pending/confirmed
          return (
            <SectionCard>
              <button
                onClick={guestsUnlocked ? () => setShowGuests(true) : undefined}
                disabled={!guestsUnlocked}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: guestsUnlocked ? 'pointer' : 'default',
                  textAlign: 'left',
                  opacity: guestsUnlocked ? 1 : 0.5,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* Organizer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: Spacing.sm,
                }}>
                  <OrganizerAvatar
                    name={event.organizer_name}
                    avatarUrl={event.organizer_avatar}
                  />
                  <div>
                    <p style={{
                      fontSize: '12px',
                      color: BrandColors.text2,
                    }}>
                      Hosted by
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: BrandColors.text1,
                      fontWeight: 500,
                    }}>
                      {event.organizer_name}
                    </p>
                  </div>
                </div>

                {/* Guest count + chevron (or lock hint) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: Spacing.xs,
                }}>
                  {guestsUnlocked ? (
                    <>
                      <span style={{ fontSize: '14px', color: BrandColors.text2 }}>
                        <strong style={{ color: BrandColors.text1 }}>{localGuests.length}</strong>
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: BrandColors.text2 }}>
                      RSVP to see guests
                    </span>
                  )}
                </div>
              </button>
            </SectionCard>
          );
        })()}

        {/* ── ManageGuestsSheet (full-screen overlay) ── */}
        {showGuests && (
          <ManageGuestsSheet
            guests={localGuests}
            eventStatus={liveStatus}
            photoCount={photos.length}
            onClose={() => setShowGuests(false)}
          />
        )}

        {/* ═══════════ 9. FOOTER ═══════════ */}
        <div style={{ textAlign: 'center', marginTop: Spacing.lg }}>
          <p style={{
            fontSize: '14px',
            color: BrandColors.text2,
            marginBottom: Spacing.sm,
          }}>
            Get the full experience
          </p>

          <div style={{
            display: 'flex',
            gap: Spacing.sm,
            justifyContent: 'center',
            marginBottom: Spacing.lg,
          }}>
            <a
              href={process.env.NEXT_PUBLIC_APPSTORE_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-store-sm"
            >
              <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-62.1 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              App Store
            </a>
            <a
              href={process.env.NEXT_PUBLIC_PLAYSTORE_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-store-sm"
            >
              <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
              </svg>
              Google Play
            </a>
          </div>

          <div style={{
            paddingTop: Spacing.sm,
            borderTop: `1px solid ${BrandColors.border}`,
          }}>
            <Link
              href="/privacy"
              style={{ fontSize: '12px', color: BrandColors.text2 }}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </main>

      {/* ═══════════ STICKY BOTTOM SHARE BAR (planning phase only) ═══════════ */}
      {canVote && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 910,
          background: BrandColors.bg2,
          borderTop: `1px solid ${BrandColors.border}`,
          padding: `${Spacing.sm} ${Spacing.md}`,
          paddingBottom: `calc(${Spacing.sm} + env(safe-area-inset-bottom, 0px))`,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => setShowShare(true)}
            style={{
              maxWidth: '520px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.xs,
              padding: '14px 24px',
              borderRadius: Spacing.radiusMd,
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: BrandColors.planning,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share invite with friends
          </button>
        </div>
      )}

      {/* ── ShareSheet overlay ── */}
      {showShare && (
        <ShareSheet
          inviteUrl={typeof window !== 'undefined' ? window.location.href : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/i/${token}`}
          eventId={event.event_id}
          eventName={event.event_name}
          eventEmoji={event.event_emoji || '📅'}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );

  // Wrap with EventAuthGate when the event is in living or recap state
  if (isLiving) {
    return (
      <EventAuthGate
        token={token}
        eventName={event.event_name}
        eventEmoji={event.event_emoji || '🎉'}
        eventPhase="living"
      >
        {pageContent}
      </EventAuthGate>
    );
  }

  if (isRecap) {
    return (
      <EventAuthGate
        token={token}
        eventName={event.event_name}
        eventEmoji={event.event_emoji || '📸'}
        eventPhase="recap"
      >
        {pageContent}
      </EventAuthGate>
    );
  }

  if (isEnded) {
    return (
      <EventAuthGate
        token={token}
        eventName={event.event_name}
        eventEmoji={event.event_emoji || '📸'}
        eventPhase="ended"
      >
        {pageContent}
      </EventAuthGate>
    );
  }

  return pageContent;
}


// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

/** bg2 card wrapper for each section — matches Flutter's Container pattern */
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%',
      padding: Spacing.md,
      background: BrandColors.bg2,
      borderRadius: Spacing.radiusMd,
      marginBottom: Spacing.md,
    }}>
      {children}
    </div>
  );
}

/** Section header text — matches Flutter's AppText.labelLarge */
function SectionHeader({ title }: { title: string }) {
  return (
    <p style={{
      ...Typography.labelLarge,
      color: BrandColors.text1,
    }}>
      {title}
    </p>
  );
}

/** Calendar icon square (56×56) matching Flutter's DateTimeWidget */
function CalendarIconSquare({
  startDatetime,
  endDatetime,
}: {
  startDatetime: string;
  endDatetime: string | null;
}) {
  const s = new Date(startDatetime);
  const e = endDatetime ? new Date(endDatetime) : null;
  const isMultiDay = e !== null && !isSameDay(s, e);

  return (
    <div style={{
      width: '56px',
      height: '56px',
      minWidth: '56px',
      background: BrandColors.bg3,
      borderRadius: Spacing.radiusSm,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {isMultiDay ? (
        <>
          <span style={{ fontSize: '12px', fontWeight: 600, color: BrandColors.text1 }}>
            {s.getDate()}-{e!.getDate()}
          </span>
          <span style={{ fontSize: '10px', color: BrandColors.text2 }}>
            {MONTHS[s.getMonth()].toUpperCase()}
          </span>
        </>
      ) : (
        <>
          <span style={{ fontSize: '10px', color: BrandColors.text2 }}>
            {MONTHS[s.getMonth()].toUpperCase()}
          </span>
          <span style={{ fontSize: '20px', fontWeight: 600, color: BrandColors.text1 }}>
            {s.getDate()}
          </span>
        </>
      )}
    </div>
  );
}

/** Organizer avatar circle */
function OrganizerAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const fullUrl = resolveAvatarUrl(avatarUrl);

  return (
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: BrandColors.bg3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 600,
      color: BrandColors.text2,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {fullUrl ? (
        <img
          src={fullUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.dataset.fallbackTried === '1') {
              img.style.display = 'none';
              if (img.parentElement) {
                img.parentElement.textContent = name?.[0]?.toUpperCase() || '?';
              }
              return;
            }

            img.dataset.fallbackTried = '1';
            if (avatarUrl && !avatarUrl.startsWith('http')) {
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
              if (supabaseUrl) {
                img.src = `${supabaseUrl}/storage/v1/object/public/avatars/${avatarUrl}`;
                return;
              }
            }

            img.style.display = 'none';
            if (img.parentElement) {
              img.parentElement.textContent = name?.[0]?.toUpperCase() || '?';
            }
          }}
        />
      ) : (
        name?.[0]?.toUpperCase() || '?'
      )}
    </div>
  );
}
