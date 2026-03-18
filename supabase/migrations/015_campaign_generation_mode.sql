-- Add generation_mode to campaigns to align UI/dashboard queries.
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS generation_mode TEXT
CHECK (generation_mode IN ('brand_grounded', 'idea_first'));

-- Backfill from journey_mode where available.
UPDATE campaigns
SET generation_mode = CASE
  WHEN journey_mode = 'idea_first' THEN 'idea_first'
  ELSE 'brand_grounded'
END
WHERE generation_mode IS NULL;

-- Keep new records consistent.
ALTER TABLE campaigns
ALTER COLUMN generation_mode SET DEFAULT 'brand_grounded';

-- Ensure existing rows have a value.
ALTER TABLE campaigns
ALTER COLUMN generation_mode SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_generation_mode
ON campaigns(generation_mode);
