'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import { createBrowserSupabase } from '../../../lib/supabase';
import OtpInput from './OtpInput';

// ═══════════════════════════════════════════════════════════════════
// RecapAuthGate — OTP verification gate for recap event pages
//
// Flow:
// 1. Check localStorage for existing verified session
// 2. If no session → show overlay popup with email + OTP
// 3. After OTP verification → check if email is a participant
// 4. If participant → save session, grant access
// 5. If not participant → show error
// ═══════════════════════════════════════════════════════════════════

const RECAP_AUTH_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const STORAGE_KEY_PREFIX = 'lazzo_recap_auth_';

interface RecapAuthSession {
  email: string;
  authenticatedAt: number;
}

function getRecapAuthSession(token: string): RecapAuthSession | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${token}`);
    if (!raw) return null;
    const session: RecapAuthSession = JSON.parse(raw);
    if (Date.now() - session.authenticatedAt > RECAP_AUTH_TTL_MS) return null;
    return session;
  } catch {
    return null;
  }
}

function saveRecapAuthSession(token: string, email: string): void {
  try {
    const session: RecapAuthSession = { email, authenticatedAt: Date.now() };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${token}`, JSON.stringify(session));
  } catch { /* silent */ }
}

// ── Props ────────────────────────────────────────────────────────

interface RecapAuthGateProps {
  token: string;
  eventName: string;
  eventEmoji: string;
  children: React.ReactNode;
}

// ── Component ────────────────────────────────────────────────────

export default function RecapAuthGate({ token, eventName, eventEmoji, children }: RecapAuthGateProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // null = loading
  const [phase, setPhase] = useState<'email' | 'otp' | 'denied'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const session = getRecapAuthSession(token);
    if (session) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [token]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Send OTP ──

  const handleSendOtp = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
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

      if (otpError) {
        if (mountedRef.current) setError(otpError.message);
        return;
      }

      if (mountedRef.current) {
        setPhase('otp');
        setOtpCode('');
        setResendCooldown(60);
      }
    } catch (e: unknown) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'Failed to send code');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [email]);

  // ── Verify OTP + Check Participant ──

  const handleVerify = useCallback(async () => {
    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabase();

      // 1. Verify OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode,
        type: 'email',
      });

      if (verifyError) {
        if (mountedRef.current) setError(verifyError.message);
        return;
      }

      // 2. Check if email belongs to an event participant
      const { data: isParticipant, error: checkError } = await supabase
        .rpc('verify_event_access_by_email', {
          p_token: token,
          p_email: email.trim(),
        });

      if (checkError) {
        if (mountedRef.current) setError('Failed to verify access. Please try again.');
        return;
      }

      if (isParticipant) {
        // Access granted
        saveRecapAuthSession(token, email.trim());
        if (mountedRef.current) setIsAuthorized(true);
      } else {
        // Not a participant
        if (mountedRef.current) setPhase('denied');
      }
    } catch (e: unknown) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [otpCode, email, token]);

  // ── Reset to email phase ──

  const handleRetry = useCallback(() => {
    setPhase('email');
    setEmail('');
    setOtpCode('');
    setError(null);
  }, []);

  // Still loading
  if (isAuthorized === null) return null;

  // Authorized → show content
  if (isAuthorized) return <>{children}</>;

  // Not authorized → show overlay
  return (
    <>
      {/* Blurred background content */}
      <div style={{ filter: 'blur(12px)', pointerEvents: 'none', opacity: 0.4 }}>
        {children}
      </div>

      {/* Auth overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Spacing.md,
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            width: '100%',
            background: BrandColors.bg2,
            borderRadius: Spacing.radiusMd,
            padding: Spacing.lg,
            border: `1px solid ${BrandColors.border}`,
          }}
        >
          {/* ── Denied State ── */}
          {phase === 'denied' && (
            <>
              <div style={{
                width: '64px',
                height: '64px',
                background: BrandColors.bg3,
                borderRadius: '50%',
                margin: '0 auto',
                marginBottom: Spacing.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}>
                🔒
              </div>

              <h2 style={{
                ...Typography.titleLargeEmph,
                color: BrandColors.text1,
                textAlign: 'center',
                marginBottom: Spacing.xs,
              }}>
                Access denied
              </h2>

              <p style={{
                ...Typography.bodyMedium,
                color: BrandColors.text2,
                textAlign: 'center',
                marginBottom: Spacing.lg,
              }}>
                The email <strong style={{ color: BrandColors.text1 }}>{email}</strong> is not
                a participant of this event. Only event members can view recap content.
              </p>

              <button
                onClick={handleRetry}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                Try a different email
              </button>
            </>
          )}

          {/* ── Email Phase ── */}
          {phase === 'email' && (
            <>
              <div style={{
                width: '64px',
                height: '64px',
                background: BrandColors.bg3,
                borderRadius: '50%',
                margin: '0 auto',
                marginBottom: Spacing.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}>
                {eventEmoji || '📸'}
              </div>

              <h2 style={{
                ...Typography.titleLargeEmph,
                color: BrandColors.text1,
                textAlign: 'center',
                marginBottom: Spacing.xs,
              }}>
                Verify your identity
              </h2>

              <p style={{
                ...Typography.bodyMedium,
                color: BrandColors.text2,
                textAlign: 'center',
                marginBottom: Spacing.lg,
              }}>
                Enter the email you use on Lazzo to access the memories of{' '}
                <strong style={{ color: BrandColors.text1 }}>{eventName}</strong>
              </p>

              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className="input-field"
                disabled={loading}
                autoComplete="email"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && email.trim()) handleSendOtp();
                }}
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

          {/* ── OTP Phase ── */}
          {phase === 'otp' && (
            <>
              <button
                onClick={() => { setPhase('email'); setError(null); }}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: BrandColors.text2,
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '4px 0',
                  marginBottom: Spacing.sm,
                }}
              >
                ← Back
              </button>

              <p style={{
                ...Typography.bodyMedium,
                color: BrandColors.text2,
                marginBottom: '4px',
              }}>
                Enter the 6-digit code sent to
              </p>
              <p style={{
                ...Typography.bodyMediumEmph,
                color: BrandColors.text1,
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
                {loading ? 'Verifying...' : 'Verify & Access'}
              </button>

              <button
                onClick={handleSendOtp}
                disabled={loading || resendCooldown > 0}
                style={{
                  width: '100%',
                  marginTop: Spacing.sm,
                  padding: `${Spacing.sm} ${Spacing.md}`,
                  background: 'transparent',
                  color: BrandColors.text2,
                  border: 'none',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  fontSize: '13px',
                  opacity: resendCooldown > 0 ? 0.5 : 1,
                }}
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Didn't receive the code? Resend"}
              </button>
            </>
          )}

          {/* ── Error Message ── */}
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
        </div>
      </div>
    </>
  );
}
