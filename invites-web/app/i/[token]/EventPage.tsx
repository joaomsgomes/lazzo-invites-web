'use client';

import { useState } from 'react';
import { BrandColors, Spacing } from '../../design/constants';
import RsvpSection from './RsvpSection';
import type { EventData } from '../../../lib/supabase';
import Link from 'next/link';

// ---- Helpers ----

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status: string) {
  const configs: Record<string, { label: string; color: string }> = {
    pending: { label: 'Planning', color: BrandColors.planning },
    confirmed: { label: 'Confirmed', color: BrandColors.planning },
    living: { label: 'Happening Now', color: BrandColors.living },
    recap: { label: 'Recap', color: BrandColors.recap },
    ended: { label: 'Ended', color: BrandColors.text2 },
  };
  return configs[status] || { label: status, color: BrandColors.text2 };
}

function getStorageUrl(path: string | null, bucket: string): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// ---- Component ----

interface EventPageProps {
  event: EventData;
  token: string;
}

export default function EventPage({ event, token }: EventPageProps) {
  const [goingCount, setGoingCount] = useState(
    Number(event.going_count) + Number(event.guest_going_count)
  );
  const [cantCount, setCantCount] = useState(0);

  const statusBadge = getStatusBadge(event.status);
  const coverUrl = getStorageUrl(event.cover_photo_url, 'event-photos');
  const avatarUrl = getStorageUrl(event.organizer_avatar, 'avatars');

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
        {/* ═══════════ EVENT CARD ═══════════ */}
        <div style={{
          background: BrandColors.bg2,
          borderRadius: Spacing.radiusMd,
          overflow: 'hidden',
          border: `1px solid ${BrandColors.border}`,
        }}>
          {/* Cover Photo or Emoji Header */}
          {coverUrl ? (
            <div style={{
              width: '100%',
              height: '200px',
              position: 'relative',
              overflow: 'hidden',
              background: BrandColors.bg3,
            }}>
              <img
                src={coverUrl}
                alt={event.event_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div style={{
              width: '100%',
              padding: `${Spacing.xl} 0 ${Spacing.md}`,
              display: 'flex',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: BrandColors.bg3,
                borderRadius: Spacing.radiusMd,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
              }}>
                {event.event_emoji || '📅'}
              </div>
            </div>
          )}

          {/* Event Content */}
          <div style={{ padding: Spacing.lg }}>
            {/* Title + Status Badge */}
            <div style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
              {coverUrl && (
                <span style={{
                  fontSize: '28px',
                  display: 'block',
                  marginBottom: Spacing.xs,
                }}>
                  {event.event_emoji || '📅'}
                </span>
              )}
              <h1 style={{
                fontSize: '26px',
                fontWeight: 700,
                color: BrandColors.text1,
                marginBottom: Spacing.sm,
                lineHeight: 1.2,
              }}>
                {event.event_name}
              </h1>
              <span style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: Spacing.radiusPill,
                fontSize: '13px',
                fontWeight: 600,
                color: statusBadge.color,
                background: statusBadge.color + '1A',
                border: `1px solid ${statusBadge.color}44`,
              }}>
                {statusBadge.label}
              </span>
            </div>

            {/* Detail Rows */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: Spacing.md,
              marginBottom: Spacing.lg,
            }}>
              {/* Date & Time */}
              {event.start_datetime && (
                <InfoRow
                  icon="📅"
                  title={formatDate(event.start_datetime)}
                  subtitle={
                    `${formatTime(event.start_datetime)}` +
                    (event.end_datetime ? ` – ${formatTime(event.end_datetime)}` : '')
                  }
                />
              )}

              {!event.start_datetime && (
                <InfoRow
                  icon="📅"
                  title="Date not set yet"
                  subtitle="The organizer hasn't picked a date"
                  muted
                />
              )}

              {/* Location */}
              {event.location_name && (
                <InfoRow
                  icon="📍"
                  title={event.location_name}
                  subtitle={event.location_address || undefined}
                />
              )}

              {!event.location_name && (
                <InfoRow
                  icon="📍"
                  title="Location not set yet"
                  subtitle="The organizer hasn't picked a place"
                  muted
                />
              )}

              {/* Organizer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: Spacing.sm,
              }}>
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
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={event.organizer_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        if (img.parentElement) {
                          img.parentElement.textContent =
                            event.organizer_name?.[0]?.toUpperCase() || '?';
                        }
                      }}
                    />
                  ) : (
                    event.organizer_name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <p style={{
                    fontSize: '13px',
                    color: BrandColors.text2,
                    marginBottom: '2px',
                  }}>
                    Organized by
                  </p>
                  <p style={{
                    fontSize: '15px',
                    color: BrandColors.text1,
                    fontWeight: 500,
                  }}>
                    {event.organizer_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.event_description && (
              <div style={{
                padding: Spacing.md,
                background: BrandColors.bg1,
                borderRadius: Spacing.radiusSmAlt,
                marginBottom: Spacing.lg,
              }}>
                <p style={{
                  fontSize: '14px',
                  color: BrandColors.text2,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {event.event_description}
                </p>
              </div>
            )}

            {/* Participant Counts */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: Spacing.sm,
              padding: `${Spacing.sm} 0`,
              marginBottom: Spacing.md,
              borderTop: `1px solid ${BrandColors.border}`,
              paddingTop: Spacing.md,
            }}>
              <span style={{
                fontSize: '14px',
                color: BrandColors.text2,
              }}>
                👥{' '}
                <strong style={{ color: BrandColors.text1 }}>{goingCount}</strong> going
                {cantCount > 0 && (
                  <>
                    {' · '}
                    <strong style={{ color: BrandColors.text1 }}>{cantCount}</strong> can&apos;t
                  </>
                )}
              </span>
            </div>

            {/* ═══════ RSVP SECTION ═══════ */}
            <RsvpSection
              token={token}
              initialGoingCount={goingCount}
              initialCantCount={cantCount}
              eventStatus={event.status}
              onVoteSubmitted={handleVoteSubmitted}
            />
          </div>
        </div>

        {/* ═══════════ FOOTER ═══════════ */}
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

// ---- Info Row Sub-component ----

function InfoRow({
  icon,
  title,
  subtitle,
  muted,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  muted?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    }}>
      <span style={{
        fontSize: '20px',
        lineHeight: '24px',
        flexShrink: 0,
        opacity: muted ? 0.5 : 1,
      }}>
        {icon}
      </span>
      <div>
        <p style={{
          fontSize: '15px',
          color: muted ? BrandColors.text2 : BrandColors.text1,
          fontWeight: muted ? 400 : 500,
          fontStyle: muted ? 'italic' : 'normal',
        }}>
          {title}
        </p>
        {subtitle && (
          <p style={{
            fontSize: '13px',
            color: BrandColors.text2,
            marginTop: '2px',
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
