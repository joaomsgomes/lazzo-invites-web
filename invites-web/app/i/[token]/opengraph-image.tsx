// Dynamic OG image for WhatsApp / social card previews
// Generates a 1200×630 branded card with the event emoji + name

import { ImageResponse } from 'next/og';
import { createServerSupabase, type EventData } from '../../../lib/supabase';

export const runtime = 'edge';
export const alt = 'Lazzo Event Invite';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let eventName = 'You\'re Invited!';
  let eventEmoji = '📩';

  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .rpc('get_event_by_invite_token', { p_token: token })
      .single();

    if (data) {
      const event = data as EventData;
      eventName = event.event_name || eventName;
      eventEmoji = event.event_emoji || eventEmoji;
    }
  } catch {
    // Fall back to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#121212',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Emoji */}
        <div style={{ fontSize: 120, lineHeight: 1 }}>{eventEmoji}</div>

        {/* Event name */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#F2F2F2',
            marginTop: 32,
            textAlign: 'center',
            maxWidth: '80%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineClamp: 2,
          }}
        >
          {eventName}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: '#A6A6A6',
            marginTop: 16,
          }}
        >
          You&apos;re invited!
        </div>

        {/* Lazzo branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 40,
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: '#A6A6A6',
              letterSpacing: 4,
              fontWeight: 600,
            }}
          >
            LAZZO
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
