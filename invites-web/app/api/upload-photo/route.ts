import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════
// POST /api/upload-photo — Server-side photo upload
//
// Accepts a photo file + invite token.
// Auth: either a valid JWT (Authorization header) OR a verified email
// (from localStorage session — user previously completed OTP within 48h).
// Uses the service role key to bypass RLS for storage + event_photos.
//
// Body: FormData with fields:
//   - file: the image file (Blob)
//   - token: the invite token
//   - isPortrait: "true" | "false"
//   - email: (optional) fallback auth when JWT is unavailable
//   - userName: (optional) display name for the user
//
// Headers:
//   - Authorization: Bearer <access_token> (optional if email provided)
// ═══════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  // 1. Check service role key is configured
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server not configured for uploads' },
      { status: 500 }
    );
  }

  try {
    // 2. Create service role client (bypasses all RLS)
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const token = formData.get('token') as string | null;
    const isPortrait = formData.get('isPortrait') === 'true';
    const fallbackEmail = formData.get('email') as string | null;
    const userName = formData.get('userName') as string | null;

    if (!file || !token) {
      return NextResponse.json({ error: 'Missing file or token' }, { status: 400 });
    }

    // 4. Resolve user identity — try JWT first, fall back to email lookup
    let userId: string | null = null;
    let userEmail: string | null = null;

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.slice(7);
      try {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });
        const { data: { user } } = await userClient.auth.getUser(accessToken);
        if (user) {
          userId = user.id;
          userEmail = user.email ?? null;
        }
      } catch {
        // JWT invalid/expired — fall through to email lookup
      }
    }

    // Fallback: look up user by email (valid when user previously completed OTP)
    if (!userId && fallbackEmail) {
      // Use service role to query public.users by email
      const { data: userRow } = await serviceClient
        .from('users')
        .select('id')
        .eq('email', fallbackEmail.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (userRow?.id) {
        userId = userRow.id;
        userEmail = fallbackEmail;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 5. Validate token and get event_id
    const { data: tokenData, error: tokenError } = await serviceClient
      .from('event_invite_links')
      .select('event_id')
      .eq('token', token)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData?.event_id) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 403 });
    }

    const eventId = tokenData.event_id as string;

    // 6. Ensure public.users row exists (FK requirement for event_photos)
    await serviceClient
      .from('users')
      .upsert(
        { id: userId, email: userEmail ?? fallbackEmail, name: userName },
        { onConflict: 'id', ignoreDuplicates: true }
      );

    // 7. Ensure user is a participant (idempotent insert)
    await serviceClient
      .from('event_participants')
      .upsert(
        { pevent_id: eventId, user_id: userId, rsvp: 'pending' },
        { onConflict: 'pevent_id,user_id', ignoreDuplicates: true }
      );

    // 8. Upload file to storage
    const uuid = crypto.randomUUID();
    const ext = file.type === 'image/webp' ? 'webp' : 'jpg';
    const storagePath = `${eventId}/${eventId}/${userId}/${uuid}.${ext}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await serviceClient.storage
      .from('memory_groups')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 9. Create event_photos record
    const { data: photoData, error: dbError } = await serviceClient
      .from('event_photos')
      .insert({
        event_id: eventId,
        url: storagePath,
        storage_path: storagePath,
        uploader_id: userId,
        is_portrait: isPortrait,
        captured_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (dbError) {
      // Cleanup storage on DB failure
      await serviceClient.storage.from('memory_groups').remove([storagePath]);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    // 10. Generate signed URL for immediate display
    const { data: signedData } = await serviceClient.storage
      .from('memory_groups')
      .createSignedUrl(storagePath, 7200); // 2 hours

    return NextResponse.json({
      success: true,
      photoId: photoData?.id,
      storagePath,
      signedUrl: signedData?.signedUrl || '',
      isPortrait,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
