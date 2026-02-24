import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for browser/client components.
 * Uses a singleton to ensure consistent auth state management.
 * Used for Auth OTP and RPC calls from the client.
 */
let _browserClient: SupabaseClient | null = null;
export function createBrowserSupabase(): SupabaseClient {
  if (!_browserClient) {
    _browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _browserClient;
}

/**
 * Creates a Supabase client for server components.
 * Used for server-side data fetching via RPCs.
 * RPCs are SECURITY DEFINER so anon key is sufficient.
 */
export function createServerSupabase(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}

/**
 * Creates a Supabase client with the service role key (server-side only).
 * Bypasses RLS — used for generating storage signed URLs.
 * Returns null if SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function createServiceSupabase(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}

// ---- Types ----

/** Shape returned by `get_event_by_invite_token` RPC */
export interface EventData {
  event_id: string;
  event_name: string;
  event_emoji: string;
  event_description: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  location_name: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  organizer_name: string;
  organizer_avatar: string | null;
  status: string;
  participant_count: number;
  going_count: number;
  guest_going_count: number;
  cover_photo_url: string | null;
}

/** Shape returned by `get_event_photos_by_invite_token` RPC */
export interface EventPhoto {
  photo_id: string;
  url: string;
  storage_path: string;
  is_portrait: boolean;
  captured_at: string;
}

/** Normalised guest record used by ManageGuestsSheet */
export interface GuestRecord {
  id: string;
  name: string;
  /** Normalised status: going | not_going | maybe | pending */
  rsvp: 'going' | 'not_going' | 'maybe' | 'pending';
  source: 'app' | 'web';
  avatar_url: string | null;
  voted_at: string | null;
}

/**
 * Fetches all guests for an event (app participants + web guests).
 * Uses service role client to bypass RLS.
 * Returns empty array on failure (graceful degradation).
 */
export async function fetchEventGuests(eventId: string): Promise<GuestRecord[]> {
  try {
    const serviceClient = createServiceSupabase();
    if (!serviceClient) return [];

    // 1. App participants
    const { data: appParticipants, error: appErr } = await serviceClient
      .from('event_participants')
      .select('user_id, rsvp, confirmed_at')
      .eq('pevent_id', eventId);

    // 2. Fetch user details separately (avoids FK join issues)
    let userMap = new Map<string, { name: string; avatar_url: string | null }>();
    if (appParticipants && appParticipants.length > 0) {
      const userIds = appParticipants.map((p: { user_id: string }) => p.user_id);
      const { data: users } = await serviceClient
        .from('users')
        .select('id, name, avatar_url')
        .in('id', userIds);
      if (users) {
        for (const u of users) {
          userMap.set(u.id, { name: u.name, avatar_url: u.avatar_url });
        }
      }
    }

    // 3. Web guests (event_guest_rsvps)
    const { data: webGuests, error: webErr } = await serviceClient
      .from('event_guest_rsvps')
      .select('id, guest_name, rsvp, updated_at')
      .eq('event_id', eventId);

    const guests: GuestRecord[] = [];

    // Normalise app participants (rsvp_status enum: pending/yes/no/maybe → our format)
    if (appParticipants) {
      for (const p of appParticipants) {
        const user = userMap.get(p.user_id);
        const rsvpMap: Record<string, GuestRecord['rsvp']> = {
          yes: 'going',
          no: 'not_going',
          maybe: 'maybe',
          pending: 'pending',
        };
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

    // Web guests already use our format
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

    return guests;
  } catch {
    return [];
  }
}

/**
 * Fetches event photos using direct table queries with the service role client.
 * Validates the invite token, queries event_photos, and generates signed URLs.
 * Does NOT depend on any custom RPC — works regardless of DB migrations.
 * Returns empty array on failure (graceful degradation).
 */
export async function fetchEventPhotos(token: string): Promise<EventPhoto[]> {
  try {
    const serviceClient = createServiceSupabase();
    if (!serviceClient) return [];

    // 1. Validate invite token → get event_id
    const { data: linkData, error: linkError } = await serviceClient
      .from('event_invite_links')
      .select('event_id')
      .eq('token', token)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (linkError || !linkData?.event_id) return [];

    // 2. Fetch photos ordered by most recent
    const { data: rows, error: photosError } = await serviceClient
      .from('event_photos')
      .select('id, url, storage_path, is_portrait, captured_at')
      .eq('event_id', linkData.event_id)
      .order('captured_at', { ascending: false })
      .limit(50);

    if (photosError || !rows || rows.length === 0) return [];

    // 3. Generate signed URLs (bypasses storage RLS)
    const paths = rows.map((r: Record<string, unknown>) => r.storage_path as string);
    const { data: signedData } = await serviceClient
      .storage.from('memory_groups')
      .createSignedUrls(paths, 7200); // 2-hour expiry

    return rows.map((row: Record<string, unknown>, i: number) => ({
      photo_id: row.id as string,
      url: (signedData?.[i]?.signedUrl || row.url) as string,
      storage_path: row.storage_path as string,
      is_portrait: row.is_portrait as boolean,
      captured_at: row.captured_at as string,
    }));
  } catch {
    return [];
  }
}
