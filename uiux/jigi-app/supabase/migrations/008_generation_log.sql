-- Migration: 008_generation_log
-- Create generation_log table for AI generation tracking

CREATE TABLE IF NOT EXISTS generation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    brand_id UUID REFERENCES brands(id),
    campaign_id UUID REFERENCES campaigns(id),
    
    type TEXT NOT NULL,
    model TEXT NOT NULL,
    generation_mode TEXT NOT NULL CHECK (generation_mode IN ('brand_grounded', 'idea_first')),
    prompt_hash TEXT,
    
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    latency_ms INTEGER,
    tokens_used INTEGER,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_generation_log_user_id ON generation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_log_brand_id ON generation_log(brand_id);
CREATE INDEX IF NOT EXISTS idx_generation_log_campaign_id ON generation_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_generation_log_created_at ON generation_log(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_log_status ON generation_log(status);

-- Enable RLS
ALTER TABLE generation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own generation logs"
ON generation_log FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view org generation logs"
ON generation_log FOR SELECT
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can insert generation logs"
ON generation_log FOR INSERT
WITH CHECK (user_id = auth.uid());
