'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrandColors, Spacing } from '../../design/constants';
import { createBrowserSupabase } from '../../../lib/supabase';
import OtpInput from './OtpInput';
import { saveSession } from './SessionManager';
import {
  trackRsvpSubmitted,
  trackRsvpChanged,
  trackGuestAuthCompleted,
  identifyUser,
  getSecondsSincePageLoad,
} from '../../../lib/analytics';

// ---- Types ----

type RsvpPhase = 'vote' | 'credentials' | 'otp' | 'done';

interface RsvpSectionProps {
  token: string;
  eventId: string;
  initialGoingCount: number;
  initialCantCount: number;
  eventStatus: string;
  onVoteSubmitted: (vote: 'going' | 'not_going', guestName: string) => void;
  onGuestsPress?: () => void;
}

// ---- Main Component ----

export default function RsvpSection({
  token,
  eventId,
  initialGoingCount,
  initialCantCount,
  eventStatus,
  onVoteSubmitted,
  onGuestsPress,
}: RsvpSectionProps) {
  const [phase, setPhase] = useState<RsvpPhase>('vote');
  const [selectedVote, setSelectedVote] = useState<'going' | 'not_going' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedVote, setConfirmedVote] = useState<string | null>(null);
  const [confirmedName, setConfirmedName] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check localStorage for existing vote AND restore stored credentials
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`lazzo_rsvp_${token}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfirmedVote(parsed.vote);
        setConfirmedName(parsed.name || '');
        setName(parsed.name || '');
        setEmail(parsed.email || '');
        setPhase('done');
        setSelectedVote(parsed.vote);
      }
    } catch { /* ignore */ }
  }, [token]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Event is not voteable
  const canVote = ['pending', 'confirmed'].includes(eventStatus);

  // ---- Handlers ----

  /** Submit vote directly using stored credentials (no OTP needed) */
  const submitVoteDirect = useCallback(async (vote: 'going' | 'not_going', storedName: string, storedEmail: string) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabase();
      const { error: rsvpError } = await supabase.rpc('upsert_event_guest_rsvp_by_token', {
        p_token: token,
        p_guest_name: storedName,
        p_rsvp: vote,
        p_plus_one: 0,
        p_guest_phone: storedEmail,
      });

      if (rsvpError) throw rsvpError;

      // Update localStorage
      localStorage.setItem(
        `lazzo_rsvp_${token}`,
        JSON.stringify({ vote, name: storedName, email: storedEmail })
      );
      saveSession(token, storedEmail, storedName);

      // Analytics: track RSVP (re-vote = change)
      if (confirmedVote && confirmedVote !== vote) {
        trackRsvpChanged(eventId, confirmedVote, vote === 'going' ? 'going' : 'cant');
      } else {
        trackRsvpSubmitted(eventId, vote, getSecondsSincePageLoad());
      }

      setConfirmedVote(vote);
      setConfirmedName(storedName);
      setPhase('done');
      onVoteSubmitted(vote, storedName);
    } catch {
      // If direct submit fails, fall back to full credential flow
      setPhase('credentials');
      setError('Session expired — please verify again');
    } finally {
      setLoading(false);
    }
  }, [token, onVoteSubmitted]);

  const handleVoteClick = useCallback((vote: 'going' | 'not_going') => {
    setSelectedVote(vote);
    setError(null);

    // If we have stored credentials from a previous vote, submit directly
    if (name.trim() && email.trim()) {
      submitVoteDirect(vote, name.trim(), email.trim());
      return;
    }

    // No stored credentials — show the credential + OTP flow
    setPhase('credentials');
  }, [name, email, submitVoteDirect]);

  const handleSendOtp = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setError('Please enter your name and email');
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
        setError(otpError.message);
        return;
      }

      setPhase('otp');
      setOtpCode('');
      setResendCooldown(60);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }, [name, email]);

  const handleVerifyAndVote = useCallback(async () => {
    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabase();

      // 1. Verify OTP
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode,
        type: 'email',
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      // 2. Update user name in public.users (best effort — may fail due to RLS)
      if (authData.session?.user?.id) {
        await supabase
          .from('users')
          .update({ name: name.trim() })
          .eq('id', authData.session.user.id)
          .then(() => { /* ignore result */ });
      }

      // 3. Submit RSVP via RPC
      const { error: rsvpError } = await supabase.rpc('upsert_event_guest_rsvp_by_token', {
        p_token: token,
        p_guest_name: name.trim(),
        p_rsvp: selectedVote!,
        p_plus_one: 0,
        p_guest_phone: email.trim(), // email stored in guest_phone field
      });

      if (rsvpError) {
        setError(rsvpError.message);
        return;
      }

      // 4. Persist to localStorage
      localStorage.setItem(
        `lazzo_rsvp_${token}`,
        JSON.stringify({
          vote: selectedVote,
          name: name.trim(),
          email: email.trim(),
        })
      );

      // 4b. Save session for persistence across visits
      saveSession(token, email.trim(), name.trim());

      // 4c. Analytics: identify user + track auth + track RSVP
      if (authData.session?.user?.id) {
        identifyUser(authData.session.user.id, { role: 'guest' });
        trackGuestAuthCompleted(eventId, authData.session.user.id);
      }
      trackRsvpSubmitted(eventId, selectedVote!, getSecondsSincePageLoad());

      // 5. Update UI
      setConfirmedVote(selectedVote!);
      setConfirmedName(name.trim());
      setPhase('done');
      onVoteSubmitted(selectedVote!, name.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [otpCode, email, name, selectedVote, token, onVoteSubmitted]);

  const handleBack = useCallback(() => {
    setPhase('vote');
    setSelectedVote(null);
    setError(null);
  }, []);

  const handleEditVote = useCallback(() => {
    setPhase('vote');
    setSelectedVote(null);
    setConfirmedVote(null);
    // Keep name/email in state so re-vote can skip OTP
    setError(null);
  }, []);

  // ---- Render: event not voteable ----

  if (!canVote && phase !== 'done') {
    return (
      <div style={{
        background: BrandColors.bg3,
        borderRadius: Spacing.radiusSmAlt,
        padding: Spacing.md,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '14px', color: BrandColors.text2 }}>
          {eventStatus === 'living'
            ? '🎉 This event is happening now!'
            : eventStatus === 'recap'
            ? '📸 This event has ended — memories are being collected.'
            : '✅ This event has ended.'}
        </p>
      </div>
    );
  }

  // ---- Vote color + label helpers ----
  const voteColor = confirmedVote === 'going' ? BrandColors.planning : BrandColors.cantVote;
  const voteLabel = confirmedVote === 'going' ? 'Can' : "Can't";
  const voteIcon = confirmedVote === 'going' ? (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={voteColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={voteColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  // ---- Render: DONE STATE (matches Flutter _buildVotedState) ----

  if (phase === 'done') {
    return (
      <div style={{
        background: BrandColors.bg2,
        borderRadius: Spacing.radiusMd,
        overflow: 'hidden',
        display: 'flex',
        minHeight: '72px',
      }}>
        {/* LEFT: Vote summary (tappable → manage guests) */}
        <div
          onClick={onGuestsPress}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: `${Spacing.sm} ${Spacing.md}`,
            cursor: onGuestsPress ? 'pointer' : 'default',
            minWidth: 0,
          }}
        >
          {/* Voter row: stacked avatars + text */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {/* Stacked avatars */}
            <StackedAvatars
              goingCount={initialGoingCount}
              cantCount={initialCantCount}
              confirmedVote={confirmedVote}
              confirmedName={confirmedName}
            />
            {/* Voter text */}
            <p style={{
              fontSize: '14px',
              color: BrandColors.text1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
            }}>
              <strong>{confirmedName}</strong>
              {' voted '}
              {confirmedVote === 'going' ? 'can' : "can't"}
            </p>
          </div>

          {/* Vote counts subtitle */}
          <p style={{
            fontSize: '13px',
            color: BrandColors.text2,
            marginTop: '4px',
            margin: 0,
            marginLeft: 0,
          }}>
            {initialGoingCount} can · 0 maybe · {initialCantCount} can&apos;t
          </p>
        </div>

        {/* RIGHT: Confirmed vote indicator (tappable → edit vote) */}
        <button
          onClick={handleEditVote}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 20px',
            background: `${voteColor}26`,
            border: 'none',
            borderRadius: `0 ${Spacing.radiusMd} ${Spacing.radiusMd} 0`,
            cursor: 'pointer',
            minWidth: '64px',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {voteIcon}
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: voteColor,
            marginTop: '2px',
          }}>
            {voteLabel}
          </span>
        </button>
      </div>
    );
  }

  // ---- Render: VOTE / CREDENTIALS / OTP ----

  return (
    <div style={{
      background: BrandColors.bg3,
      borderRadius: Spacing.radiusSmAlt,
      padding: Spacing.md,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
      }}>
        <p style={{
          fontSize: '15px',
          fontWeight: 600,
          color: BrandColors.text1,
        }}>
          Can you make it?
        </p>

        {/* Back button when in credential/otp phase */}
        {(phase === 'credentials' || phase === 'otp') && (
          <button
            onClick={handleBack}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: BrandColors.text2,
              fontSize: '13px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ← Back
          </button>
        )}
      </div>

      {/* ---- VOTE BUTTONS ---- */}
      <div style={{
        display: 'flex',
        gap: Spacing.sm,
        marginBottom: (phase === 'credentials' || phase === 'otp') ? Spacing.md : '0',
      }}>
        <VoteButton
          label="Can"
          count={initialGoingCount}
          isSelected={selectedVote === 'going'}
          color={BrandColors.planning}
          onClick={() => handleVoteClick('going')}
          onCountPress={onGuestsPress}
          disabled={loading}
        />
        <VoteButton
          label="Can't"
          count={initialCantCount}
          isSelected={selectedVote === 'not_going'}
          color={BrandColors.cantVote}
          onClick={() => handleVoteClick('not_going')}
          onCountPress={onGuestsPress}
          disabled={loading}
        />
      </div>

      {/* ---- CREDENTIALS FORM (slides in) ---- */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: phase === 'credentials' ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.35s ease-out',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            borderTop: `1px solid ${BrandColors.border}`,
            paddingTop: Spacing.md,
          }}>
            <p style={{
              fontSize: '14px',
              color: BrandColors.text2,
              marginBottom: Spacing.md,
            }}>
              Confirm your identity to vote
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
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: Spacing.md,
                justifyContent: 'center',
                opacity: loading || !name.trim() || !email.trim() ? 0.5 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send verification code'}
            </button>
          </div>
        </div>
      </div>

      {/* ---- OTP INPUT (slides in) ---- */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: phase === 'otp' ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.35s ease-out',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            borderTop: `1px solid ${BrandColors.border}`,
            paddingTop: Spacing.md,
          }}>
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
              onClick={handleVerifyAndVote}
              disabled={loading || otpCode.length < 6}
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: Spacing.md,
                justifyContent: 'center',
                opacity: loading || otpCode.length < 6 ? 0.5 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Vote'}
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
          </div>
        </div>
      </div>

      {/* ---- ERROR MESSAGE ---- */}
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
  );
}

// ---- Vote Button Sub-component ----

function VoteButton({
  label,
  count,
  isSelected,
  color,
  onClick,
  onCountPress,
  disabled,
}: {
  label: string;
  count: number;
  isSelected: boolean;
  color: string;
  onClick: () => void;
  onCountPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 16px',
        background: isSelected ? color : BrandColors.bg2,
        border: `1.5px solid ${isSelected ? color : BrandColors.border}`,
        borderRadius: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{
        fontSize: '14px',
        fontWeight: 600,
        color: isSelected ? BrandColors.text1 : BrandColors.text2,
      }}>
        {label}
      </span>
      {count > 0 && (
        <span
          onClick={(e) => {
            if (onCountPress) {
              e.stopPropagation();
              onCountPress();
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '22px',
            height: '22px',
            padding: '0 6px',
            borderRadius: '11px',
            fontSize: '12px',
            fontWeight: 600,
            background: isSelected ? 'rgba(255,255,255,0.2)' : BrandColors.bg1,
            color: isSelected ? BrandColors.text1 : BrandColors.text2,
            cursor: onCountPress ? 'pointer' : 'inherit',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}


// ---- Stacked Avatars (matches Flutter _buildStackedAvatars) ----
// Shows overlapping initial circles for voters

function StackedAvatars({
  goingCount,
  cantCount,
  confirmedVote,
  confirmedName,
}: {
  goingCount: number;
  cantCount: number;
  confirmedVote: string | null;
  confirmedName: string;
}) {
  // Show up to 5 avatars based on total relevant count
  const totalRelevant = confirmedVote === 'going' ? goingCount : cantCount;
  const count = Math.min(totalRelevant, 5);
  if (count === 0) return null;

  const avatarSize = 24;
  const overlap = 6;
  const totalWidth = avatarSize + (count - 1) * (avatarSize - overlap);

  // Generate initials — first is always the confirmed user, rest are placeholders
  const initials: string[] = [];
  initials.push(confirmedName?.[0]?.toUpperCase() || '?');
  for (let i = 1; i < count; i++) {
    initials.push(String.fromCharCode(65 + ((i + 3) % 26))); // A, B, C...
  }

  return (
    <div style={{
      position: 'relative',
      width: `${totalWidth}px`,
      height: `${avatarSize}px`,
      flexShrink: 0,
    }}>
      {initials.map((initial, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${i * (avatarSize - overlap)}px`,
            top: 0,
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            borderRadius: '50%',
            background: BrandColors.bg3,
            border: `1.5px solid ${BrandColors.bg2}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 500,
            color: BrandColors.text2,
            zIndex: count - i,
          }}
        >
          {initial}
        </div>
      ))}
    </div>
  );
}
