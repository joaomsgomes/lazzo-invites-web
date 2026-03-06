'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import PhotoGrid from './PhotoGrid';
import PhotoUploadSheet from './PhotoUploadSheet';
import ManagePhotosSheet from './ManagePhotosSheet';
import MemorySheet from './MemorySheet';
import type { EventData, EventPhoto } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// RecapSection — Matches Flutter's MemoryPage for recap state
//
// Layout: RecapTimer → Upload Button → Photos Grid
//
// Colors: Orange (#FF751A) accent throughout
// Recap window: 24h after event.end_datetime
// ═══════════════════════════════════════════════════════════════════

interface RecapSectionProps {
  event: EventData;
  token: string;
  photos: EventPhoto[];
  coverPhotoId: string | null;
  onCoverChanged: (photoId: string | null) => void;
  onPhotoUploaded: (photo: EventPhoto) => void;
  onSharePress: () => void;
}

export default function RecapSection({ event, token, photos, coverPhotoId, onCoverChanged, onPhotoUploaded, onSharePress }: RecapSectionProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showManagePhotos, setShowManagePhotos] = useState(false);
  const [showMemory, setShowMemory] = useState(false);

  // Calculate recap close time (end_datetime + 24h)
  const recapCloseTime = event.end_datetime
    ? new Date(new Date(event.end_datetime).getTime() + 24 * 60 * 60 * 1000)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.md }}>

      {/* ── Recap Timer Pill ── */}
      {recapCloseTime && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RecapTimerPill closeTime={recapCloseTime} />
        </div>
      )}

      {/* ── Action Row ── */}
      <RecapActionRow
        onSharePress={onSharePress}
        onUploadPress={() => setShowUpload(true)}
        onMemoryPress={() => setShowMemory(true)}
      />

      {/* ── Memories Card (matching Flutter MemoryPage) ── */}
      <div style={{
        width: '100%',
        padding: Spacing.md,
        background: BrandColors.bg2,
        borderRadius: Spacing.radiusMd,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: Spacing.md,
        }}>
          <div>
            <p style={{ ...Typography.labelLarge, color: BrandColors.text1 }}>
              Photos
            </p>
            {photos.length > 0 && (
              <p style={{
                fontSize: '12px',
                color: BrandColors.text2,
                marginTop: '2px',
              }}>
                {photos.length} photo{photos.length !== 1 ? 's' : ''} from this event
              </p>
            )}
          </div>
          {photos.length > 0 && (
            <div
              onClick={() => setShowManagePhotos(true)}
              style={{ cursor: 'pointer', padding: 4 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          )}
        </div>

        {/* Photo Grid + Add Photo */}
        <PhotoGrid
          photos={photos}
          accentColor={BrandColors.recap}
          onAddPhoto={() => setShowUpload(true)}
          showAddCard={true}
          showAllPhotos={showAllPhotos}
          onShowAllPhotosChange={setShowAllPhotos}
        />
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


      {/* ── Manage Photos Sheet ── */}
      {showManagePhotos && (
        <ManagePhotosSheet
          photos={photos}
          token={token}
          coverPhotoId={coverPhotoId}
          accentColor={BrandColors.recap}
          onCoverChanged={onCoverChanged}
          onAddPhoto={() => {
            setShowManagePhotos(false);
            setShowUpload(true);
          }}
          onClose={() => setShowManagePhotos(false)}
        />
      )}

      {/* ── Memory Sheet (full memory page like in the app) ── */}
      {showMemory && (
        <MemorySheet
          event={event}
          photos={photos}
          token={token}
          coverPhotoId={coverPhotoId}
          onPhotoUploaded={onPhotoUploaded}
          onSharePress={onSharePress}
          onClose={() => setShowMemory(false)}
        />
      )}

    </div>
  );
}


// ── Recap Timer Pill ────────────────────────────────────────────
// Orange pill showing "Closes in Xh Ym" with countdown

function RecapTimerPill({ closeTime }: { closeTime: Date }) {
  const [timeText, setTimeText] = useState('');
  const [isClosingSoon, setIsClosingSoon] = useState(false);

  const calcTime = useCallback(() => {
    const now = new Date();
    const diff = closeTime.getTime() - now.getTime();

    if (diff <= 0) return { text: 'Uploads closed', closingSoon: true };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const closingSoon = hours === 0 && minutes < 30;

    if (hours > 0) {
      return {
        text: minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`,
        closingSoon,
      };
    }
    if (minutes > 0) {
      return { text: `${minutes}m`, closingSoon };
    }
    return { text: 'Closing soon', closingSoon: true };
  }, [closeTime]);

  useEffect(() => {
    const update = () => {
      const result = calcTime();
      setTimeText(result.text);
      setIsClosingSoon(result.closingSoon);
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [calcTime]);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 16px',
      borderRadius: Spacing.radiusPill,
      background: isClosingSoon ? BrandColors.cantVote : BrandColors.recap,
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: `0 4px 12px ${isClosingSoon ? 'rgba(255,59,48,0.4)' : 'rgba(255,117,26,0.4)'}`,
      transition: 'background 0.3s, box-shadow 0.3s',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {timeText}
    </span>
  );
}



// ── Recap Action Row ────────────────────────────────────────────
// 1 button: Upload (full width, orange)

function RecapActionRow({
  onSharePress,
  onUploadPress,
  onMemoryPress,
}: {
  onSharePress: () => void;
  onUploadPress: () => void;
  onMemoryPress: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: Spacing.sm }}>
      {/* Share */}
      <button
        onClick={onSharePress}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: Spacing.xxs,
          padding: Spacing.md,
          background: BrandColors.bg2,
          borderRadius: Spacing.radiusMd,
          border: 'none',
          cursor: 'pointer',
          color: BrandColors.text1,
          transition: 'transform 0.15s',
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <span style={{ ...Typography.labelLarge, color: BrandColors.text1 }}>Share</span>
      </button>

      {/* Upload Photos (center) */}
      <button
        onClick={onUploadPress}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: Spacing.xxs,
          padding: Spacing.md,
          background: BrandColors.recap,
          borderRadius: Spacing.radiusMd,
          border: 'none',
          cursor: 'pointer',
          color: '#FFFFFF',
          transition: 'transform 0.15s',
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <span style={{ ...Typography.labelLarge, color: '#FFFFFF' }}>Upload</span>
      </button>

      {/* Memory */}
      <button
        onClick={onMemoryPress}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: Spacing.xxs,
          padding: Spacing.md,
          background: BrandColors.bg2,
          borderRadius: Spacing.radiusMd,
          border: 'none',
          cursor: 'pointer',
          color: BrandColors.text1,
          transition: 'transform 0.15s',
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span style={{ ...Typography.labelLarge, color: BrandColors.text1 }}>Memory</span>
      </button>
    </div>
  );
}
