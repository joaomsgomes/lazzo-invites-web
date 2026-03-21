'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import { createBrowserSupabase } from '../../../lib/supabase';
import { inviteAuthCopy } from '../../../lib/inviteAuthCopy';

// ═══════════════════════════════════════════════════════════════════
// EventAuthGate — Email-only verification for living, recap & ended pages
//
// Flow:
// 1. Check localStorage for existing RSVP / event auth session
// 2. If no session → user enters email → RPC verify_event_access_by_email
// 3. If participant → save session, grant access (no email OTP)
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
  eventName: string;
  eventEmoji: string;
  eventPhase: 'living' | 'recap' | 'ended';
  children: React.ReactNode;
}

export default function EventAuthGate({
  token,
  eventName,
  eventEmoji,
  eventPhase,
  children,
}: EventAuthGateProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<'email' | 'denied'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = EMAIL_REGEX.test(normalizedEmail);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const authSession = getAuthSession(token);
    if (authSession) {
      setIsAuthorized(true);
      return;
    }

    try {
      const rsvpRaw = localStorage.getItem(`lazzo_rsvp_${token}`);
      if (rsvpRaw) {
        const rsvp = JSON.parse(rsvpRaw);
        if (rsvp.email && rsvp.vote) {
          saveAuthSession(token, rsvp.email);
          setIsAuthorized(true);
          return;
        }
      }
    } catch { /* ignore */ }

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

    setIsAuthorized(false);

    try {
      const sessionRaw = localStorage.getItem(`lazzo_session_${token}`);
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session.email) setEmail(session.email);
      }
    } catch { /* ignore */ }
  }, [token]);

  const handleContinue = useCallback(async () => {
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
      if (mountedRef.current) setIsAuthorized(true);
    } catch {
      if (mountedRef.current) setError(inviteAuthCopy.generic);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [email, token]);

  const handleRetry = useCallback(() => {
    setPhase('email');
    setEmail('');
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
                  if (e.key === 'Enter' && normalizedEmail && isEmailValid) handleContinue();
                }}
              />

              <button
                type="button"
                onClick={handleContinue}
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
                {loading ? 'Checking…' : 'Continue'}
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
