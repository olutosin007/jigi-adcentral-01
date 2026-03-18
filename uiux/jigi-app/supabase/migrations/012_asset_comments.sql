-- Asset Comments Table
-- Supports threaded comments on creative assets

CREATE TABLE IF NOT EXISTS asset_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES asset_comments(id),
    
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_asset_comments_asset ON asset_comments(asset_id);
CREATE INDEX idx_asset_comments_user ON asset_comments(user_id);
CREATE INDEX idx_asset_comments_parent ON asset_comments(parent_comment_id);
CREATE INDEX idx_asset_comments_created ON asset_comments(created_at DESC);

-- Enable RLS
ALTER TABLE asset_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view comments for assets in their org's campaigns
CREATE POLICY "Users can view comments for org assets"
ON asset_comments FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Agency users can view comments for connected brand assets
CREATE POLICY "Agencies can view comments for connected brand assets"
ON asset_comments FOR SELECT
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

-- Users can insert comments for assets they can access
CREATE POLICY "Users can insert comments for accessible assets"
ON asset_comments FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Agency users can insert comments for connected brand assets
CREATE POLICY "Agencies can insert comments for connected brand assets"
ON asset_comments FOR INSERT
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

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON asset_comments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can resolve comments on assets in their org
CREATE POLICY "Users can resolve comments on org assets"
ON asset_comments FOR UPDATE
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON asset_comments FOR DELETE
USING (user_id = auth.uid());
