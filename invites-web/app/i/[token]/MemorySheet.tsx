'use client';

import { useState, useEffect } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import PhotoUploadSheet from './PhotoUploadSheet';
import ShareSheet from './ShareSheet';
import type { EventData, EventPhoto } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// MemorySheet — Full-screen overlay matching Flutter's MemoryPage
//
// Layout (matches Flutter CommonAppBar):
//   AppBar: [← back]  [emoji title centered]  [share icon →]
//   Body:  subtitle · stats · CoverMosaic · PhotoGrid
//   Bottom: "Add your photos" banner with upload button
// ═══════════════════════════════════════════════════════════════════

interface MemorySheetProps {
  event: EventData;
  photos: EventPhoto[];
  token: string;
  onPhotoUploaded: (photo: EventPhoto) => void;
  onSharePress: () => void;
  onClose: () => void;
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

  if (end) {
    const e = new Date(end);
    if (s.toDateString() === e.toDateString()) {
      return s.toLocaleDateString('en-GB', opts);
    }
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.getDate()}–${e.toLocaleDateString('en-GB', opts)}`;
    }
    return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', opts)}`;
  }
  return s.toLocaleDateString('en-GB', opts);
}

export default function MemorySheet({ event, photos, token, onPhotoUploaded, onSharePress, onClose }: MemorySheetProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const inviteUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const subtitle = [
    event.location_name,
    formatDateRange(event.start_datetime, event.end_datetime),
  ].filter(Boolean).join(' · ');

  const participantCount = event.participant_count ?? 0;

  const statsItems: string[] = [];
  if (photos.length > 0) statsItems.push(`${photos.length} photo${photos.length !== 1 ? 's' : ''}`);
  if (participantCount > 0) statsItems.push(`${participantCount} participant${participantCount !== 1 ? 's' : ''}`);
  const statsText = statsItems.join(' · ');

  // Cover mosaic: first 3 photos
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
      {/* ── AppBar (matches Flutter CommonAppBar — centered title) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${Spacing.md}`,
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        height: '56px',
        flexShrink: 0,
        position: 'relative',
      }}>
        {/* Back button — left-aligned */}
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
            zIndex: 1,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Title — absolutely centered */}
        <h1 style={{
          ...Typography.titleMediumEmph,
          color: BrandColors.text1,
          margin: 0,
          position: 'absolute',
          left: '56px',
          right: '56px',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '18px',
          fontWeight: 500,
        }}>
          {event.event_emoji} {event.event_name}
        </h1>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Share button — right-aligned (iOS share icon) */}
        <button
          onClick={() => setShowShare(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '100px', // space for bottom banner
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
          /* Empty state — tappable to open upload */
          <div
            onClick={() => setShowUpload(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${Spacing.xl} ${Spacing.md}`,
              margin: `0 ${Spacing.md}`,
              gap: Spacing.md,
              background: BrandColors.bg2,
              borderRadius: Spacing.radiusMd,
              border: `1px solid ${BrandColors.border}`,
              cursor: 'pointer',
            }}
          >
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
              Add your photos to create the memory
            </p>
          </div>
        ) : (
          <div style={{ padding: `0 ${Spacing.md}` }}>
            {/* Cover Mosaic (first 3 photos — matching Flutter CoverMosaic) */}
            {coverPhotos.length > 0 && (
              <CoverMosaic photos={coverPhotos} onPhotoTap={setLightboxIdx} />
            )}

            {/* Grid photos (3-column, matching Flutter HybridPhotoGrid) */}
            {gridPhotos.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                marginTop: '4px',
              }}>
                {gridPhotos.map((photo, i) => (
                  <div
                    key={photo.photo_id}
                    onClick={() => setLightboxIdx(coverPhotos.length + i)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      overflow: 'hidden',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: BrandColors.bg3,
                    }}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      loading="lazy"
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
          </div>
        )}
      </div>

      {/* ── Bottom Banner: "Add your photos" (matches Flutter) ── */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: `${Spacing.md} ${Spacing.md}`,
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        background: BrandColors.bg2,
        borderTop: `1px solid ${BrandColors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: Spacing.md,
      }}>
        <div style={{ flex: 1 }}>
          <p style={{
            ...Typography.titleMediumEmph,
            color: BrandColors.text1,
            margin: 0,
          }}>
            Add your photos
          </p>
          <p style={{
            fontSize: '13px',
            color: BrandColors.text2,
            margin: 0,
            marginTop: '2px',
          }}>
            You can then select a photo cover
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: Spacing.radiusSm,
            background: BrandColors.recap,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.15s',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.93)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
      </div>

      {/* ── Photo Upload Sheet ── */}
      {showUpload && (
        <PhotoUploadSheet
          token={token}
          eventId={event.event_id}
          accentColor={BrandColors.recap}
          eventStatus="recap"
          onPhotoUploaded={onPhotoUploaded}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* ── Share Sheet (rendered above MemorySheet) ── */}
      {showShare && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100 }}>
          <ShareSheet
            inviteUrl={inviteUrl}
            eventId={event.event_id}
            eventName={event.event_name}
            eventEmoji={event.event_emoji || '📅'}
            onClose={() => setShowShare(false)}
          />
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={photos}
          currentIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}


// ── Cover Mosaic (matches Flutter CoverMosaic) ─────────────────
// 1 photo: full width hero
// 2 photos: side by side
// 3 photos: large left + 2 stacked right

function CoverMosaic({
  photos,
  onPhotoTap,
}: {
  photos: EventPhoto[];
  onPhotoTap: (idx: number) => void;
}) {
  if (photos.length === 1) {
    return (
      <div
        onClick={() => onPhotoTap(0)}
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: Spacing.radiusMd,
          overflow: 'hidden',
          cursor: 'pointer',
          background: BrandColors.bg3,
        }}
      >
        <img
          src={photos[0].url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  if (photos.length === 2) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        borderRadius: Spacing.radiusMd,
        overflow: 'hidden',
      }}>
        {photos.map((photo, i) => (
          <div
            key={photo.photo_id}
            onClick={() => onPhotoTap(i)}
            style={{
              aspectRatio: '4/5',
              overflow: 'hidden',
              cursor: 'pointer',
              background: BrandColors.bg3,
            }}
          >
            <img
              src={photo.url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 photos: large left + 2 stacked right
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: '4px',
      height: '280px',
      borderRadius: Spacing.radiusMd,
      overflow: 'hidden',
    }}>
      <div
        onClick={() => onPhotoTap(0)}
        style={{
          gridRow: '1 / 3',
          overflow: 'hidden',
          cursor: 'pointer',
          background: BrandColors.bg3,
        }}
      >
        <img
          src={photos[0].url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <div
        onClick={() => onPhotoTap(1)}
        style={{
          overflow: 'hidden',
          cursor: 'pointer',
          background: BrandColors.bg3,
        }}
      >
        <img
          src={photos[1].url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <div
        onClick={() => onPhotoTap(2)}
        style={{
          overflow: 'hidden',
          cursor: 'pointer',
          background: BrandColors.bg3,
        }}
      >
        <img
          src={photos[2].url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    </div>
  );
}


// ── Photo Lightbox ─────────────────────────────────────────────

function PhotoLightbox({
  photos,
  currentIdx,
  onClose,
}: {
  photos: EventPhoto[];
  currentIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(currentIdx);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && idx > 0) setIdx(idx - 1);
      if (e.key === 'ArrowRight' && idx < photos.length - 1) setIdx(idx + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [idx, photos.length, onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 'max(env(safe-area-inset-top), 16px)',
          right: '16px',
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          color: '#fff',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          fontSize: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2001,
        }}
      >
        ✕
      </button>

      {/* Photo */}
      <img
        src={photos[idx].url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90%',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: Spacing.radiusSm,
          userSelect: 'none',
        }}
        draggable={false}
      />

      {/* Nav: Previous */}
      {idx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx(idx - 1); }}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2001,
          }}
        >
          ‹
        </button>
      )}

      {/* Nav: Next */}
      {idx < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx(idx + 1); }}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2001,
          }}
        >
          ›
        </button>
      )}

      {/* Counter */}
      <div style={{
        position: 'absolute',
        bottom: 'max(env(safe-area-inset-bottom), 20px)',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '14px',
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 500,
        zIndex: 2001,
      }}>
        {idx + 1} / {photos.length}
      </div>
    </div>
  );
}
