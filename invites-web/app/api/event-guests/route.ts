import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════
// GET /api/event-guests?token=xxx — Client-side guest list fetch
//
// Returns all guests (app participants + web guests) with normalised
// RSVP statuses. Token-gated: validates invite token → gets event_id.
// Uses service role to bypass RLS.
// ═══════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface GuestRecord {
  id: string;
  name: string;
  rsvp: 'going' | 'not_going' | 'maybe' | 'pending';
  source: 'app' | 'web';
  avatar_url: string | null;
  voted_at: string | null;
}

function isAbsoluteUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

async function buildSignedAvatarMap(
  serviceClient: ReturnType<typeof createClient>,
  avatars: string[]
): Promise<Map<string, string>> {
  const avatarMap = new Map<string, string>();
  const relativePaths = avatars.filter((p) => p && !isAbsoluteUrl(p));
  if (relativePaths.length === 0) return avatarMap;

  const uniquePaths = Array.from(new Set(relativePaths));

  const { data: primarySigned } = await serviceClient
    .storage
    .from('users-profile-pic')
    .createSignedUrls(uniquePaths, 60 * 60 * 12);

  for (let i = 0; i < uniquePaths.length; i++) {
    const signed = primarySigned?.[i]?.signedUrl;
    if (signed) avatarMap.set(uniquePaths[i], signed);
  }

  const missing = uniquePaths.filter((p) => !avatarMap.has(p));
  if (missing.length > 0) {
    const { data: legacySigned } = await serviceClient
      .storage
      .from('avatars')
      .createSignedUrls(missing, 60 * 60 * 12);

    for (let i = 0; i < missing.length; i++) {
      const signed = legacySigned?.[i]?.signedUrl;
      if (signed) avatarMap.set(missing[i], signed);
    }
  }

  return avatarMap;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  if (!serviceRoleKey) {
    return NextResponse.json({ guests: [] });
  }

  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Validate token → get event_id
    const { data: linkData, error: linkError } = await serviceClient
      .from('event_invite_links')
      .select('event_id')
      .eq('token', token)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (linkError || !linkData?.event_id) {
      return NextResponse.json({ guests: [] });
    }

    const eventId = linkData.event_id;

    // 2. App participants
    const { data: appParticipants } = await serviceClient
      .from('event_participants')
      .select('user_id, rsvp, confirmed_at')
      .eq('pevent_id', eventId);

    // 3. Fetch user details
    const userMap = new Map<string, { name: string; avatar_url: string | null }>();
    if (appParticipants && appParticipants.length > 0) {
      const userIds = appParticipants.map((p: { user_id: string }) => p.user_id);
      const { data: users } = await serviceClient
        .from('users')
        .select('id, name, avatar_url')
        .in('id', userIds);

      const signedAvatars = await buildSignedAvatarMap(
        serviceClient,
        (users || []).map((u) => u.avatar_url).filter(Boolean) as string[]
      );

      if (users) {
        for (const u of users) {
          const avatarUrl = u.avatar_url
            ? (isAbsoluteUrl(u.avatar_url) ? u.avatar_url : (signedAvatars.get(u.avatar_url) || null))
            : null;
          userMap.set(u.id, { name: u.name, avatar_url: avatarUrl });
        }
      }
    }

    // 4. Web guests
    const { data: webGuests } = await serviceClient
      .from('event_guest_rsvps')
      .select('id, guest_name, rsvp, updated_at')
      .eq('event_id', eventId);

    const guests: GuestRecord[] = [];

    // Normalise app participants
    if (appParticipants) {
      const rsvpMap: Record<string, GuestRecord['rsvp']> = {
        yes: 'going',
        no: 'not_going',
        maybe: 'maybe',
        pending: 'pending',
      };
      for (const p of appParticipants) {
        const user = userMap.get(p.user_id);
        guests.push({
          id: p.user_id,
          name: user?.name || 'Unknown',
          rsvp: rsvpMap[p.rsvp] || 'pending',
          source: 'app',
          avatar_url: user?.avatar_url || null,
          voted_at: p.confirmed_at || null,
        });
      }
    }

    // Web guests
    if (webGuests) {
      for (const g of webGuests) {
        guests.push({
          id: g.id,
          name: g.guest_name,
          rsvp: g.rsvp as GuestRecord['rsvp'],
          source: 'web',
          avatar_url: null,
          voted_at: g.updated_at || null,
        });
      }
    }

    return NextResponse.json({ guests });
  } catch {
    return NextResponse.json({ guests: [] });
  }
}
