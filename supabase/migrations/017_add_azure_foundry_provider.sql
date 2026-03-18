-- Migration 017: Add azure_foundry to image_provider enum values
-- Supports Azure AI Foundry FLUX.2-flex as image generation provider.

DO $$
DECLARE
  _con text;
BEGIN
  SELECT c.conname INTO _con
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  WHERE c.conrelid = 'public.generation_log'::regclass
    AND c.contype = 'c'
    AND a.attname = 'image_provider';
  IF _con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE generation_log DROP CONSTRAINT %I', _con);
  END IF;
END $$;

ALTER TABLE generation_log
  ADD CONSTRAINT generation_log_image_provider_check
  CHECK (image_provider IS NULL OR image_provider IN ('google_imagen', 'replicate', 'azure_openai', 'azure_foundry'));

DO $$
DECLARE
  _con text;
BEGIN
  SELECT c.conname INTO _con
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  WHERE c.conrelid = 'public.image_routing_events'::regclass
    AND c.contype = 'c'
    AND a.attname = 'image_provider';
  IF _con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE image_routing_events DROP CONSTRAINT %I', _con);
  END IF;
END $$;

ALTER TABLE image_routing_events
  ADD CONSTRAINT image_routing_events_image_provider_check
  CHECK (image_provider IS NULL OR image_provider IN ('google_imagen', 'replicate', 'azure_openai', 'azure_foundry'));
