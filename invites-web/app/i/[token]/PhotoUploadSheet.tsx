'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import { createBrowserSupabase } from '../../../lib/supabase';
import { compressImage, ensureEventParticipant } from '../../../lib/photoUtils';
import type { EventPhoto } from '../../../lib/supabase';
import { saveSession, getValidSession } from './SessionManager';
import {
  trackPhotoUploadStarted,
  trackPhotoUploaded,
  trackPhotoUploadFailed,
} from '../../../lib/analytics';

// ═══════════════════════════════════════════════════════════════════
// PhotoUploadSheet — Camera / gallery upload (no email OTP)
//
// Identity is established on the invite page via EventAuthGate (email + RPC).
// This sheet reads `lazzo_event_auth_${token}` / session storage and opens
// the picker — it does not run a second OTP flow.
// ═══════════════════════════════════════════════════════════════════

const EVENT_AUTH_PREFIX = 'lazzo_event_auth_';
const EVENT_AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local.replace(/[._-]/g, ' ').trim() || 'Guest';
}

interface PhotoUploadSheetProps {
  token: string;
  eventId: string;
  accentColor: string;
  eventStatus: 'living' | 'recap';
  onPhotoUploaded: (photo: EventPhoto) => void;
  /** Fires once when at least one file in the batch uploaded successfully (before success screen). */
  onUploadSuccess?: () => void;
  onClose: () => void;
}

type Phase = 'checking' | 'picker' | 'uploading' | 'success' | 'error';

