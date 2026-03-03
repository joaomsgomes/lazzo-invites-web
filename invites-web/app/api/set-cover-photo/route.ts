import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════
// POST /api/set-cover-photo — Set/remove cover photo for an event
//
// Body (JSON):
//   - token: invite token (required)
//   - photoId: photo ID to set as cover (null to remove cover)
//
// Auth: token-gated (validates invite token → gets event_id)
// Uses service role to bypass RLS.
// ═══════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { token, photoId } = body as { token?: string; photoId?: string | null };

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
    }

    // 2. If photoId provided, verify it belongs to this event
    if (photoId) {
      const { data: photoRow, error: photoError } = await serviceClient
        .from('event_photos')
        .select('id')
        .eq('id', photoId)
        .eq('event_id', linkData.event_id)
        .single();

      if (photoError || !photoRow) {
        return NextResponse.json({ error: 'Photo not found for this event' }, { status: 404 });
      }
    }

    // 3. Update cover_photo_id on the event
    const { error: updateError } = await serviceClient
      .from('events')
      .update({ cover_photo_id: photoId || null })
      .eq('id', linkData.event_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update cover' }, { status: 500 });
    }

    return NextResponse.json({ success: true, coverPhotoId: photoId || null });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
