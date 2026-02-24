import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════
// GET /api/event-photos?token=xxx — Client-side photo fetch
//
// Returns event photos with signed URLs.
// Token-gated via the existing RPC (no user auth needed).
// Used by EventPage to refresh photos client-side, ensuring
// persistence across visits and real-time updates from others.
// ═══════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  try {
    // Use anon key for the RPC (SECURITY DEFINER handles access)
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
    });

    const { data, error } = await supabase
      .rpc('get_event_photos_by_invite_token', { p_token: token });

    if (error || !data) {
      return NextResponse.json({ photos: [] });
    }

    const photos = data as Array<{
      photo_id: string;
      url: string;
      storage_path: string;
      is_portrait: boolean;
      captured_at: string;
    }>;

    if (photos.length === 0) {
      return NextResponse.json({ photos: [] });
    }

    // Generate signed URLs using service role (bypasses storage RLS)
    if (serviceRoleKey) {
      const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const paths = photos.map((p) => p.storage_path);
      const { data: signedData } = await serviceClient
        .storage.from('memory_groups')
        .createSignedUrls(paths, 7200); // 2-hour expiry

      if (signedData) {
        const signedPhotos = photos.map((photo, i) => ({
          ...photo,
          url: signedData[i]?.signedUrl || photo.url,
        }));
        return NextResponse.json({ photos: signedPhotos });
      }
    }

    return NextResponse.json({ photos });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
