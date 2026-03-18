-- Unified Creative Pipeline: Add source and original_filename to creative_assets
-- Run: supabase db push or execute in Supabase SQL Editor

ALTER TABLE creative_assets
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai' CHECK (source IN ('ai', 'uploaded'));

ALTER TABLE creative_assets
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Backfill existing rows
UPDATE creative_assets SET source = 'ai' WHERE source IS NULL;

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_creative_assets_source ON creative_assets(source);
