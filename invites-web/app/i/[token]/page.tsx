// app/i/[token]/page.tsx — Event invite landing page
//
// Flow:
// 1. Server-side: fetch event data via `get_event_by_invite_token` RPC
// 2. Mobile: attempt deep-link to native app (via ClientWrapper/AppRedirect)
// 3. Show event details + RSVP voting
// 4. Guest enters name + email → OTP verification → vote submitted
//

import { cache } from 'react';
import { createServerSupabase, fetchEventPhotos, type EventData, type EventPhoto } from '../../../lib/supabase';
import { BrandColors, Spacing } from '../../design/constants';
import EventPage from './EventPage';
import ClientWrapper from './ClientWrapper';
import Link from 'next/link';
import type { Metadata } from 'next';

// Disable Next.js caching — invite pages must always show fresh data
export const dynamic = 'force-dynamic';

// ── Data Fetching (deduplicated between generateMetadata & page) ──

const getEventData = cache(
  async (token: string): Promise<{ event: EventData | null; error: string | null }> => {
    try {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .rpc('get_event_by_invite_token', { p_token: token })
        .single();

      if (error) {
        const msg = error.message || '';
        if (msg.includes('Invalid') || msg.includes('expired')) {
          return { event: null, error: 'expired' };
        }
        return { event: null, error: 'unknown' };
      }

      if (!data) return { event: null, error: 'not_found' };
      return { event: data as EventData, error: null };
    } catch {
      return { event: null, error: 'unknown' };
    }
  }
);

// ── Dynamic OG Metadata (for WhatsApp card preview) ──

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const { event } = await getEventData(token);

  if (!event) return { title: 'Lazzo - Invite' };

  const title = `${event.event_emoji || '📩'} ${event.event_name} | Lazzo`;
  const description =
    event.event_description || `You're invited to ${event.event_name}!`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  };
}

// ── Page Component ──

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { event, error } = await getEventData(token);

  // ── Error State ──
  if (error || !event) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Spacing.lg,
          background: BrandColors.bg1,
        }}
      >
        <div style={{ maxWidth: '520px', width: '100%' }}>
          <div
            style={{
              background: BrandColors.bg2,
              borderRadius: Spacing.radiusMd,
              padding: Spacing.xl,
              border: `1px solid ${BrandColors.border}`,
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: '80px',
                height: '80px',
                background: BrandColors.bg3,
                borderRadius: '50%',
                margin: '0 auto',
                marginBottom: Spacing.lg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
              }}
            >
              {error === 'expired' ? '⏰' : '❌'}
            </div>

            <h1
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: BrandColors.text1,
                textAlign: 'center',
                marginBottom: Spacing.md,
              }}
            >
              {error === 'expired' ? 'Invite expired' : 'Invalid invite'}
            </h1>

            <p
              style={{
                fontSize: '16px',
                color: BrandColors.text2,
                textAlign: 'center',
                lineHeight: 1.6,
                marginBottom: Spacing.lg,
              }}
            >
              {error === 'expired' &&
                'This invite link has expired. Ask the organizer to send a new one.'}
              {error === 'not_found' &&
                "This invite link doesn't exist or has been revoked."}
              {error !== 'expired' &&
                error !== 'not_found' &&
                'Something went wrong. Please try again later.'}
            </p>

            <a
              href="/"
              style={{
                display: 'block',
                width: '100%',
                padding: `${Spacing.md} ${Spacing.lg}`,
                background: BrandColors.planning,
                color: BrandColors.text1,
                borderRadius: Spacing.radiusSmAlt,
                fontWeight: 600,
                fontSize: '16px',
                textAlign: 'center',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Back to Home
            </a>

            <div
              style={{
                textAlign: 'center',
                marginTop: Spacing.lg,
                paddingTop: Spacing.sm,
                borderTop: `1px solid ${BrandColors.border}`,
              }}
            >
              <Link
                href="/privacy"
                style={{ fontSize: '12px', color: BrandColors.text2 }}
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Fetch photos for living/recap events ──
  let photos: EventPhoto[] = [];
  if (event.status === 'living' || event.status === 'recap') {
    photos = await fetchEventPhotos(token);
  }

  // ── Success: Show Event Page ──
  return (
    <ClientWrapper token={token}>
      <EventPage event={event} token={token} photos={photos} />
    </ClientWrapper>
  );
}
