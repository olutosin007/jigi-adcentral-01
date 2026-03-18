-- Approval Actions Table
-- Records all approval decisions made on assets

CREATE TABLE IF NOT EXISTS approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes')),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_approval_actions_asset ON approval_actions(asset_id);
CREATE INDEX idx_approval_actions_user ON approval_actions(user_id);
CREATE INDEX idx_approval_actions_created ON approval_actions(created_at DESC);

-- Enable RLS
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view approval actions for assets in their org's campaigns
CREATE POLICY "Users can view approval actions for org assets"
ON approval_actions FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Agency users can view approval actions for connected brand assets
CREATE POLICY "Agencies can view approval actions for connected brand assets"
ON approval_actions FOR SELECT
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

-- Users can insert approval actions for assets they can access
CREATE POLICY "Users can insert approval actions for accessible assets"
ON approval_actions FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Agency users can insert approval actions for connected brand assets
CREATE POLICY "Agencies can insert approval actions for connected brand assets"
ON approval_actions FOR INSERT
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
