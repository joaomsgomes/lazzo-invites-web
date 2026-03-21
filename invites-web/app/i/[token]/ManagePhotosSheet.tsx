'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import type { EventPhoto } from '../../../lib/supabase';
import { AddPhotoCard } from './PhotoGrid';

// ═══════════════════════════════════════════════════════════════════
// ManagePhotosSheet — Full-screen overlay for managing event photos
//
// Matches Flutter ManageMemoryPage structure:
//   AppBar: [← back]  "Manage Photos"  [spacer]
//   Body:  CoverSelectionCard → Photos header + count → 3-column grid
//
// Features:
// - View all photos
// - Tap a photo to set as cover
// - Cover photo highlighted with star badge
// - Tap cover card to browse and select from grid bottom sheet
// ═══════════════════════════════════════════════════════════════════

const COLUMNS = 3;
const GAP = 6;

interface ManagePhotosSheetProps {
  photos: EventPhoto[];
  token: string;
  coverPhotoId: string | null;
  accentColor?: string;
  onCoverChanged: (photoId: string | null) => void;
  onAddPhoto?: () => void;
  onClose: () => void;
}

export default function ManagePhotosSheet({
  photos,
  token,
  coverPhotoId,
  accentColor = BrandColors.living,
  onCoverChanged,
  onAddPhoto,
  onClose,
}: ManagePhotosSheetProps) {
  const [localCoverId, setLocalCoverId] = useState<string | null>(coverPhotoId);
  const [settingCover, setSettingCover] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showCoverSelector, setShowCoverSelector] = useState(false);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Find the current cover photo object
  const coverPhoto = photos.find(p => p.photo_id === localCoverId) ?? null;

  // Handle setting a photo as cover
  const handleSetCover = useCallback(async (photoId: string) => {
    if (settingCover) return;
    const newCoverId = photoId === localCoverId ? null : photoId;

    setSettingCover(true);
    try {
      const res = await fetch('/api/set-cover-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, photoId: newCoverId }),
      });

      if (res.ok) {
        setLocalCoverId(newCoverId);
        onCoverChanged(newCoverId);
      }
    } catch {
      // Silent fail
    } finally {
      setSettingCover(false);
    }
  }, [token, localCoverId, settingCover, onCoverChanged]);

  // Handle removing cover
  const handleRemoveCover = useCallback(async () => {
    if (settingCover) return;
    setSettingCover(true);
    try {
      const res = await fetch('/api/set-cover-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, photoId: null }),
      });

      if (res.ok) {
        setLocalCoverId(null);
        onCoverChanged(null);
      }
    } catch {
      // Silent fail
    } finally {
      setSettingCover(false);
    }
  }, [token, settingCover, onCoverChanged]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 950,
      background: BrandColors.bg1,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: Typography.fontFamily,
    }}>
      {/* ── AppBar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${Spacing.sm} ${Spacing.md}`,
        paddingTop: `max(env(safe-area-inset-top, 12px), ${Spacing.sm})`,
        minHeight: '56px',
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          aria-label="Back"
          style={{
            background: 'none',
            border: 'none',
            padding: Spacing.xs,
            cursor: 'pointer',
            color: BrandColors.text1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h1 style={{
          ...Typography.titleLargeEmph,
          color: BrandColors.text1,
          margin: 0,
        }}>
          Manage Photos
        </h1>

        {/* Spacer */}
        <div style={{ width: '40px' }} />
      </div>

      {/* ── Scrollable content (same max width as EventPage column) ── */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: `0 ${Spacing.md}`,
        paddingBottom: Spacing.lg,
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          margin: '0 auto',
        }}>

        {/* ── Cover Selection Card (matching Flutter CoverSelectionCard) ── */}
        {photos.length > 0 && (
          <div
            onClick={() => setShowCoverSelector(true)}
            style={{ marginBottom: Spacing.lg, cursor: 'pointer' }}
          >
            <CoverSelectionCard
              coverPhoto={coverPhoto}
              accentColor={accentColor}
              settingCover={settingCover}
              onRemove={coverPhoto ? handleRemoveCover : undefined}
            />
          </div>
        )}

        {/* ── Photos section header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: Spacing.sm,
        }}>
          <p style={{
            ...Typography.titleMediumEmph,
            color: BrandColors.text1,
            margin: 0,
          }}>
            Photos
          </p>
          <p style={{
            ...Typography.bodyMedium,
            color: BrandColors.text2,
            margin: 0,
          }}>
            {photos.length}
          </p>
        </div>

        {/* ── Photo Grid (3 columns) ── */}
        {photos.length === 0 ? (
          <div style={{
            padding: Spacing.xl,
            textAlign: 'center',
            background: BrandColors.bg2,
            borderRadius: Spacing.radiusMd,
          }}>
            <div style={{ fontSize: '32px', marginBottom: Spacing.sm }}></div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: BrandColors.text1, marginBottom: Spacing.xxs }}>
              No photos yet
            </p>
            <p style={{ fontSize: '14px', color: BrandColors.text2 }}>
              Upload some photos to get started
            </p>
            {onAddPhoto && (
              <button
                type="button"
                onClick={onAddPhoto}
                style={{
                  marginTop: Spacing.md,
                  padding: `${Spacing.sm} ${Spacing.lg}`,
                  background: BrandColors.bg3,
                  color: BrandColors.text1,
                  border: `2px dashed ${BrandColors.text2}`,
                  borderRadius: Spacing.radiusSmAlt,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add Photos
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
            gap: `${GAP}px`,
          }}>
            {photos.map((photo, idx) => {
              return (
                <div
                  key={photo.photo_id}
                  onClick={() => setLightboxIdx(idx)}
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
                  />
                </div>
              );
            })}

            {onAddPhoto && (
              <AddPhotoCard onClick={onAddPhoto} />
            )}
          </div>
        )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={photos}
          currentIdx={lightboxIdx}
          onIndexChange={setLightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* ── Cover Selector Bottom Sheet ── */}
      {showCoverSelector && (
        <CoverSelectorSheet
          photos={photos}
          currentCoverId={localCoverId}
          onSelect={async (photoId) => {
            await handleSetCover(photoId);
            setShowCoverSelector(false);
          }}
          onClose={() => setShowCoverSelector(false)}
          settingCover={settingCover}
        />
      )}
    </div>
  );
}


