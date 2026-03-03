'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import PhotoGrid from './PhotoGrid';
import PhotoUploadSheet from './PhotoUploadSheet';
import ManagePhotosSheet from './ManagePhotosSheet';
import type { EventData, EventPhoto } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// LivingSection — Matches Flutter's EventLivingPage layout exactly
//
// Layout: TimeLeftPill → ActionRow (Photo | Guests) → PhotosCard
//
// Colors: Purple (#8A38F5) accent throughout
// ═══════════════════════════════════════════════════════════════════

interface LivingSectionProps {
  event: EventData;
  token: string;
  photos: EventPhoto[];
  coverPhotoId: string | null;
  onCoverChanged: (photoId: string | null) => void;
  onPhotoUploaded: (photo: EventPhoto) => void;
  onGuestsPress: () => void;
  onSharePress: () => void;
}

export default function LivingSection({ event, token, photos, coverPhotoId, onCoverChanged, onPhotoUploaded, onGuestsPress, onSharePress }: LivingSectionProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showManagePhotos, setShowManagePhotos] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.md }}>

      {/* ── Time Left Pill ── */}
      {event.end_datetime && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <TimeLeftPill endDatetime={event.end_datetime} />
        </div>
      )}

      {/* ── Action Row (matching Flutter LivingActionRow) ── */}
      <LivingActionRow
        onSharePress={onSharePress}
        onPhotoPress={() => setShowUpload(true)}
        onGuestsPress={onGuestsPress}
      />

      {/* ── Photos Card (matching Flutter LivingPhotosWidget) ── */}
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
                {photos.length} photo{photos.length !== 1 ? 's' : ''} added
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

        {/* Grid + Add Photo */}
        <PhotoGrid
          photos={photos}
          accentColor={BrandColors.living}
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
          accentColor={BrandColors.living}
          eventStatus="living"
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
          accentColor={BrandColors.living}
          onCoverChanged={onCoverChanged}
          onAddPhoto={() => {
            setShowManagePhotos(false);
            setShowUpload(true);
          }}
          onClose={() => setShowManagePhotos(false)}
        />
      )}

    </div>
  );
}


// ── Time Left Pill ─────────────────────────────────────────────
// Matches Flutter's LivingTimeLeftPill: purple pill, clock icon, countdown

function TimeLeftPill({ endDatetime }: { endDatetime: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  const calcTimeLeft = useCallback(() => {
    const now = new Date();
    const end = new Date(endDatetime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ending soon';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
    }
    if (minutes > 0) return `${minutes}m left`;
    return 'Ending soon';
  }, [endDatetime]);

  useEffect(() => {
    setTimeLeft(calcTimeLeft());
    const interval = setInterval(() => setTimeLeft(calcTimeLeft()), 60_000);
    return () => clearInterval(interval);
  }, [calcTimeLeft]);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 16px',
      borderRadius: Spacing.radiusPill,
      background: BrandColors.living,
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: '0 4px 12px rgba(138, 56, 245, 0.4)',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {timeLeft}
    </span>
  );
}


// ── Action Row (matching Flutter LivingActionRow) ────────────────
// 2 equal-width buttons: Photo (purple) | Guests (bg2)

function LivingActionRow({
  onSharePress,
  onPhotoPress,
  onGuestsPress,
}: {
  onSharePress: () => void;
  onPhotoPress: () => void;
  onGuestsPress: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: Spacing.sm }}>
      {/* Share */}
      <ActionButton
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        }
        label="Share"
        backgroundColor={BrandColors.bg2}
        textColor={BrandColors.text1}
        onClick={onSharePress}
      />

      {/* Photo — opens camera/gallery upload sheet */}
      <ActionButton
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        }
        label="Photo"
        backgroundColor={BrandColors.living}
        textColor="#FFFFFF"
        onClick={onPhotoPress}
      />

      {/* Guests */}
      <ActionButton
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
        label="Guests"
        backgroundColor={BrandColors.bg2}
        textColor={BrandColors.text1}
        onClick={onGuestsPress}
      />
    </div>
  );
}

// ── Action Button ──────────────────────────────────────────────
// Matches Flutter's vertical icon+label buttons

function ActionButton({
  icon,
  label,
  backgroundColor,
  textColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  backgroundColor: string;
  textColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: Spacing.xxs,
        padding: Spacing.md,
        background: backgroundColor,
        borderRadius: Spacing.radiusMd,
        border: 'none',
        cursor: 'pointer',
        color: textColor,
        transition: 'transform 0.15s',
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      {icon}
      <span style={{
        ...Typography.labelLarge,
        color: textColor,
      }}>
        {label}
      </span>
    </button>
  );
}
