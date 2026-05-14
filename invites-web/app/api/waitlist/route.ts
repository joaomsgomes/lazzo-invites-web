import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════
// POST /api/waitlist
//
// Captures emails from the landing-page "Remind me on Launch" CTA
// and persists them to public.waitlist_emails via the service role.
// RLS on that table denies anon/authenticated, so all writes flow
// through this route.
// ═══════════════════════════════════════════════════════════════════

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const raw = (body as { email?: unknown } | null)?.email;
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }

  if (!serviceRoleKey) {
    console.error('[waitlist] SUPABASE_SERVICE_ROLE_KEY missing');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userAgent = req.headers.get('user-agent') ?? null;
  const referrer = req.headers.get('referer') ?? null;

  const { error } = await supabase.from('waitlist_emails').insert({
    email,
    source: 'landing',
    user_agent: userAgent,
    referrer,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    console.error('[waitlist] insert failed', error);
    return NextResponse.json({ error: 'Could not save email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
