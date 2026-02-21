-- ============================================================
-- Migration: Recap OTP Auth Gate + RSVP Deduplication Fix
-- Date: 2026-02-21
-- ============================================================

-- ─── 1. New RPC: verify_event_access_by_email ───────────────
-- Used by the web recap auth gate to check if an email belongs
-- to an event participant (app user or web guest).

CREATE OR REPLACE FUNCTION public.verify_event_access_by_email(
  p_token text,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
  v_found boolean;
BEGIN
  -- Validate invite token
  SELECT eil.event_id INTO v_event_id
  FROM public.event_invite_links eil
  WHERE eil.token = p_token
    AND eil.revoked_at IS NULL
    AND eil.expires_at > now();

  IF v_event_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check app participants (user email match)
  SELECT EXISTS(
    SELECT 1
    FROM public.event_participants ep
    JOIN public.users u ON u.id = ep.user_id
    WHERE ep.pevent_id = v_event_id
      AND lower(u.email) = lower(p_email)
  ) INTO v_found;

  IF v_found THEN RETURN TRUE; END IF;

  -- Check web guests (guest_phone stores email)
  SELECT EXISTS(
    SELECT 1
    FROM public.event_guest_rsvps egr
    WHERE egr.event_id = v_event_id
      AND lower(egr.guest_phone) = lower(p_email)
  ) INTO v_found;

  RETURN v_found;
END;
$$;

COMMENT ON FUNCTION public.verify_event_access_by_email(text, text)
IS 'Checks if an email belongs to an event participant (app user or web guest). Used by the web recap auth gate. Token-gated.';


-- ─── 2. Fix RSVP deduplication ──────────────────────────────
-- The current upsert uses ON CONFLICT on the PK (id uuid), which
-- never triggers because each insert generates a new UUID.
-- Fix: add a unique index on (event_id, guest_phone) and update
-- the upsert to conflict on it.

-- 2a. Clean up duplicate rows (keep most recent per event+email)
DELETE FROM public.event_guest_rsvps a
USING public.event_guest_rsvps b
WHERE a.event_id = b.event_id
  AND a.guest_phone = b.guest_phone
  AND a.guest_phone IS NOT NULL
  AND a.updated_at < b.updated_at;

-- 2b. Add unique index for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_egr_event_phone_unique
ON public.event_guest_rsvps (event_id, guest_phone)
WHERE guest_phone IS NOT NULL;

-- 2c. Replace the upsert RPC with a fixed version
CREATE OR REPLACE FUNCTION public.upsert_event_guest_rsvp_by_token(
  p_token text,
  p_guest_name text,
  p_rsvp text DEFAULT 'going'::text,
  p_plus_one integer DEFAULT 0,
  p_guest_phone text DEFAULT NULL::text
)
RETURNS TABLE(event_id uuid, event_name text, rsvp_id uuid)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
  v_event_name text;
  v_rsvp_id uuid;
BEGIN
  -- Validate token
  SELECT eil.event_id INTO v_event_id
  FROM public.event_invite_links eil
  WHERE eil.token = p_token
    AND eil.revoked_at IS NULL
    AND eil.expires_at > now();

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite link';
  END IF;

  -- Get event name
  SELECT e.name INTO v_event_name FROM public.events e WHERE e.id = v_event_id;

  -- Upsert guest RSVP
  -- If guest_phone (email) is provided, dedup on (event_id, guest_phone)
  -- Otherwise fall back to insert (no dedup possible without email)
  IF p_guest_phone IS NOT NULL THEN
    INSERT INTO public.event_guest_rsvps (event_id, invite_token, guest_name, rsvp, plus_one, guest_phone)
    VALUES (v_event_id, p_token, p_guest_name, p_rsvp, p_plus_one, p_guest_phone)
    ON CONFLICT (event_id, guest_phone) WHERE guest_phone IS NOT NULL
    DO UPDATE SET
      rsvp = EXCLUDED.rsvp,
      guest_name = EXCLUDED.guest_name,
      plus_one = EXCLUDED.plus_one,
      invite_token = EXCLUDED.invite_token,
      updated_at = now()
    RETURNING id INTO v_rsvp_id;
  ELSE
    INSERT INTO public.event_guest_rsvps (event_id, invite_token, guest_name, rsvp, plus_one, guest_phone)
    VALUES (v_event_id, p_token, p_guest_name, p_rsvp, p_plus_one, p_guest_phone)
    RETURNING id INTO v_rsvp_id;
  END IF;

  -- Track analytics
  INSERT INTO public.invite_analytics (event_id, invite_token, action, metadata)
  VALUES (v_event_id, p_token, 'rsvp_web', jsonb_build_object('guest_name', p_guest_name, 'rsvp', p_rsvp));

  RETURN QUERY SELECT v_event_id, v_event_name, v_rsvp_id;
END;
$$;

COMMENT ON FUNCTION public.upsert_event_guest_rsvp_by_token(text, text, text, integer, text)
IS 'Allows non-app guests to RSVP to an event via the web landing page. Deduplicates by (event_id, guest_phone/email) when email is provided.';
