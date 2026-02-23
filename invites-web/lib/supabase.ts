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
 * Fetches event photos via the token-gated RPC.
 * Generates signed URLs using service role key if available.
 * Returns empty array on failure (graceful degradation).
 */
export async function fetchEventPhotos(token: string): Promise<EventPhoto[]> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .rpc('get_event_photos_by_invite_token', { p_token: token });

    if (error || !data) return [];
    const photos = data as EventPhoto[];
    if (photos.length === 0) return [];

    // Generate signed URLs using service role (bypasses storage RLS)
    const serviceClient = createServiceSupabase();
    if (serviceClient) {
      const paths = photos.map((p) => p.storage_path);
      const { data: signedData } = await serviceClient
        .storage.from('memory_groups')
        .createSignedUrls(paths, 7200); // 2-hour expiry

      if (signedData) {
        return photos.map((photo, i) => ({
          ...photo,
          url: signedData[i]?.signedUrl || photo.url,
        }));
      }
    }

    return photos;
  } catch {
    return [];
  }
}
