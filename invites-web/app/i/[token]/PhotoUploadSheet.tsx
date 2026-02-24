'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import { createBrowserSupabase } from '../../../lib/supabase';
import { compressImage, ensureEventParticipant } from '../../../lib/photoUtils';
import type { EventPhoto } from '../../../lib/supabase';
import OtpInput from './OtpInput';
import { saveSession, getValidSession } from './SessionManager';

// ═══════════════════════════════════════════════════════════════════
// PhotoUploadSheet — Bottom sheet modal for photo capture + upload
//
// Flow:
// 1. Check auth → if no session, show name+email+OTP auth
// 2. After auth → accept invite → become event participant
// 3. Show camera/gallery file picker
// 4. Compress image → upload to Supabase
// 5. Report success → parent adds photo to grid
// ═══════════════════════════════════════════════════════════════════

interface PhotoUploadSheetProps {
  token: string;
  accentColor: string;
  eventStatus: 'living' | 'recap';
  onPhotoUploaded: (photo: EventPhoto) => void;
  onClose: () => void;
}

type Phase = 'checking' | 'auth-name' | 'auth-otp' | 'picker' | 'uploading' | 'success' | 'error';

export default function PhotoUploadSheet({
  token,
  accentColor,
  eventStatus,
  onPhotoUploaded,
  onClose,
}: PhotoUploadSheetProps) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const [eventId, setEventId] = useState<string | null>(null);
  const [uploadCurrent, setUploadCurrent] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // ── Check auth on mount ──
  // If localStorage session is valid (within 48h), skip OTP entirely.
  // The server-side API can resolve the user by email as fallback.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Check localStorage session first — if valid, skip OTP
        const saved = getValidSession(token);
        if (saved) {
          setName(saved.name);
          setEmail(saved.email);

          // Try to also get the Supabase session (best effort)
          const supabase = createBrowserSupabase();
          const sess = (await supabase.auth.getSession()).data.session;
          if (sess) {
            const { data: { session: refreshed } } = await supabase.auth.refreshSession();
            // Use refreshed or original — either is fine
            void refreshed;
          }

          // Go straight to picker — server API will use email fallback if JWT is dead
          setPhase('picker');
          return;
        }

        // 2. No localStorage session — check Supabase auth session
        const supabase = createBrowserSupabase();
        let session = (await supabase.auth.getSession()).data.session;

        if (session) {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession();
          if (refreshed) session = refreshed;
        }

        if (session?.user) {
          // Authenticated via Supabase — ensure participant
          setUploadProgress('Preparing...');
          const result = await ensureEventParticipant(supabase, token);
          if (result) {
            setEventId(result.eventId);
            // Save session so next time we skip OTP
            const userEmail = session.user.email || '';
            saveSession(token, userEmail, session.user.user_metadata?.name || userEmail.split('@')[0]);
            setEmail(userEmail);
            setPhase('picker');
            return;
          }
        }

        // 3. No valid session at all — need OTP
        setPhase('auth-name');
      } catch {
        setPhase('auth-name');
      }
    };

    checkAuth();
  }, [token]);

  // ── Auth: Send OTP ──
  const handleSendOtp = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setError('Please enter your name and email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabase();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      if (mountedRef.current) setPhase('auth-otp');
    } catch (e: unknown) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Failed to send code');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [name, email]);

  // ── Auth: Verify OTP ──
  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length < 6) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabase();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode,
        type: 'email',
      });
      if (verifyError) throw verifyError;

      // Save session
      const displayName = name.trim() || email.split('@')[0];
      saveSession(token, email.trim(), displayName);

      // Update user name (best effort)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase
          .from('users')
          .update({ name: name.trim() })
          .eq('id', session.user.id)
          .then(() => {});
      }

      // Ensure event participant
      setUploadProgress('Joining event...');
      const result = await ensureEventParticipant(supabase, token);
      if (result) {
        setEventId(result.eventId);
        if (mountedRef.current) setPhase('picker');
      } else {
        if (mountedRef.current) {
          setError('Could not join event. The invite may have expired.');
          setPhase('error');
        }
      }
    } catch (e: unknown) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Invalid code');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [otpCode, email, name, token]);

  // ── File selection (supports multiple files) ──
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Filter to images only
    const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError('Please select image files');
      return;
    }

    setPhase('uploading');
    setError(null);
    setUploadCurrent(0);
    setUploadTotal(imageFiles.length);

    try {
      const supabase = createBrowserSupabase();

      // Try to get a valid access token (best effort — API has email fallback)
      let accessToken: string | null = null;
      try {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        const session = refreshed ?? (await supabase.auth.getSession()).data.session;
        accessToken = session?.access_token ?? null;
      } catch {
        // No JWT available — server will use email fallback
      }

      const uploadedPhotos: EventPhoto[] = [];
      const errors: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        if (!mountedRef.current) return;

        setUploadCurrent(i + 1);
        setUploadProgress(
          imageFiles.length === 1
            ? 'Compressing...'
            : `Compressing ${i + 1}/${imageFiles.length}...`
        );

        // Compress
        const compressed = await compressImage(imageFiles[i]);
        if (!mountedRef.current) return;

        setUploadProgress(
          imageFiles.length === 1
            ? 'Uploading...'
            : `Uploading ${i + 1}/${imageFiles.length}...`
        );

        // Upload via server-side API
        const body = new FormData();
        body.append('file', compressed.blob, `photo.${compressed.blob.type === 'image/webp' ? 'webp' : 'jpg'}`);
        body.append('token', token);
        body.append('isPortrait', String(compressed.isPortrait));
        // Send email + name as fallback auth (when JWT is expired/unavailable)
        if (email) body.append('email', email);
        if (name) body.append('userName', name);

        const headers: Record<string, string> = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

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
        } else {
          errors.push(result.error || `File ${i + 1} failed`);
        }
      }

      if (!mountedRef.current) return;

      if (uploadedPhotos.length > 0) {
        setPhase('success');
        // Auto-close after 1.5s
        setTimeout(() => {
          if (mountedRef.current) onClose();
        }, 1500);

        // If partial failures, show in success message
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
  }, [token, email, name, onPhotoUploaded, onClose]);

  const openFilePicker = useCallback((capture: boolean) => {
    if (fileInputRef.current) {
      // On mobile, capture="environment" opens camera (single photo only)
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
        zIndex: 900,
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
        {/* Handle bar */}
        <div style={{
          width: '40px',
          height: '4px',
          background: BrandColors.bg3,
          borderRadius: '2px',
          margin: '0 auto',
          marginBottom: Spacing.lg,
        }} />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* ── CHECKING ── */}
        {phase === 'checking' && (
          <div style={{ textAlign: 'center', padding: Spacing.lg }}>
            <div className="spinner" style={{ margin: '0 auto 12px', borderTopColor: accentColor }} />
            <p style={{ color: BrandColors.text2, fontSize: '14px' }}>Checking session...</p>
          </div>
        )}

        {/* ── AUTH: NAME + EMAIL ── */}
        {phase === 'auth-name' && (
          <>
            <h3 style={{
              ...Typography.titleMediumEmph,
              color: BrandColors.text1,
              marginBottom: Spacing.xs,
            }}>
              {eventStatus === 'living' ? '📸 Add a Photo' : '🖼️ Upload Photos'}
            </h3>
            <p style={{
              ...Typography.bodyMedium,
              color: BrandColors.text2,
              marginBottom: Spacing.lg,
            }}>
              Verify your identity to upload photos
            </p>

            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              className="input-field"
              disabled={loading}
              autoComplete="name"
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className="input-field"
              style={{ marginTop: Spacing.sm }}
              disabled={loading}
              autoComplete="email"
            />

            <button
              onClick={handleSendOtp}
              disabled={loading || !name.trim() || !email.trim()}
              style={{
                width: '100%',
                marginTop: Spacing.md,
                padding: `${Spacing.md} ${Spacing.lg}`,
                background: accentColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: Spacing.radiusSmAlt,
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loading || !name.trim() || !email.trim() ? 0.5 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send verification code'}
            </button>
          </>
        )}

        {/* ── AUTH: OTP ── */}
        {phase === 'auth-otp' && (
          <>
            <h3 style={{
              ...Typography.titleMediumEmph,
              color: BrandColors.text1,
              marginBottom: Spacing.xs,
            }}>
              Enter code
            </h3>
            <p style={{
              ...Typography.bodyMedium,
              color: BrandColors.text2,
              marginBottom: Spacing.xs,
            }}>
              6-digit code sent to
            </p>
            <p style={{
              ...Typography.bodyMediumEmph,
              color: BrandColors.text1,
              marginBottom: Spacing.lg,
            }}>
              {email}
            </p>

            <OtpInput length={6} onChange={setOtpCode} disabled={loading} />

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.length < 6}
              style={{
                width: '100%',
                marginTop: Spacing.md,
                padding: `${Spacing.md} ${Spacing.lg}`,
                background: accentColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: Spacing.radiusSmAlt,
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loading || otpCode.length < 6 ? 0.5 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </>
        )}

        {/* ── PICKER: Camera & Gallery ── */}
        {phase === 'picker' && (
          <>
            <h3 style={{
              ...Typography.titleMediumEmph,
              color: BrandColors.text1,
              marginBottom: Spacing.xs,
            }}>
              {eventStatus === 'living' ? '📸 Add a Photo' : '🖼️ Upload Photos'}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
              {/* Take Photo (Camera) */}
              <button
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Take Photo
              </button>

              {/* Choose from Gallery */}
              <button
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Choose from Gallery
              </button>
            </div>
          </>
        )}

        {/* ── UPLOADING ── */}
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

        {/* ── SUCCESS ── */}
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

        {/* ── ERROR ── */}
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
              onClick={() => setPhase('picker')}
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

        {/* ── Error message (for auth phases) ── */}
        {error && (phase === 'auth-name' || phase === 'auth-otp') && (
          <p style={{
            fontSize: '13px',
            color: BrandColors.cantVote,
            marginTop: Spacing.sm,
            textAlign: 'center',
          }}>
            {error}
          </p>
        )}

        {/* ── Cancel button (for non-terminal phases) ── */}
        {!['uploading', 'success'].includes(phase) && (
          <button
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
