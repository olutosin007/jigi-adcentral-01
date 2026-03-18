-- Nudge Log Table
-- Tracks nudge reminders sent to prevent duplicate sends

CREATE TABLE IF NOT EXISTS nudge_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    nudge_type TEXT NOT NULL CHECK (nudge_type IN (
        'pending_24h',
        'pending_48h',
        'opened_no_action'
    )),
    
    email_sent BOOLEAN DEFAULT FALSE,
    notification_created BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_nudge_log_asset ON nudge_log(asset_id);
CREATE INDEX idx_nudge_log_user ON nudge_log(user_id);
CREATE INDEX idx_nudge_log_created ON nudge_log(created_at DESC);
CREATE INDEX idx_nudge_log_type ON nudge_log(nudge_type);
CREATE INDEX idx_nudge_log_asset_date ON nudge_log(asset_id, created_at);

-- Enable RLS
ALTER TABLE nudge_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view nudge logs for assets in their org
CREATE POLICY "Users can view nudge logs for org assets"
ON nudge_log FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- System can insert nudge logs (via service role)
CREATE POLICY "Service can insert nudge logs"
ON nudge_log FOR INSERT
WITH CHECK (true);
