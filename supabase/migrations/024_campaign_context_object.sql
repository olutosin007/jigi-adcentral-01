-- Migration: 024_campaign_context_object
-- Campaign Context Object (CCO) storage and asset lineage
-- PRD: 01-prd-ctxt-cco-schema

-- Add campaign_context JSONB to campaigns (compiled CCO from brief)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS campaign_context JSONB DEFAULT NULL;

-- Add cco_version for quick drift detection (denormalized from campaign_context.version)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS cco_version INTEGER DEFAULT 1;

-- Index for campaigns with CCO (optional, for analytics)
CREATE INDEX IF NOT EXISTS idx_campaigns_cco_version
ON campaigns(cco_version)
WHERE campaign_context IS NOT NULL;

-- GIN index for JSONB queries on campaign_context (e.g. by brand_id inside)
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_context
ON campaigns USING GIN (campaign_context)
WHERE campaign_context IS NOT NULL;

-- Asset lineage columns on creative_assets
ALTER TABLE creative_assets
ADD COLUMN IF NOT EXISTS cco_version INTEGER;

ALTER TABLE creative_assets
ADD COLUMN IF NOT EXISTS bio_version INTEGER;

ALTER TABLE creative_assets
ADD COLUMN IF NOT EXISTS generation_timestamp TIMESTAMPTZ;

ALTER TABLE creative_assets
ADD COLUMN IF NOT EXISTS validation_scores JSONB DEFAULT '{}';

-- Index for drift detection: find assets by cco_version
CREATE INDEX IF NOT EXISTS idx_creative_assets_cco_version
ON creative_assets(campaign_id, cco_version)
WHERE cco_version IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN campaigns.campaign_context IS 'Compiled Campaign Context Object (CCO) from brief. Contains strategic_context, audience_context, channel_constraints, tone_profile, hard_constraints, reference_assets.';
COMMENT ON COLUMN campaigns.cco_version IS 'Increments on every brief edit. Used for drift detection.';
COMMENT ON COLUMN creative_assets.cco_version IS 'CCO version active when this asset was generated.';
COMMENT ON COLUMN creative_assets.bio_version IS 'BIO version active when this asset was generated.';
COMMENT ON COLUMN creative_assets.generation_timestamp IS 'When this asset was generated.';
COMMENT ON COLUMN creative_assets.validation_scores IS 'Snapshot of compliance scores at generation time.';
