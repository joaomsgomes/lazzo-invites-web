'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import ShareSheet from './ShareSheet';
import HybridPhotoGrid from './HybridPhotoGrid';
import type { EventData, EventPhoto } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// EndedSection — Memory view for ended events
//
// Matches Flutter MemoryPage for ended state (read-only):
//   - Cover mosaic (if cover photo selected)
//   - Photo grid (3 columns, 4:5 aspect ratio)
//   - Share button to share the memory link
//   - No upload/edit/banner — purely read-only
// ═══════════════════════════════════════════════════════════════════

interface EndedSectionProps {
  event: EventData;
  token: string;
  photos: EventPhoto[];
  coverPhotoId: string | null;
  onSharePress: () => void;
}

export default function EndedSection({
  event,
  token,
  photos,
  coverPhotoId,
  onSharePress,
}: EndedSectionProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);

  const inviteUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Split photos: cover photo goes to mosaic, rest to grid
  const coverPhotos = coverPhotoId
    ? photos.filter(p => p.photo_id === coverPhotoId)
    : [];
  const gridPhotos = coverPhotoId
    ? photos.filter(p => p.photo_id !== coverPhotoId)
    : photos;

  // Stats
  const participantCount = event.participant_count ?? 0;
  const statsItems: string[] = [];
  if (photos.length > 0) statsItems.push(`${photos.length} photo${photos.length !== 1 ? 's' : ''}`);
  if (participantCount > 0) statsItems.push(`${participantCount} participant${participantCount !== 1 ? 's' : ''}`);
  const statsText = statsItems.join(' · ');

  // Format date
  const formatDate = (start: string | null, end: string | null): string => {
    if (!start) return '';
    const s = new Date(start);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

    if (end) {
      const e = new Date(end);
      if (s.toDateString() === e.toDateString()) return s.toLocaleDateString('en-GB', opts);
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        return `${s.getDate()}–${e.toLocaleDateString('en-GB', opts)}`;
      }
      return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', opts)}`;
    }
    return s.toLocaleDateString('en-GB', opts);
  };

  const subtitle = [
    event.location_name,
    formatDate(event.start_datetime, event.end_datetime),
  ].filter(Boolean).join(' · ');

  if (photos.length === 0) {
    // No photos — show simple ended message
    return (
      <div style={{
        background: BrandColors.bg2,
        borderRadius: Spacing.radiusMd,
        padding: Spacing.lg,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: Spacing.sm }}>📸</div>
        <p style={{
          ...Typography.titleMediumEmph,
          color: BrandColors.text1,
          marginBottom: Spacing.xs,
        }}>
          Event has ended
        </p>
        <p style={{
          fontSize: '14px',
          color: BrandColors.text2,
        }}>
          No photos were captured for this event.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Memory Card — matches Flutter MemoryPage for ended state ── */}
      <div style={{
        background: BrandColors.bg2,
        borderRadius: Spacing.radiusMd,
        overflow: 'hidden',
      }}>
        {/* Header with emoji + event name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${Spacing.md} ${Spacing.md} ${Spacing.xs}`,
        }}>
          <h2 style={{
            ...Typography.titleMediumEmph,
            color: BrandColors.text1,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: Spacing.xs,
          }}>
            {event.event_emoji || '📅'} Memory
          </h2>

          {/* Share button */}
          <button
            onClick={onSharePress}
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>

        {/* Subtitle + stats */}
        {subtitle && (
          <p style={{
            fontSize: '13px',
            color: BrandColors.text2,
            textAlign: 'center',
            margin: 0,
            padding: `0 ${Spacing.md}`,
            marginBottom: Spacing.xxs,
          }}>
            {subtitle}
          </p>
        )}
        {statsText && (
          <p style={{
            fontSize: '13px',
            color: BrandColors.text2,
            textAlign: 'center',
            margin: 0,
            padding: `0 ${Spacing.md}`,
            marginBottom: Spacing.md,
          }}>
            {statsText}
          </p>
        )}

        {/* Cover Mosaic */}
        {coverPhotos.length > 0 && (
          <div style={{ padding: `0 ${Spacing.md}` }}>
            <CoverMosaic photos={coverPhotos} onPhotoTap={setLightboxIdx} />
          </div>
        )}

        {/* Photo Grid (matching Flutter HybridPhotoGrid algorithm) */}
        {gridPhotos.length > 0 && (
          <div style={{
            padding: `0 ${Spacing.md}`,
            marginTop: coverPhotos.length > 0 ? '8px' : '0',
            paddingBottom: Spacing.md,
          }}>
            <HybridPhotoGrid
              photos={gridPhotos}
              onPhotoTap={(photoId) => {
                const idx = photos.findIndex(p => p.photo_id === photoId);
                if (idx >= 0) setLightboxIdx(idx);
              }}
            />
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={photos}
          currentIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* Share Sheet */}
      {showShare && (
        <ShareSheet
          inviteUrl={inviteUrl}
          eventId={event.event_id}
          eventName={event.event_name}
          eventEmoji={event.event_emoji || '📅'}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}


// ── Cover Mosaic — Single cover hero display ──────────────────

function CoverMosaic({
  photos,
  onPhotoTap,
}: {
  photos: EventPhoto[];
  onPhotoTap: (idx: number) => void;
}) {
  if (photos.length === 0) return null;

  // Single cover — full width hero
  return (
    <div
      onClick={() => onPhotoTap(0)}
      style={{
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '16px',
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current && !isUserScrolling.current) {
      const container = scrollRef.current;
      const targetX = idx * container.clientWidth;
      container.scrollTo({ left: targetX, behavior: 'smooth' });
    }
  }, [idx]);

  const handleScroll = useCallback(() => {
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
      if (scrollRef.current) {
        const container = scrollRef.current;
        const w = container.clientWidth;
        if (w > 0) {
          const newIdx = Math.round(container.scrollLeft / w);
          const clamped = Math.max(0, Math.min(newIdx, photos.length - 1));
          setIdx(clamped);
        }
      }
    }, 100);
  }, [photos.length]);

  const goTo = useCallback((newIdx: number) => {
    isUserScrolling.current = false;
    setIdx(newIdx);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'none',
      }}
    >
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

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {photos.map((photo) => (
          <div
            key={photo.photo_id}
            style={{
              flex: '0 0 100%',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              scrollSnapAlign: 'center',
              padding: Spacing.md,
              boxSizing: 'border-box',
            }}
          >
            <img
              src={photo.url}
              alt=""
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: Spacing.radiusSm,
                userSelect: 'none',
                pointerEvents: 'none',
              } as React.CSSProperties}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {idx > 0 && (
        <button
          onClick={() => goTo(idx - 1)}
          style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            width: '40px', height: '40px', borderRadius: '50%', fontSize: '20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2001,
          }}
        >
          ‹
        </button>
      )}
      {idx < photos.length - 1 && (
        <button
          onClick={() => goTo(idx + 1)}
          style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            width: '40px', height: '40px', borderRadius: '50%', fontSize: '20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2001,
          }}
        >
          ›
        </button>
      )}

      <div style={{
        position: 'absolute',
        bottom: 'max(env(safe-area-inset-bottom), 20px)',
        left: 0, right: 0,
        textAlign: 'center',
        fontSize: '14px',
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 500,
        zIndex: 2001,
      }}>
        {idx + 1} / {photos.length}
      </div>

      <style>{`
        div[style*="scroll-snap-type"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
