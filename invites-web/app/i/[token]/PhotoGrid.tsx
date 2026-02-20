'use client';

import { useState } from 'react';
import { BrandColors, Spacing } from '../../design/constants';
import type { EventPhoto } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// PhotoGrid — 3-column grid matching Flutter's LivingPhotosWidget
//
// Features:
// - 4:5 aspect ratio tiles
// - Max 9 visible slots, +N overflow on last slot
// - Optional "Add Photo" card (matching Flutter's _AddPhotoCard)
// - Full-screen lightbox with navigation
// ═══════════════════════════════════════════════════════════════════

interface PhotoGridProps {
  photos: EventPhoto[];
  accentColor?: string;
  onAddPhoto?: () => void;
  showAddCard?: boolean;
}

const COLUMNS = 3;
const MAX_SLOTS = 9;
const GAP = 8; // matches Gaps.xs

export default function PhotoGrid({
  photos,
  accentColor = BrandColors.living,
  onAddPhoto,
  showAddCard = false,
}: PhotoGridProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const totalCount = photos.length;

  // ── Empty State (matching Flutter's empty camera card) ──
  if (totalCount === 0 && !showAddCard) {
    return (
      <div style={{
        padding: `${Spacing.xl} ${Spacing.md}`,
        background: BrandColors.bg3,
        borderRadius: Spacing.radiusSm,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '32px', marginBottom: Spacing.sm }}>📷</div>
        <p style={{
          fontSize: '16px',
          fontWeight: 600,
          color: BrandColors.text1,
          marginBottom: Spacing.xxs,
        }}>
          No photos yet
        </p>
        <p style={{
          fontSize: '14px',
          color: BrandColors.text2,
        }}>
          Photos will appear here during the event
        </p>
      </div>
    );
  }

  // Empty state with add button
  if (totalCount === 0 && showAddCard) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
        gap: `${GAP}px`,
      }}>
        <AddPhotoCard accentColor={accentColor} onClick={onAddPhoto} />
      </div>
    );
  }

  // Calculate grid slots
  const hasOverflow = totalCount >= MAX_SLOTS;
  const addCardFits = showAddCard && totalCount < MAX_SLOTS;
  const photoSlots = hasOverflow ? MAX_SLOTS : totalCount;
  const overflowCount = hasOverflow ? totalCount - MAX_SLOTS + 1 : 0;

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
        gap: `${GAP}px`,
      }}>
        {photos.slice(0, photoSlots).map((photo, i) => {
          const isLastWithOverflow = hasOverflow && i === MAX_SLOTS - 1;

          return (
            <div
              key={photo.photo_id}
              onClick={() => setLightboxIdx(i)}
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
                  // Show placeholder icon on error
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
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}>
                    +{overflowCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Photo Card — shown after photos if grid has space */}
        {addCardFits && (
          <AddPhotoCard accentColor={accentColor} onClick={onAddPhoto} />
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <Lightbox
          photos={photos}
          currentIdx={lightboxIdx}
          onIndexChange={setLightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}


// ── Add Photo Card ─────────────────────────────────────────────
// Matches Flutter's _AddPhotoCard: dashed border, camera icon, "Add" label

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
      <span style={{
        fontSize: '11px',
        fontWeight: 500,
        color: accentColor,
      }}>
        Add
      </span>
    </button>
  );
}


// ── Lightbox ───────────────────────────────────────────────────
// Full-screen photo viewer with navigation arrows, swipe support, and counter

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
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        cursor: 'pointer',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '16px',
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

      {/* Nav: Previous */}
      {currentIdx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onIndexChange(currentIdx - 1); }}
          style={{
            position: 'absolute',
            left: '12px',
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
          onClick={(e) => { e.stopPropagation(); onIndexChange(currentIdx + 1); }}
          style={{
            position: 'absolute',
            right: '12px',
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

      {/* Image */}
      <img
        src={photos[currentIdx].url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: Spacing.radiusSm,
          cursor: 'default',
        }}
      />

      {/* Counter */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        fontSize: '14px',
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 500,
      }}>
        {currentIdx + 1} / {photos.length}
      </div>
    </div>
  );
}
