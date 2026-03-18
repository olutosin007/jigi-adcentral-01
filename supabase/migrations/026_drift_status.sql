-- Migration: 026_drift_status
-- PRD 10: Drift Detection — drift_status on assets

ALTER TABLE creative_assets
ADD COLUMN IF NOT EXISTS drift_status TEXT DEFAULT 'none';

-- Constrain to valid values
ALTER TABLE creative_assets
ADD CONSTRAINT chk_drift_status
CHECK (drift_status IS NULL OR drift_status IN ('none', 'review_required'));

CREATE INDEX IF NOT EXISTS idx_creative_assets_drift_status
ON creative_assets(campaign_id, drift_status)
WHERE drift_status = 'review_required';

COMMENT ON COLUMN creative_assets.drift_status IS 'PRD 10: Drift indicator. review_required when brief changed after asset was generated.';
