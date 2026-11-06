-- Migration 037: allow fal as an image provider (Generation Studio fal lane).
-- Idempotent — drops whichever CHECK currently guards image_provider.

DO $$
DECLARE
  _tbl text;
  _con text;
BEGIN
  FOREACH _tbl IN ARRAY ARRAY['generation_log', 'image_routing_events'] LOOP
    FOR _con IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      WHERE c.conrelid = format('public.%I', _tbl)::regclass
        AND c.contype = 'c'
        AND a.attname = 'image_provider'
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', _tbl, _con);
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE generation_log
  ADD CONSTRAINT generation_log_image_provider_check
  CHECK (image_provider IS NULL OR image_provider IN (
    'google_gemini', 'kling', 'fal', 'replicate', 'azure_openai', 'azure_foundry', 'google_imagen'
  ));

ALTER TABLE image_routing_events
  ADD CONSTRAINT image_routing_events_image_provider_check
  CHECK (image_provider IS NULL OR image_provider IN (
    'google_gemini', 'kling', 'fal', 'replicate', 'azure_openai', 'azure_foundry', 'google_imagen'
  ));
