'use client';

import { BrandColors, Spacing, Typography } from '../../design/constants';
import PhotoGrid from './PhotoGrid';
import type { EventData, EventPhoto } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// MemorySheet — Full-screen overlay matching Flutter's MemoryPage
//
// Layout: Back button → Emoji + Title → Subtitle → Stats → Photos
// ═══════════════════════════════════════════════════════════════════

interface MemorySheetProps {
  event: EventData;
  photos: EventPhoto[];
  onClose: () => void;
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

  if (end) {
    const e = new Date(end);
    // Same day
    if (s.toDateString() === e.toDateString()) {
      return s.toLocaleDateString('en-GB', opts);
    }
    // Same month+year
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.getDate()}–${e.toLocaleDateString('en-GB', opts)}`;
    }
    return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', opts)}`;
  }
  return s.toLocaleDateString('en-GB', opts);
}

export default function MemorySheet({ event, photos, onClose }: MemorySheetProps) {
  const subtitle = [
    event.location_name,
    formatDateRange(event.start_datetime, event.end_datetime),
  ].filter(Boolean).join(' · ');

  const participantCount = event.participant_count ?? 0;

  // Stats text
  const statsItems: string[] = [];
  if (photos.length > 0) statsItems.push(`${photos.length} photo${photos.length !== 1 ? 's' : ''}`);
  if (participantCount > 0) statsItems.push(`${participantCount} participant${participantCount !== 1 ? 's' : ''}`);
  const statsText = statsItems.join(' · ');

  // Cover photos: first 3 for a mosaic-style hero
  const coverPhotos = photos.slice(0, 3);
  const gridPhotos = photos.slice(3);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: BrandColors.bg1,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: `${Spacing.sm} ${Spacing.md}`,
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        gap: Spacing.sm,
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 style={{
          ...Typography.titleMediumEmph,
          color: BrandColors.text1,
          margin: 0,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {event.event_emoji} {event.event_name}
        </h1>
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Subtitle: location · date */}
        {subtitle && (
          <p style={{
            fontSize: '14px',
            color: BrandColors.text2,
            textAlign: 'center',
            margin: 0,
            padding: `0 ${Spacing.md}`,
            marginBottom: Spacing.xs,
          }}>
            {subtitle}
          </p>
        )}

        {/* Stats */}
        {statsText && (
          <p style={{
            fontSize: '14px',
            color: BrandColors.text2,
            textAlign: 'center',
            margin: 0,
            padding: `0 ${Spacing.md}`,
            marginBottom: Spacing.md,
          }}>
            {statsText}
          </p>
        )}

        {/* ── Photos ── */}
        {photos.length === 0 ? (
          /* Empty state */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${Spacing.xl} ${Spacing.md}`,
            gap: Spacing.md,
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p style={{
              ...Typography.titleMediumEmph,
              color: BrandColors.text1,
              margin: 0,
            }}>
              No photos yet
            </p>
            <p style={{
              fontSize: '14px',
              color: BrandColors.text2,
              margin: 0,
              textAlign: 'center',
            }}>
              Photos will appear here once added
            </p>
          </div>
        ) : (
          <div style={{
            padding: `0 ${Spacing.md}`,
            paddingBottom: Spacing.xl,
          }}>
            {/* Cover Mosaic (first 3 photos) */}
            {coverPhotos.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: coverPhotos.length === 1 ? '1fr' :
                  coverPhotos.length === 2 ? '1fr 1fr' : '2fr 1fr',
                gridTemplateRows: coverPhotos.length <= 2 ? '200px' : '200px',
                gap: '4px',
                borderRadius: Spacing.radiusMd,
                overflow: 'hidden',
                marginBottom: '4px',
              }}>
                {coverPhotos.map((photo, i) => (
                  <div
                    key={photo.photo_id}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      ...(coverPhotos.length === 3 && i === 0
                        ? { gridRow: '1 / 2' }
                        : {}),
                    }}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Remaining photos in a 3-column grid */}
            {gridPhotos.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
              }}>
                {gridPhotos.map((photo) => (
                  <div
                    key={photo.photo_id}
                    style={{
                      position: 'relative',
                      paddingBottom: '100%',
                      overflow: 'hidden',
                      borderRadius: '4px',
                    }}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
