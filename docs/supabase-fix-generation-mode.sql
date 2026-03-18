-- Fix: Add campaigns.generation_mode (required for image generation API)
-- Run this in Supabase SQL Editor (Project: jigi-adaptation / jigi-adstation).
-- Safe to run multiple times (idempotent).

-- 1. Add column
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS generation_mode TEXT
CHECK (generation_mode IN ('brand_grounded', 'idea_first'));

-- 2. Backfill existing rows (from journey_mode if present, else default)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'campaigns' AND column_name = 'journey_mode'
  ) THEN
    UPDATE campaigns
    SET generation_mode = CASE
      WHEN journey_mode = 'idea_first' THEN 'idea_first'
      ELSE 'brand_grounded'
    END
    WHERE generation_mode IS NULL;
  ELSE
    UPDATE campaigns SET generation_mode = 'brand_grounded' WHERE generation_mode IS NULL;
  END IF;
END $$;

-- 3. Default for new rows
ALTER TABLE campaigns
ALTER COLUMN generation_mode SET DEFAULT 'brand_grounded';

-- 4. Enforce not null (only if no rows left with NULL)
UPDATE campaigns SET generation_mode = 'brand_grounded' WHERE generation_mode IS NULL;
ALTER TABLE campaigns
ALTER COLUMN generation_mode SET NOT NULL;

-- 5. Index for queries
CREATE INDEX IF NOT EXISTS idx_campaigns_generation_mode ON campaigns(generation_mode);