export default function PhotoUploadSheet({
  token,
  eventId,
  accentColor,
  eventStatus,
  onPhotoUploaded,
  onUploadSuccess,
  onClose,
}: PhotoUploadSheetProps) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadCurrent, setUploadCurrent] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const finish = () => {
      if (mountedRef.current) setPhase('picker');
    };

    const safety = window.setTimeout(finish, 2500);

    const run = async () => {
      try {
        const saved = getValidSession(token);
        if (saved) {
          setName(saved.name);
          setEmail(saved.email);
          return;
        }

        try {
          const raw = localStorage.getItem(`${EVENT_AUTH_PREFIX}${token}`);
          if (raw) {
            const ev = JSON.parse(raw) as { email: string; authenticatedAt: number };
            if (ev.email && Date.now() - ev.authenticatedAt < EVENT_AUTH_TTL_MS) {
              setEmail(ev.email);
              setName(nameFromEmail(ev.email));
              saveSession(token, ev.email, nameFromEmail(ev.email));
              return;
            }
          }
        } catch { /* ignore */ }

        const supabase = createBrowserSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userEmail = session.user.email || '';
          const displayName =
            (session.user.user_metadata?.name as string | undefined)?.trim()
            || nameFromEmail(userEmail);
          setEmail(userEmail);
          setName(displayName);
          saveSession(token, userEmail, displayName);
          void ensureEventParticipant(supabase, token);
          return;
        }

        setError('Verify your email on the invite page first, then try again.');
      } catch {
        setError('Could not load your session. Try closing and reopening.');
      } finally {
        clearTimeout(safety);
        finish();
      }
    };

    void run();

    return () => {
      clearTimeout(safety);
    };
  }, [token]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError('Please select image files');
      return;
    }

    if (!email.trim()) {
      setError('Missing email for upload. Go back to the invite and verify your email.');
      setPhase('error');
      return;
    }

    setPhase('uploading');
    setError(null);
    setUploadCurrent(0);
    setUploadTotal(imageFiles.length);

    trackPhotoUploadStarted(eventId, imageFiles.length > 1 ? 'gallery' : 'gallery', imageFiles.length);

    try {
      const supabase = createBrowserSupabase();

      let accessToken: string | null = null;
      try {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        const session = refreshed ?? (await supabase.auth.getSession()).data.session;
        accessToken = session?.access_token ?? null;
      } catch {
        /* server may use email fallback */
      }

      const uploadedPhotos: EventPhoto[] = [];
      const errors: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        if (!mountedRef.current) return;

        setUploadCurrent(i + 1);
        setUploadProgress(
          imageFiles.length === 1
            ? 'Compressing...'
            : `Compressing ${i + 1}/${imageFiles.length}...`,
        );

        const compressed = await compressImage(imageFiles[i]);
        if (!mountedRef.current) return;

        setUploadProgress(
          imageFiles.length === 1
            ? 'Uploading...'
            : `Uploading ${i + 1}/${imageFiles.length}...`,
        );

        const uploadStartTime = Date.now();

        const body = new FormData();
        body.append('file', compressed.blob, `photo.${compressed.blob.type === 'image/webp' ? 'webp' : 'jpg'}`);
        body.append('token', token);
        body.append('isPortrait', String(compressed.isPortrait));
        if (email) body.append('email', email);
        if (name) body.append('userName', name);

        const headers: Record<string, string> = {};
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

        const res = await fetch('/api/upload-photo', {
          method: 'POST',
          headers,
          body,
        });

        if (!mountedRef.current) return;

        const result = await res.json();

        if (res.ok && result.success) {
          const newPhoto: EventPhoto = {
            photo_id: result.photoId || crypto.randomUUID(),
            url: result.signedUrl,
            storage_path: result.storagePath,
            is_portrait: result.isPortrait,
            captured_at: new Date().toISOString(),
          };
          uploadedPhotos.push(newPhoto);
          onPhotoUploaded(newPhoto);

          const uploadDuration = Date.now() - uploadStartTime;
          trackPhotoUploaded(eventId, uploadDuration, Math.round(imageFiles[i].size / 1024));
        } else {
          errors.push(result.error || `File ${i + 1} failed`);
          trackPhotoUploadFailed(eventId, result.error || 'unknown', 0);
        }
      }

      if (!mountedRef.current) return;

      if (uploadedPhotos.length > 0) {
        onUploadSuccess?.();
        setPhase('success');
        setTimeout(() => {
          if (mountedRef.current) onClose();
        }, 1500);

        if (errors.length > 0) {
          setUploadProgress(`${uploadedPhotos.length} uploaded, ${errors.length} failed`);
        }
      } else {
        setError(errors[0] || 'Upload failed');
        setPhase('error');
      }
    } catch (e: unknown) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Upload failed');
        setPhase('error');
      }
    }
  }, [token, email, name, onPhotoUploaded, onUploadSuccess, onClose, eventId]);

  const openFilePicker = useCallback((capture: boolean) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.source = capture ? 'camera' : 'gallery';
      if (capture) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.removeAttribute('multiple');
      } else {
        fileInputRef.current.removeAttribute('capture');
        fileInputRef.current.setAttribute('multiple', '');
      }
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 960,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          background: BrandColors.bg2,
          borderRadius: `${Spacing.radiusMd} ${Spacing.radiusMd} 0 0`,
          padding: Spacing.lg,
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        <div style={{
          width: '40px',
          height: '4px',
          background: BrandColors.bg3,
          borderRadius: '2px',
          margin: '0 auto',
          marginBottom: Spacing.lg,
        }} />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {phase === 'checking' && (
          <div style={{ textAlign: 'center', padding: Spacing.lg }}>
            <div className="spinner" style={{ margin: '0 auto 12px', borderTopColor: accentColor }} />
            <p style={{ color: BrandColors.text2, fontSize: '14px' }}>Preparing…</p>
          </div>
        )}

        {phase === 'picker' && (
          <>
            <h3 style={{
              ...Typography.titleMediumEmph,
              color: BrandColors.text1,
              marginBottom: Spacing.xs,
            }}>
              {eventStatus === 'living' ? ' Add a Photo' : ' Upload Photos'}
            </h3>
            <p style={{
              ...Typography.bodyMedium,
              color: BrandColors.text2,
              marginBottom: Spacing.lg,
            }}>
              {eventStatus === 'living'
                ? 'Capture a moment from the event'
                : 'Share your photos from the event'}
            </p>

            {error && (
              <p style={{
                fontSize: '13px',
                color: BrandColors.cantVote,
                marginBottom: Spacing.md,
                textAlign: 'center',
              }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
              <button
                type="button"
                onClick={() => openFilePicker(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: Spacing.md,
                  padding: Spacing.md,
                  background: accentColor,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: Spacing.radiusSmAlt,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Take Photo
              </button>

              <button
                type="button"
                onClick={() => openFilePicker(false)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: Spacing.md,
                  padding: Spacing.md,
                  background: BrandColors.bg3,
                  color: BrandColors.text1,
                  border: 'none',
                  borderRadius: Spacing.radiusSmAlt,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Choose from Gallery
              </button>
            </div>
          </>
        )}

        {phase === 'uploading' && (
          <div style={{ textAlign: 'center', padding: Spacing.lg }}>
            <div className="spinner" style={{ margin: '0 auto 16px', borderTopColor: accentColor }} />
            <p style={{
              ...Typography.titleMediumEmph,
              color: BrandColors.text1,
              marginBottom: Spacing.xs,
            }}>
              {uploadProgress}
            </p>
            {uploadTotal > 1 && (
              <p style={{
                ...Typography.bodyMedium,
                color: BrandColors.text2,
                marginBottom: Spacing.xs,
              }}>
                {uploadCurrent} of {uploadTotal} photos
              </p>
            )}
            <p style={{
              ...Typography.bodyMedium,
              color: BrandColors.text2,
            }}>
              Please wait...
            </p>
          </div>
        )}

        {phase === 'success' && (
          <div style={{ textAlign: 'center', padding: Spacing.lg }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{
              ...Typography.titleMediumEmph,
              color: BrandColors.text1,
            }}>
              {uploadTotal > 1
                ? `${uploadTotal} photos uploaded!`
                : 'Photo uploaded!'}
            </p>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', padding: Spacing.lg }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: BrandColors.bg3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px',
            }}>
              ⚠️
            </div>
            <p style={{
              ...Typography.titleMediumEmph,
              color: BrandColors.text1,
              marginBottom: Spacing.xs,
            }}>
              Upload failed
            </p>
            <p style={{
              ...Typography.bodyMedium,
              color: BrandColors.text2,
              marginBottom: Spacing.lg,
            }}>
              {error || 'Something went wrong. Please try again.'}
            </p>
            <button
              type="button"
              onClick={() => { setError(null); setPhase('picker'); }}
              style={{
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
              Try Again
            </button>
          </div>
        )}

        {!['uploading', 'success'].includes(phase) && (
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: Spacing.md,
              padding: Spacing.sm,
              background: 'transparent',
              color: BrandColors.text2,
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
