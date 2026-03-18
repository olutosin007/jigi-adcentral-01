-- Migration 016: Image routing metadata + quota tracking
-- Free-tier-first routing observability and guardrail backing table.

ALTER TABLE generation_log
  ADD COLUMN IF NOT EXISTS image_provider TEXT CHECK (
    image_provider IN ('google_imagen', 'replicate', 'azure_openai')
  ),
  ADD COLUMN IF NOT EXISTS image_tier TEXT CHECK (
    image_tier IN ('draft', 'refine', 'final')
  ),
  ADD COLUMN IF NOT EXISTS routing_reason TEXT CHECK (
    routing_reason IN ('default', 'retry', 'quota_exhausted', 'budget_guard')
  ),
  ADD COLUMN IF NOT EXISTS cost_bucket TEXT CHECK (
    cost_bucket IN ('free', 'paid_fallback')
  );

CREATE INDEX IF NOT EXISTS idx_generation_log_image_tier_created_at
  ON generation_log(image_tier, created_at);

CREATE INDEX IF NOT EXISTS idx_generation_log_cost_bucket_created_at
  ON generation_log(cost_bucket, created_at);

CREATE TABLE IF NOT EXISTS image_routing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  brand_id UUID REFERENCES brands(id),
  campaign_id UUID REFERENCES campaigns(id),
  image_provider TEXT CHECK (image_provider IN ('google_imagen', 'replicate', 'azure_openai')),
  provider_model TEXT,
  image_tier TEXT NOT NULL CHECK (image_tier IN ('draft', 'refine', 'final')),
  routing_reason TEXT NOT NULL CHECK (
    routing_reason IN ('default', 'retry', 'quota_exhausted', 'budget_guard')
  ),
  cost_bucket TEXT CHECK (cost_bucket IN ('free', 'paid_fallback')),
  route_attempt INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_routing_events_created_at
  ON image_routing_events(created_at);

CREATE INDEX IF NOT EXISTS idx_image_routing_events_user_daily
  ON image_routing_events(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_image_routing_events_campaign_daily
  ON image_routing_events(campaign_id, created_at);

CREATE INDEX IF NOT EXISTS idx_image_routing_events_tier_daily
  ON image_routing_events(image_tier, created_at);

CREATE INDEX IF NOT EXISTS idx_image_routing_events_paid_daily
  ON image_routing_events(cost_bucket, created_at);

ALTER TABLE image_routing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own image routing events" ON image_routing_events;
CREATE POLICY "Users can view own image routing events"
ON image_routing_events FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view org image routing events" ON image_routing_events;
CREATE POLICY "Users can view org image routing events"
ON image_routing_events FOR SELECT
USING (
  brand_id IN (
    SELECT id
    FROM brands
    WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Service can insert image routing events" ON image_routing_events;
CREATE POLICY "Service can insert image routing events"
ON image_routing_events FOR INSERT
WITH CHECK (true);
