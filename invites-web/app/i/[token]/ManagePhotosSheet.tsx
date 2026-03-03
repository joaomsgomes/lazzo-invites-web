'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import type { EventPhoto } from '../../../lib/supabase';

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

      {/* ── Scrollable content ── */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: `0 ${Spacing.md}`,
        paddingBottom: Spacing.lg,
      }}>

        {/* ── Cover Selection Card (matching Flutter CoverSelectionCard) ── */}
        {photos.length > 0 && (
          <div style={{ marginBottom: Spacing.lg }}>
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
            <div style={{ fontSize: '32px', marginBottom: Spacing.sm }}>📷</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: BrandColors.text1, marginBottom: Spacing.xxs }}>
              No photos yet
            </p>
            <p style={{ fontSize: '14px', color: BrandColors.text2 }}>
              Upload some photos to get started
            </p>
            {onAddPhoto && (
              <button
                onClick={onAddPhoto}
                style={{
                  marginTop: Spacing.md,
                  padding: `${Spacing.sm} ${Spacing.lg}`,
                  background: accentColor,
                  color: '#FFFFFF',
                  border: 'none',
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
            {photos.map((photo) => {
              const isCover = photo.photo_id === localCoverId;
              return (
                <div
                  key={photo.photo_id}
                  onClick={() => handleSetCover(photo.photo_id)}
                  style={{
                    aspectRatio: '4/5',
                    borderRadius: Spacing.radiusSm,
                    overflow: 'hidden',
                    cursor: settingCover ? 'wait' : 'pointer',
                    position: 'relative',
                    background: BrandColors.bg3,
                    border: isCover ? `2px solid ${accentColor}` : '2px solid transparent',
                    transition: 'border-color 0.2s',
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
                  {/* Cover badge */}
                  {isCover && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: accentColor,
                      borderRadius: Spacing.radiusPill,
                      padding: '2px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#FFFFFF' }}>
                        Cover
                      </span>
                    </div>
                  )}
                  {/* Tap indicator when not the cover */}
                  {!isCover && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Photo card */}
            {onAddPhoto && (
              <button
                onClick={onAddPhoto}
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
            )}
          </div>
        )}
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
    </div>
  );
}


// ── Cover Selection Card ──────────────────────────────────────
// Shows the current cover photo or a placeholder with "Tap a photo to set as cover"

function CoverSelectionCard({
  coverPhoto,
  accentColor,
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
          border: `2px solid ${accentColor}`,
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
        </div>
        {/* Remove cover button */}
        {onRemove && (
          <button
            onClick={onRemove}
            disabled={settingCover}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: BrandColors.cantVote,
              border: '2px solid ' + BrandColors.bg1,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: settingCover ? 'wait' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            ✕
          </button>
        )}
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

  // Placeholder
  return (
    <div style={{
      width: '100%',
      maxWidth: '220px',
      margin: '0 auto',
    }}>
      <div style={{
        aspectRatio: '1',
        borderRadius: Spacing.radiusMd,
        border: `2px dashed ${BrandColors.border}`,
        background: BrandColors.bg2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p style={{
          fontSize: '13px',
          color: BrandColors.text2,
          textAlign: 'center',
          padding: `0 ${Spacing.md}`,
        }}>
          Tap a photo below to set as cover
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
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
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

      {/* Photo */}
      <img
        src={photos[currentIdx].url}
        alt=""
        style={{
          maxWidth: '90%',
          maxHeight: '80%',
          objectFit: 'contain',
          borderRadius: Spacing.radiusSm,
        }}
      />

      {/* Nav buttons */}
      {currentIdx > 0 && (
        <button
          onClick={() => onIndexChange(currentIdx - 1)}
          style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            width: '40px', height: '40px', borderRadius: '50%', fontSize: '20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ‹
        </button>
      )}
      {currentIdx < photos.length - 1 && (
        <button
          onClick={() => onIndexChange(currentIdx + 1)}
          style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            width: '40px', height: '40px', borderRadius: '50%', fontSize: '20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ›
        </button>
      )}

      {/* Counter */}
      <div style={{
        position: 'absolute',
        bottom: 'max(env(safe-area-inset-bottom), 20px)',
        textAlign: 'center',
        fontSize: '14px',
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 500,
      }}>
        {currentIdx + 1} / {photos.length}
      </div>
    </div>
  );
}
