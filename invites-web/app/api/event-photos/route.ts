import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════
// GET /api/event-photos?token=xxx — Client-side photo fetch
//
// Returns event photos with signed URLs.
// Uses direct table queries with service role (no RPC dependency).
// Token-gated: validates invite token → gets event_id → queries photos.
// ═══════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  if (!serviceRoleKey) {
    return NextResponse.json({ photos: [] });
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
      return NextResponse.json({ photos: [] });
    }

    // 2. Query event_photos directly
    const { data: rows, error: photosError } = await serviceClient
      .from('event_photos')
      .select('id, url, storage_path, is_portrait, captured_at')
      .eq('event_id', linkData.event_id)
      .order('captured_at', { ascending: false })
      .limit(50);

    // 2b. Get cover_photo_id from events table
    const { data: eventRow } = await serviceClient
      .from('events')
      .select('cover_photo_id')
      .eq('id', linkData.event_id)
      .single();

    const coverPhotoId = eventRow?.cover_photo_id ?? null;

    if (photosError || !rows || rows.length === 0) {
      return NextResponse.json({ photos: [], coverPhotoId });
    }

    // 3. Generate signed URLs
    const paths = rows.map((r: Record<string, unknown>) => r.storage_path as string);
    const { data: signedData } = await serviceClient
      .storage.from('memory_groups')
      .createSignedUrls(paths, 7200);

    const photos = rows.map((row: Record<string, unknown>, i: number) => ({
      photo_id: row.id as string,
      url: (signedData?.[i]?.signedUrl || row.url) as string,
      storage_path: row.storage_path as string,
      is_portrait: row.is_portrait as boolean,
      captured_at: row.captured_at as string,
    }));

    return NextResponse.json({ photos, coverPhotoId });
  } catch {
    return NextResponse.json({ photos: [], coverPhotoId: null });
  }
}
