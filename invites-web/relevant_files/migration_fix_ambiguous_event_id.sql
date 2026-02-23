-- ============================================================
-- FIX: "column reference event_id is ambiguous" in upsert_event_guest_rsvp_by_token
--
-- Root cause: RETURNS TABLE(event_id uuid, ...) creates a PL/pgSQL variable
-- named `event_id`. The ON CONFLICT (event_id, guest_phone) clause is ambiguous
-- because PostgreSQL sees both the output variable and the table column.
--
-- Fix: Add `#variable_conflict use_column` directive so unqualified column
-- references inside SQL statements prefer the table column over the PL/pgSQL variable.
-- ============================================================

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
#variable_conflict use_column
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
