import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for browser/client components.
 * Used for Auth OTP and RPC calls from the client.
 */
export function createBrowserSupabase(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
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
