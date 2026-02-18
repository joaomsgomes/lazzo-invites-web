'use client';

import { useState, useMemo, useEffect } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import RsvpSection from './RsvpSection';
import LivingSection from './LivingSection';
import RecapSection from './RecapSection';
import CalendarButton from './CalendarButton';
import { createBrowserSupabase } from '../../../lib/supabase';
import type { EventData, EventPhoto } from '../../../lib/supabase';
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
      return { label: 'Happening Now', color: BrandColors.living };
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
}

export default function EventPage({ event, token, photos }: EventPageProps) {
  const [goingCount, setGoingCount] = useState(
    Number(event.going_count) + Number(event.guest_going_count)
  );
  const [cantCount, setCantCount] = useState(0);
  const [liveStatus, setLiveStatus] = useState(event.status);

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
        // Also update going counts from server
        if (d) {
          const newGoingTotal = Number(d.going_count) + Number(d.guest_going_count);
          setGoingCount(newGoingTotal);
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

  const handleVoteSubmitted = (vote: 'going' | 'not_going') => {
    if (vote === 'going') setGoingCount((p) => p + 1);
    else setCantCount((p) => p + 1);
  };

  return (
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
              photos={photos}
            />
          </div>
        )}

        {/* ═══════════ 3b. RECAP SECTION ═══════════ */}
        {isRecap && (
          <div style={{ marginBottom: Spacing.md }}>
            <RecapSection photos={photos} />
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
        {hasDate && (
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

            {/* Add to Calendar Button */}
            <div style={{ marginTop: Spacing.md }}>
              <CalendarButton
                eventName={event.event_name}
                startDatetime={event.start_datetime!}
                endDatetime={event.end_datetime}
                locationName={event.location_name}
                locationAddress={event.location_address}
                description={event.event_description}
              />
            </div>
          </SectionCard>
        )}

        {/* ═══════════ 8. ORGANIZER + PARTICIPANT COUNTS ═══════════ */}
        <SectionCard>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
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

            {/* Participant count */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: Spacing.xs,
            }}>
              <span style={{ fontSize: '14px', color: BrandColors.text2 }}>
                👥 <strong style={{ color: BrandColors.text1 }}>{goingCount}</strong> going
                {cantCount > 0 && (
                  <>
                    {' · '}
                    <strong style={{ color: BrandColors.text1 }}>{cantCount}</strong> can&apos;t
                  </>
                )}
              </span>
            </div>
          </div>
        </SectionCard>

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
              🍎 App Store
            </a>
            <a
              href={process.env.NEXT_PUBLIC_PLAYSTORE_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-store-sm"
            >
              ▶️ Google Play
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
