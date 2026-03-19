'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { BrandColors, Spacing } from '../../design/constants';
import type { EventPhoto } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// PhotoGrid — 3-column grid showing max 3 photos + Add card
//
// Features:
// - Max 3 visible photos in the grid, +N overflow on 3rd if more
// - Clicking the header chevron (>) opens ManagePhotosSheet (all photos)
// - Full-screen lightbox with horizontal swipe/scroll navigation
// - No vertical scrolling in lightbox
// ═══════════════════════════════════════════════════════════════════

interface PhotoGridProps {
  photos: EventPhoto[];
  accentColor?: string;
  onAddPhoto?: () => void;
  showAddCard?: boolean;
  showAllPhotos?: boolean;
  onShowAllPhotosChange?: (show: boolean) => void;
}

const COLUMNS = 3;
const MAX_VISIBLE = 3;
const GAP = 8;

export default function PhotoGrid({
  photos,
  accentColor = BrandColors.living,
  onAddPhoto,
  showAddCard = false,
  showAllPhotos: externalShowAll,
  onShowAllPhotosChange,
}: PhotoGridProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [internalShowAll, setInternalShowAll] = useState(() => externalShowAll ?? false);

  const showAllPhotos = externalShowAll ?? internalShowAll;
  const setShowAllPhotos = useCallback((val: boolean) => {
    if (externalShowAll === undefined) {
      setInternalShowAll(val);
    }
    onShowAllPhotosChange?.(val);
  }, [externalShowAll, onShowAllPhotosChange]);

  const totalCount = photos.length;

  // ── Empty State ──
  if (totalCount === 0 && !showAddCard) {
    return (
      <div style={{
        padding: `${Spacing.xl} ${Spacing.md}`,
        background: BrandColors.bg3,
        borderRadius: Spacing.radiusSm,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '32px', marginBottom: Spacing.sm }}>📷</div>
        <p style={{ fontSize: '16px', fontWeight: 600, color: BrandColors.text1, marginBottom: Spacing.xxs }}>
          No photos yet
        </p>
        <p style={{ fontSize: '14px', color: BrandColors.text2 }}>
          Photos will appear here during the event
        </p>
      </div>
    );
  }

  if (totalCount === 0 && showAddCard) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`, gap: `${GAP}px` }}>
        <AddPhotoCard accentColor={accentColor} onClick={onAddPhoto} />
      </div>
    );
  }

  // Show max 3 photos in grid, with overflow count on 3rd
  const hasOverflow = totalCount > MAX_VISIBLE;
  const visibleCount = Math.min(totalCount, MAX_VISIBLE);
  const overflowCount = hasOverflow ? totalCount - MAX_VISIBLE + 1 : 0;
  const addCardFits = showAddCard && totalCount < MAX_VISIBLE;

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
        gap: `${GAP}px`,
      }}>
        {photos.slice(0, visibleCount).map((photo, i) => {
          const isLastWithOverflow = hasOverflow && i === MAX_VISIBLE - 1;

          return (
            <div
              key={photo.photo_id}
              onClick={() => {
                if (isLastWithOverflow) {
                  setShowAllPhotos(true);
                } else {
                  setLightboxIdx(i);
                }
              }}
              style={{
                aspectRatio: '4/5',
                borderRadius: Spacing.radiusSm,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
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
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  if (img.parentElement) {
                    img.parentElement.style.display = 'flex';
                    img.parentElement.style.alignItems = 'center';
                    img.parentElement.style.justifyContent = 'center';
                    const span = document.createElement('span');
                    span.textContent = '📷';
                    span.style.fontSize = '24px';
                    span.style.opacity = '0.5';
                    img.parentElement.appendChild(span);
                  }
                }}
              />
              {isLastWithOverflow && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>
                    +{overflowCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {addCardFits && (
          <AddPhotoCard accentColor={accentColor} onClick={onAddPhoto} />
        )}
      </div>

      {/* ── Lightbox (horizontal swipe) ── */}
      {lightboxIdx !== null && (
        <Lightbox
          photos={photos}
          currentIdx={lightboxIdx}
          onIndexChange={setLightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* ── All Photos Sheet ── */}
      {showAllPhotos && (
        <AllPhotosSheet
          photos={photos}
          accentColor={accentColor}
          onAddPhoto={onAddPhoto}
          showAddCard={showAddCard}
          onClose={() => setShowAllPhotos(false)}
          onPhotoClick={(idx) => {
            setShowAllPhotos(false);
            setLightboxIdx(idx);
          }}
        />
      )}
    </>
  );
}


// ── Add Photo Card ─────────────────────────────────────────────

function AddPhotoCard({
  accentColor,
  onClick,
}: {
  accentColor: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        aspectRatio: '4/5',
        borderRadius: Spacing.radiusSm,
        border: `2px dashed ${accentColor}40`,
        background: `${accentColor}10`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${accentColor}20`;
        e.currentTarget.style.borderColor = `${accentColor}80`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${accentColor}10`;
        e.currentTarget.style.borderColor = `${accentColor}40`;
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span style={{ fontSize: '11px', fontWeight: 500, color: accentColor }}>
        Add
      </span>
    </button>
  );
}


// ── All Photos Sheet ───────────────────────────────────────────
// Full-screen sheet showing ALL photos in a grid

function AllPhotosSheet({
  photos,
  accentColor,
  onAddPhoto,
  showAddCard,
  onClose,
  onPhotoClick,
}: {
  photos: EventPhoto[];
  accentColor: string;
  onAddPhoto?: () => void;
  showAddCard: boolean;
  onClose: () => void;
  onPhotoClick: (idx: number) => void;
}) {
  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 950,
      background: BrandColors.bg1,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${Spacing.md} ${Spacing.md}`,
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        borderBottom: `1px solid ${BrandColors.border}`,
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: BrandColors.text1,
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 0',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <p style={{ fontSize: '16px', fontWeight: 600, color: BrandColors.text1 }}>
          Manage Photos
        </p>
        <div style={{ width: '60px' }} /> {/* spacer for centering */}
      </div>

      {/* Photo Grid (scrollable) */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: Spacing.md,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
          gap: `${GAP}px`,
        }}>
          {photos.map((photo, i) => (
            <div
              key={photo.photo_id}
              onClick={() => onPhotoClick(i)}
              style={{
                aspectRatio: '4/5',
                borderRadius: Spacing.radiusSm,
                overflow: 'hidden',
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
          {showAddCard && (
            <AddPhotoCard accentColor={accentColor} onClick={onAddPhoto} />
          )}
        </div>
      </div>
    </div>
  );
}


// ── Lightbox (horizontal swipe, no vertical scroll) ────────────
// Uses a horizontally scrollable container with snap points.

function Lightbox({
  photos,
  currentIdx,
  onIndexChange,
  onClose,
}: {
  photos: EventPhoto[];
  currentIdx: number;
  onIndexChange: (idx: number) => void;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock body scroll
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

  // Scroll to currentIdx on mount and when currentIdx changes programmatically
  useEffect(() => {
    if (scrollRef.current && !isUserScrolling.current) {
      const container = scrollRef.current;
      const targetX = currentIdx * container.clientWidth;
      container.scrollTo({ left: targetX, behavior: 'smooth' });
    }
  }, [currentIdx]);

  // Detect which photo is visible after scroll ends, update index
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
          onIndexChange(clamped);
        }
      }
    }, 100);
  }, [photos.length, onIndexChange]);

  const goTo = useCallback((idx: number) => {
    isUserScrolling.current = false;
    onIndexChange(idx);
  }, [onIndexChange]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out',
        touchAction: 'none',
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
          zIndex: 1001,
        }}
      >
        ✕
      </button>

      {/* Horizontally scrollable photo strip */}
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
        {photos.map((photo, i) => (
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

      {/* Nav: Previous */}
      {currentIdx > 0 && (
        <button
          onClick={() => goTo(currentIdx - 1)}
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
            zIndex: 1001,
          }}
        >
          ‹
        </button>
      )}

      {/* Nav: Next */}
      {currentIdx < photos.length - 1 && (
        <button
          onClick={() => goTo(currentIdx + 1)}
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
            zIndex: 1001,
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
        zIndex: 1001,
      }}>
        {currentIdx + 1} / {photos.length}
      </div>

      {/* Hide scrollbar via inline style tag */}
      <style>{`
        div[style*="scroll-snap-type"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
