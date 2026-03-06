'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import { createBrowserSupabase } from '../../../lib/supabase';
import OtpInput from './OtpInput';

// ═══════════════════════════════════════════════════════════════════
// EventAuthGate — OTP verification gate for living, recap & ended pages
//
// Flow:
// 1. Check localStorage for existing RSVP/auth session
// 2. If valid session exists → auto-grant access
// 3. If no session → show email prompt → send OTP
// 4. After OTP verification → check if email is a participant
// 5. If participant → save session, grant access
// 6. If not → deny access
// ═══════════════════════════════════════════════════════════════════

const AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const AUTH_STORAGE_PREFIX = 'lazzo_event_auth_';

interface AuthSession {
  email: string;
  authenticatedAt: number;
}

function getAuthSession(token: string): AuthSession | null {
  try {
    const raw = localStorage.getItem(`${AUTH_STORAGE_PREFIX}${token}`);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() - session.authenticatedAt > AUTH_TTL_MS) return null;
    return session;
  } catch {
    return null;
  }
}

function saveAuthSession(token: string, email: string): void {
  try {
    const session: AuthSession = { email, authenticatedAt: Date.now() };
    localStorage.setItem(`${AUTH_STORAGE_PREFIX}${token}`, JSON.stringify(session));
  } catch { /* silent */ }
}

// ── Props ────────────────────────────────────────────────────────

interface EventAuthGateProps {
  token: string;
  eventId: string;
  eventName: string;
  eventEmoji: string;
  /** 'living', 'recap', or 'ended' — affects copy and accent color */
  eventPhase: 'living' | 'recap' | 'ended';
  children: React.ReactNode;
}

// ── Component ────────────────────────────────────────────────────

export default function EventAuthGate({
  token,
  eventId,
  eventName,
  eventEmoji,
  eventPhase,
  children,
}: EventAuthGateProps) {
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

  // Check for existing sessions on mount
  useEffect(() => {
    // 1. Check dedicated auth session
    const authSession = getAuthSession(token);
    if (authSession) {
      setIsAuthorized(true);
      return;
    }

    // 2. Check RSVP session (set during planning vote)
    try {
      const rsvpRaw = localStorage.getItem(`lazzo_rsvp_${token}`);
      if (rsvpRaw) {
        const rsvp = JSON.parse(rsvpRaw);
        if (rsvp.email && rsvp.vote) {
          // User voted during planning — grant access and save auth session
          saveAuthSession(token, rsvp.email);
          setIsAuthorized(true);
          return;
        }
      }
    } catch { /* ignore */ }

    // 3. Check recap auth session (legacy, if RecapAuthGate was used before)
    try {
      const recapRaw = localStorage.getItem(`lazzo_recap_auth_${token}`);
      if (recapRaw) {
        const recap = JSON.parse(recapRaw);
        if (recap.email && Date.now() - recap.authenticatedAt < AUTH_TTL_MS) {
          saveAuthSession(token, recap.email);
          setIsAuthorized(true);
          return;
        }
      }
    } catch { /* ignore */ }

    // No valid session found — need verification
    setIsAuthorized(false);

    // Pre-fill email from expired sessions
    try {
      const sessionRaw = localStorage.getItem(`lazzo_session_${token}`);
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session.email) setEmail(session.email);
      }
    } catch { /* ignore */ }
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
        // Access granted — save session
        saveAuthSession(token, email.trim());
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

  // ── Reset ──

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

  // Color based on phase
  const accentColor = eventPhase === 'living' ? BrandColors.living : eventPhase === 'recap' ? BrandColors.recap : BrandColors.text2;
  const phaseLabel = eventPhase === 'living' ? 'live event' : 'memories';

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
                margin: '0 auto',
                marginBottom: Spacing.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '56px',
                lineHeight: 1,
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
                a participant of this event. Only people who RSVP&apos;d during planning can access the {phaseLabel}.
              </p>

              <button
                onClick={handleRetry}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: accentColor,
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
                margin: '0 auto',
                marginBottom: Spacing.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '56px',
                lineHeight: 1,
              }}>
                {eventEmoji}
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
                Enter the email you used when you RSVP&apos;d to{' '}
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
                  background: accentColor,
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
                  background: accentColor,
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
