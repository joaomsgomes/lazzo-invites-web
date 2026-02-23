'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import RsvpSection from './RsvpSection';
import LivingSection from './LivingSection';
import RecapSection from './RecapSection';
import RecapAuthGate from './RecapAuthGate';
import ManageGuestsSheet from './ManageGuestsSheet';
import { createBrowserSupabase } from '../../../lib/supabase';
import type { EventData, EventPhoto, GuestRecord } from '../../../lib/supabase';
import Link from 'next/link';

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
  if (lat && lng) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
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
  const [showGuests, setShowGuests] = useState(false);

  // Derive ALL vote counts from the single localGuests source of truth
  const goingCount = useMemo(() => localGuests.filter(g => g.rsvp === 'going').length, [localGuests]);
  const cantCount = useMemo(() => localGuests.filter(g => g.rsvp === 'not_going').length, [localGuests]);

  // Handler for when a new photo is uploaded from Living/Recap sections
  const handlePhotoUploaded = useCallback((newPhoto: EventPhoto) => {
    setPhotos((prev) => [newPhoto, ...prev]);
  }, []);

  // ── Poll event status every 15s to detect host actions (confirm, etc.) ──
  // Uses the token-gated RPC so it works without user authentication.
  useEffect(() => {
    // Only poll for statuses that can change (pending → confirmed, etc.)
    if (liveStatus === 'ended') return;

    const poll = async () => {
      try {
        const supabase = createBrowserSupabase();
        const { data } = await supabase
          .rpc('get_event_by_invite_token', { p_token: token })
          .single();
        const d = data as EventData | null;
        if (d?.status && d.status !== liveStatus) {
          setLiveStatus(d.status);
        }
      } catch {
        // Silent — graceful degradation
      }
    };

    const interval = setInterval(poll, 15_000);
    return () => clearInterval(interval);
  }, [token, liveStatus]);

  // Derive display values from liveStatus (reacts to status changes)
  const statusConfig = useMemo(() => getStatusConfig(liveStatus), [liveStatus]);
  const isLiving = liveStatus === 'living';
  const isRecap = liveStatus === 'recap';
  const canVote = liveStatus === 'pending' || liveStatus === 'confirmed';
  const hasLocation = Boolean(event.location_name);
  const hasCoords = Boolean(event.location_lat && event.location_lng);
  const hasDate = Boolean(event.start_datetime);

  const mapsUrl = useMemo(
    () => getGoogleMapsUrl(event.location_lat, event.location_lng, event.location_name),
    [event.location_lat, event.location_lng, event.location_name]
  );

  const handleVoteSubmitted = (vote: 'going' | 'not_going', guestName: string) => {
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
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: `${Spacing.lg} ${Spacing.md}`,
      paddingBottom: '48px',
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

          {/* Location Info Row — clickable → Google Maps */}
          {hasLocation && (
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

          {/* Date Info Row */}
          {hasDate && (
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
              : liveStatus === 'living'
              ? BrandColors.living
              : liveStatus === 'recap'
              ? BrandColors.recap
              : BrandColors.bg2,
            border: `1px solid ${liveStatus === 'pending' ? BrandColors.bg3 : 'transparent'}`,
            transition: 'all 0.4s ease',
          }}>
            {statusConfig.label}
          </span>
        </div>

        {/* ═══════════ 3. LIVING SECTION ═══════════ */}
        {isLiving && (
          <div style={{ marginBottom: Spacing.md }}>
            <LivingSection
              event={event}
              token={token}
              photos={photos}
              onPhotoUploaded={handlePhotoUploaded}
              onGuestsPress={() => setShowGuests(true)}
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
              onPhotoUploaded={handlePhotoUploaded}
            />
          </div>
        )}

        {/* ═══════════ 4. RSVP SECTION (planning/confirmed only) ═══════════ */}
        {canVote && (
          <div style={{ marginBottom: Spacing.md }}>
            <RsvpSection
              token={token}
              initialGoingCount={goingCount}
              initialCantCount={cantCount}
              eventStatus={event.status}
              onVoteSubmitted={handleVoteSubmitted}
            />
          </div>
        )}

        {/* ═══════════ 5. DETAILS CARD (matching Flutter EventDetailsWidget) ═══════════ */}
        {event.event_description && (
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

        {/* ═══════════ 6. LOCATION CARD (matching Flutter LocationWidget) ═══════════ */}
        {hasLocation && (
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

            {/* Map placeholder — tappable to open Google Maps */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
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
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              <span style={{
                fontSize: '14px',
                color: BrandColors.text2,
                marginTop: Spacing.xs,
              }}>
                Tap to open in Maps
              </span>
            </a>
          </SectionCard>
        )}

        {/* ═══════════ 7. DATE & TIME CARD (matching Flutter DateTimeWidget) ═══════════ */}
        {hasDate && !isRecap && (
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

        {/* ═══════════ 8. ORGANIZER + GUESTS (tappable → ManageGuestsSheet) ═══════════ */}
        <SectionCard>
          <button
            onClick={() => setShowGuests(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
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
                  Organized by
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

            {/* Guest count + chevron */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: Spacing.xs,
            }}>
              <span style={{ fontSize: '14px', color: BrandColors.text2 }}>
                <strong style={{ color: BrandColors.text1 }}>{localGuests.length}</strong>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        </SectionCard>

        {/* ── ManageGuestsSheet (full-screen overlay) ── */}
        {showGuests && (
          <ManageGuestsSheet
            guests={localGuests}
            eventStatus={liveStatus}
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
  );

  // Wrap with RecapAuthGate when the event is in recap state
  if (isRecap) {
    return (
      <RecapAuthGate
        token={token}
        eventName={event.event_name}
        eventEmoji={event.event_emoji || '📸'}
      >
        {pageContent}
      </RecapAuthGate>
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const fullUrl = avatarUrl
    ? avatarUrl.startsWith('http')
      ? avatarUrl
      : `${supabaseUrl}/storage/v1/object/public/avatars/${avatarUrl}`
    : null;

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
