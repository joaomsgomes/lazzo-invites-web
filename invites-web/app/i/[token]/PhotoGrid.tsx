'use client';

import { useState } from 'react';
import { BrandColors, Spacing } from '../../design/constants';
import type { EventPhoto } from '../../../lib/supabase';

// ── PhotoGrid: 3-column grid matching Flutter's LivingPhotosWidget ──
// 4:5 aspect ratio tiles, max 9 visible, +N overflow on last slot

interface PhotoGridProps {
  photos: EventPhoto[];
  accentColor?: string;
}

const COLUMNS = 3;
const MAX_SLOTS = 9;
const GAP = 8; // matches Gaps.xs

export default function PhotoGrid({ photos, accentColor = BrandColors.living }: PhotoGridProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const totalCount = photos.length;

  if (totalCount === 0) {
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

  const isFull = totalCount >= MAX_SLOTS;
  const slotsToShow = isFull ? MAX_SLOTS : totalCount;
  const hasOverflow = totalCount > MAX_SLOTS;
  const overflowCount = totalCount - MAX_SLOTS + 1;

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
        gap: `${GAP}px`,
      }}>
        {photos.slice(0, slotsToShow).map((photo, i) => {
          const isLastWithOverflow = i === MAX_SLOTS - 1 && hasOverflow;

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
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          onClick={() => setLightboxIdx(null)}
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
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIdx(null)}
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
            }}
          >
            ✕
          </button>

          {/* Nav arrows */}
          {lightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
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
              }}
            >
              ‹
            </button>
          )}
          {lightboxIdx < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
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
              }}
            >
              ›
            </button>
          )}

          {/* Image */}
          <img
            src={photos[lightboxIdx].url}
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
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
