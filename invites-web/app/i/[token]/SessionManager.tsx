'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BrandColors, Spacing } from '../../design/constants';
import { createBrowserSupabase } from '../../../lib/supabase';
import OtpInput from './OtpInput';

// ═══════════════════════════════════════════════════════════════════
// SessionManager — Handles session persistence for returning visitors
//
// Flow:
// 1. On first visit → user completes OTP auth during RSVP → session saved
// 2. On return visit within SESSION_TTL → auto-restore session
// 3. On return visit after SESSION_TTL → show re-auth popup
// ═══════════════════════════════════════════════════════════════════

const SESSION_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const STORAGE_KEY_PREFIX = 'lazzo_session_';

interface SessionInfo {
  email: string;
  name: string;
  authenticatedAt: number; // timestamp ms
}

/**
 * Saves session info after successful OTP authentication.
 * Called from RsvpSection after verifyOtp succeeds.
 */
export function saveSession(token: string, email: string, name: string): void {
  try {
    const info: SessionInfo = {
      email,
      name,
      authenticatedAt: Date.now(),
    };
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${token}`,
      JSON.stringify(info)
    );
  } catch {
    // localStorage unavailable — silent
  }
}

/**
 * Checks if a valid (non-expired) session exists for this token.
 */
export function getValidSession(token: string): SessionInfo | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${token}`);
    if (!raw) return null;

    const info: SessionInfo = JSON.parse(raw);
    const age = Date.now() - info.authenticatedAt;

    if (age > SESSION_TTL_MS) return null; // expired
    return info;
  } catch {
    return null;
  }
}

/**
 * Clears stored session for a token.
 */
export function clearSession(token: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${token}`);
  } catch {
    // silent
  }
}

// ── Re-auth Popup Component ──────────────────────────────────────

interface ReAuthPopupProps {
  token: string;
  expiredEmail: string;
  onAuthenticated: (email: string, name: string) => void;
  onDismiss: () => void;
}

export function ReAuthPopup({ token, expiredEmail, onAuthenticated, onDismiss }: ReAuthPopupProps) {
  const [phase, setPhase] = useState<'prompt' | 'otp'>('prompt');
  const [email, setEmail] = useState(expiredEmail);
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleSendOtp = useCallback(async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabase();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      if (mountedRef.current) setPhase('otp');
    } catch (e: unknown) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'Failed to send code');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [email]);

  const handleVerify = useCallback(async () => {
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

      // Save new session
      const displayName = name.trim() || email.split('@')[0];
      saveSession(token, email.trim(), displayName);
      onAuthenticated(email.trim(), displayName);
    } catch (e: unknown) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'Invalid code');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [otpCode, email, name, token, onAuthenticated]);

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '400px',
          width: '100%',
          background: BrandColors.bg2,
          borderRadius: Spacing.radiusMd,
          padding: Spacing.lg,
          border: `1px solid ${BrandColors.border}`,
        }}
      >
        <h2 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: BrandColors.text1,
          marginBottom: Spacing.xs,
        }}>
          Welcome back! 👋
        </h2>
        <p style={{
          fontSize: '14px',
          color: BrandColors.text2,
          marginBottom: Spacing.lg,
        }}>
          Your session has expired. Please verify your identity to continue.
        </p>

        {phase === 'prompt' && (
          <>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              disabled={loading || !email.trim()}
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: Spacing.md,
                justifyContent: 'center',
                opacity: loading || !email.trim() ? 0.5 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send verification code'}
            </button>
          </>
        )}

        {phase === 'otp' && (
          <>
            <p style={{
              fontSize: '14px',
              color: BrandColors.text2,
              marginBottom: '4px',
            }}>
              Enter the 6-digit code sent to
            </p>
            <p style={{
              fontSize: '14px',
              color: BrandColors.text1,
              fontWeight: 500,
              marginBottom: Spacing.md,
            }}>
              {email}
            </p>

            <OtpInput
              length={6}
              onChange={setOtpCode}
              disabled={loading}
            />

            <button
              onClick={handleVerify}
              disabled={loading || otpCode.length < 6}
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: Spacing.md,
                justifyContent: 'center',
                opacity: loading || otpCode.length < 6 ? 0.5 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </>
        )}

        {error && (
          <p style={{
            fontSize: '13px',
            color: BrandColors.cantVote,
            marginTop: Spacing.sm,
            textAlign: 'center',
          }}>
            {error}
          </p>
        )}

        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            marginTop: Spacing.sm,
            padding: `${Spacing.sm} ${Spacing.md}`,
            background: 'transparent',
            color: BrandColors.text2,
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