// ── Cover Selection Card ──────────────────────────────────────
// Shows the current cover photo or a placeholder with "Tap a photo to set as cover"

function CoverSelectionCard({
  coverPhoto,
  accentColor: _accentColor,
  settingCover,
  onRemove,
}: {
  coverPhoto: EventPhoto | null;
  accentColor: string;
  settingCover: boolean;
  onRemove?: () => void;
}) {
  if (coverPhoto) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '220px',
        margin: '0 auto',
      }}>
        <div style={{
          aspectRatio: '1',
          borderRadius: Spacing.radiusMd,
          overflow: 'hidden',
          background: BrandColors.bg3,
        }}>
          <img
            src={coverPhoto.url}
            alt="Cover photo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          {/* Remove cover button — matches Flutter: 28×28 80% black circle with white close */}
          {onRemove && (
            <button
              onClick={onRemove}
              disabled={settingCover}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: settingCover ? 'wait' : 'pointer',
                padding: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: BrandColors.text2,
          marginTop: Spacing.xs,
        }}>
          Cover Photo
        </p>
      </div>
    );
  }

  // Placeholder — matches Flutter CoverSelectionCard placeholder
  return (
    <div style={{
      width: '100%',
      maxWidth: '220px',
      margin: '0 auto',
    }}>
      <div style={{
        aspectRatio: '1',
        borderRadius: Spacing.radiusMd,
        border: `1px solid ${BrandColors.border}`,
        background: BrandColors.bg2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
      }}>
        {/* Star outline icon — matching Flutter Icons.star_outline */}
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <p style={{
          fontSize: '14px',
          fontWeight: 500,
          color: BrandColors.text2,
          textAlign: 'center',
          padding: `0 ${Spacing.md}`,
        }}>
          Tap to select a cover
        </p>
      </div>
      <p style={{
        textAlign: 'center',
        fontSize: '12px',
        color: BrandColors.text2,
        marginTop: Spacing.xs,
      }}>
        Cover Photo
      </p>
    </div>
  );
}


// ── Photo Lightbox ─────────────────────────────────────────────
// Minimal horizontal swipe lightbox

function PhotoLightbox({
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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      flexDirection: 'column',
      touchAction: 'none',
    }}>
      {/* Close */}
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

      {/* Nav: Previous */}
      {currentIdx > 0 && (
        <button
          onClick={() => goTo(currentIdx - 1)}
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
      {/* Nav: Next */}
      {currentIdx < photos.length - 1 && (
        <button
          onClick={() => goTo(currentIdx + 1)}
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
        {currentIdx + 1} / {photos.length}
      </div>

      {/* Hide scrollbar */}
      <style>{`
        div[style*="scroll-snap-type"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}


// ── Cover Selector Bottom Sheet ────────────────────────────────
// Matches Flutter _showPhotoSelector: modal with 3-col grid to pick cover

function CoverSelectorSheet({
  photos,
  currentCoverId,
  onSelect,
  onClose,
  settingCover,
}: {
  photos: EventPhoto[];
  currentCoverId: string | null;
  onSelect: (photoId: string) => void;
  onClose: () => void;
  settingCover: boolean;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '70vh',
          background: BrandColors.bg2,
          borderRadius: `${Spacing.radiusMd} ${Spacing.radiusMd} 0 0`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: `${Spacing.sm} 0`,
        }}>
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: '2px',
            background: BrandColors.text2,
            opacity: 0.4,
          }} />
        </div>

        {/* Title */}
        <p style={{
          ...Typography.titleMediumEmph,
          color: BrandColors.text1,
          textAlign: 'center',
          margin: 0,
          marginBottom: Spacing.md,
        }}>
          Select a cover
        </p>

        {/* Photo Grid */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: `0 ${Spacing.md}`,
          paddingBottom: `max(env(safe-area-inset-bottom), ${Spacing.md})`,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: `${GAP}px`,
          }}>
            {photos.map((photo) => {
              const isSelected = photo.photo_id === currentCoverId;
              return (
                <div
                  key={photo.photo_id}
                  onClick={() => !settingCover && onSelect(photo.photo_id)}
                  style={{
                    aspectRatio: '4/5',
                    borderRadius: Spacing.radiusSm,
                    overflow: 'hidden',
                    cursor: settingCover ? 'wait' : 'pointer',
                    position: 'relative',
                    background: BrandColors.bg3,
                    border: isSelected ? `2px solid ${BrandColors.text1}` : '2px solid transparent',
                    boxSizing: 'border-box',
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
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: BrandColors.text1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BrandColors.bg1} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
