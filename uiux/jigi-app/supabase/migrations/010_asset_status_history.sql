-- Asset Status History Table
-- Tracks all status changes for audit trail and review context

CREATE TABLE IF NOT EXISTS asset_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    from_status TEXT,
    to_status TEXT NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_status_history_asset ON asset_status_history(asset_id);
CREATE INDEX idx_status_history_created ON asset_status_history(created_at DESC);
CREATE INDEX idx_status_history_user ON asset_status_history(user_id);

-- Enable RLS
ALTER TABLE asset_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view status history for assets in campaigns of their org's brands
CREATE POLICY "Users can view status history for org assets"
ON asset_status_history FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Agency users can view status history for assets of connected brands
CREATE POLICY "Agencies can view status history for connected brand assets"
ON asset_status_history FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        JOIN brand_agency_connections bac ON b.id = bac.brand_id
        WHERE bac.agency_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND bac.status = 'active'
    )
);

-- Users can insert status history for assets they have access to
CREATE POLICY "Users can insert status history for accessible assets"
ON asset_status_history FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Agency users can insert status history for connected brand assets
CREATE POLICY "Agencies can insert status history for connected brand assets"
ON asset_status_history FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        JOIN brand_agency_connections bac ON b.id = bac.brand_id
        WHERE bac.agency_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND bac.status = 'active'
    )
);
