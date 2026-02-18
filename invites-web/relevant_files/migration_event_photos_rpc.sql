-- Migration: Add RPC to fetch event photos by invite token
-- Apply this to your Supabase project via SQL Editor or migration

-- This function validates the invite token and returns event photos
-- SECURITY DEFINER bypasses RLS so the anon key can call it from the web
CREATE OR REPLACE FUNCTION public.get_event_photos_by_invite_token(p_token text)
RETURNS TABLE(
  photo_id uuid,
  url text,
  storage_path text,
  is_portrait boolean,
  captured_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  -- Validate token (same logic as get_event_by_invite_token)
  SELECT eil.event_id INTO v_event_id
  FROM public.event_invite_links eil
  WHERE eil.token = p_token
    AND eil.revoked_at IS NULL
    AND eil.expires_at > now();

  -- If invalid token, return empty (don't raise exception)
  IF v_event_id IS NULL THEN
    RETURN;
  END IF;

  -- Return photos ordered by most recent
  RETURN QUERY
  SELECT
    ep.id AS photo_id,
    ep.url,
    ep.storage_path,
    ep.is_portrait,
    ep.captured_at
  FROM public.event_photos ep
  WHERE ep.event_id = v_event_id
  ORDER BY ep.captured_at DESC
  LIMIT 50;
END;
$$;

COMMENT ON FUNCTION public.get_event_photos_by_invite_token(text)
IS 'Returns event photos for the web invite page. Token-gated. Used by Next.js for living/recap photo grids.';
