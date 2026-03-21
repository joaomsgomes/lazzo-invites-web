'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import { createBrowserSupabase } from '../../../lib/supabase';
import { inviteAuthCopy } from '../../../lib/inviteAuthCopy';
import OtpInput from './OtpInput';
import { identifyUser, trackAuthStarted, trackGuestAuthCompleted } from '../../../lib/analytics';

// ═══════════════════════════════════════════════════════════════════
// EventAuthGate — OTP verification gate for living, recap & ended pages
//
// Flow:
// 1. Check localStorage for existing event auth session
// 2. If no session → user enters email and receives OTP
// 3. Verify OTP, then verify participant via token-gated RPC
// 4. If participant → save session, grant access
// ═══════════════════════════════════════════════════════════════════

const AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const AUTH_STORAGE_PREFIX = 'lazzo_event_auth_';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

interface EventAuthGateProps {
  token: string;
  eventId: string;
  eventName: string;
  eventEmoji: string;
  eventPhase: 'living' | 'recap' | 'ended';
  children: React.ReactNode;
}

export default function EventAuthGate({
  token,
  eventId,
  eventName,
  eventEmoji,
  eventPhase,
  children,
}: EventAuthGateProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<'email' | 'otp' | 'denied'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const mountedRef = useRef(true);

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = EMAIL_REGEX.test(normalizedEmail);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const authSession = getAuthSession(token);
    if (authSession) {
      setEmail(authSession.email);
      setIsAuthorized(true);
      return;
    }

    setIsAuthorized(false);
    try {
      const candidates = [
        `lazzo_session_${token}`,
        `lazzo_rsvp_${token}`,
        `lazzo_recap_auth_${token}`,
      ];
      for (const key of candidates) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed?.email && EMAIL_REGEX.test(String(parsed.email).trim().toLowerCase())) {
          setEmail(String(parsed.email).trim().toLowerCase());
          break;
        }
      }
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(inviteAuthCopy.emailRequired);
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(inviteAuthCopy.emailInvalid);
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
        if (mountedRef.current) setError(inviteAuthCopy.sendCodeFailed);
        return;
      }

      if (mountedRef.current) {
        trackAuthStarted(eventId);
        setPhase('otp');
        setOtpCode('');
        setResendCooldown(60);
      }
    } catch {
      if (mountedRef.current) setError(inviteAuthCopy.sendCodeFailed);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [email, eventId]);

  const handleVerify = useCallback(async () => {
    if (otpCode.length < 6) {
      setError(inviteAuthCopy.otpIncomplete);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const trimmedEmail = email.trim();

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: otpCode,
        type: 'email',
      });
      if (verifyError) {
        if (mountedRef.current) setError(inviteAuthCopy.otpWrong);
        return;
      }

      const { data: isParticipant, error: rpcError } = await supabase.rpc(
        'verify_event_access_by_email',
        { p_token: token, p_email: trimmedEmail },
      );
      if (rpcError) {
        if (mountedRef.current) setError(inviteAuthCopy.verifyUnavailable);
        return;
      }
      if (!isParticipant) {
        if (mountedRef.current) setPhase('denied');
        return;
      }

      saveAuthSession(token, trimmedEmail);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        identifyUser(session.user.id, { role: 'guest', email: trimmedEmail });
        trackGuestAuthCompleted(eventId, session.user.id);
      }

      if (mountedRef.current) setIsAuthorized(true);
    } catch {
      if (mountedRef.current) setError(inviteAuthCopy.generic);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [email, otpCode, token, eventId]);

  const handleRetry = useCallback(() => {
    setPhase('email');
    setEmail('');
    setOtpCode('');
    setError(null);
  }, []);

  if (isAuthorized === null) return null;
  if (isAuthorized) return <>{children}</>;

  const accentColor =
    eventPhase === 'living'
      ? BrandColors.living
      : eventPhase === 'recap'
        ? BrandColors.recap
        : BrandColors.text2;
  const phaseLabel = eventPhase === 'living' ? 'live event' : 'memories';
  const inputAccentClass =
    eventPhase === 'living'
      ? 'input-field-accent-living'
      : eventPhase === 'recap'
        ? 'input-field-accent-recap'
        : 'input-field-accent-ended';

  return (
    <>
      <div style={{ filter: 'blur(12px)', pointerEvents: 'none', opacity: 0.4 }}>
        {children}
      </div>

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
                type="button"
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
                className={`input-field ${inputAccentClass}`}
                disabled={loading}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                onBlur={() => {
                  if (email.trim() && !isEmailValid) {
                    setError(inviteAuthCopy.emailInvalid);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && normalizedEmail && isEmailValid) handleSendOtp();
                }}
              />

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !normalizedEmail || !isEmailValid}
                className="btn-primary"
                style={{
                  width: '100%',
                  marginTop: Spacing.md,
                  justifyContent: 'center',
                  opacity: loading || !normalizedEmail || !isEmailValid ? 0.5 : 1,
                  background: accentColor,
                }}
              >
                {loading ? 'Sending...' : 'Send verification code'}
              </button>
            </>
          )}

          {phase === 'otp' && (
            <>
              <button
                type="button"
                onClick={() => { setPhase('email'); setError(null); }}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: Spacing.xxs,
                  background: BrandColors.bg3,
                  border: 'none',
                  borderRadius: Spacing.radiusPill,
                  color: BrandColors.text2,
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: `${Spacing.xxs} ${Spacing.sm}`,
                  marginBottom: Spacing.sm,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back
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
                accentColor={accentColor}
              />

              <button
                type="button"
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
                type="button"
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
