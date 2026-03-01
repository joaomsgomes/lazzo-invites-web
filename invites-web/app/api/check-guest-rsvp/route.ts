import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════
// GET /api/check-guest-rsvp?token=xxx&email=xxx
//
// Checks if a web guest has already submitted an RSVP for this event.
// Returns the existing RSVP data if found.
// Uses service role to bypass RLS.
// ═══════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const email = req.nextUrl.searchParams.get('email');

  if (!token || !email) {
    return NextResponse.json({ error: 'Missing token or email' }, { status: 400 });
  }

  if (!serviceRoleKey) {
    return NextResponse.json({ exists: false });
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
      return NextResponse.json({ exists: false });
    }

    // 2. Check for existing RSVP with this email
    const { data: rsvp, error: rsvpError } = await serviceClient
      .from('event_guest_rsvps')
      .select('id, guest_name, rsvp, updated_at')
      .eq('event_id', linkData.event_id)
      .eq('guest_phone', email.trim().toLowerCase())
      .limit(1)
      .maybeSingle();

    if (rsvpError || !rsvp) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      guest: {
        name: rsvp.guest_name,
        rsvp: rsvp.rsvp,
        votedAt: rsvp.updated_at,
      },
    });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
