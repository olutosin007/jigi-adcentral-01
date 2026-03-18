-- Migration: 007_creative_assets
-- Create creative_assets table for generated content

CREATE TABLE IF NOT EXISTS creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    
    type TEXT NOT NULL CHECK (type IN ('concept', 'copy', 'image')),
    generation_mode TEXT NOT NULL CHECK (generation_mode IN ('brand_grounded', 'idea_first')),
    content JSONB NOT NULL,
    -- Structure varies by type:
    -- concept: { theme: "", headlines: [], visual_direction: "", rationale: "" }
    -- copy: { headline: "", body: "", cta: "" }
    -- image: { url: "", prompt_used: "", model: "" }
    
    version INTEGER DEFAULT 1,
    parent_asset_id UUID REFERENCES creative_assets(id),
    
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 
        'agency_review', 
        'submitted', 
        'brand_review', 
        'changes_requested', 
        'approved', 
        'rejected'
    )),
    
    compliance_check JSONB DEFAULT '{}',
    -- Structure: { passed: bool, checks: [{ name: "", status: "", message: "" }] }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_creative_assets_campaign_id ON creative_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_type ON creative_assets(type);
CREATE INDEX IF NOT EXISTS idx_creative_assets_status ON creative_assets(status);
CREATE INDEX IF NOT EXISTS idx_creative_assets_parent ON creative_assets(parent_asset_id);

-- Add updated_at trigger
CREATE TRIGGER update_creative_assets_updated_at
    BEFORE UPDATE ON creative_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies (inherit from campaign access)
CREATE POLICY "Users can view assets for accessible campaigns"
ON creative_assets FOR SELECT
USING (
    campaign_id IN (
        SELECT c.id FROM campaigns c
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can create assets for accessible campaigns"
ON creative_assets FOR INSERT
WITH CHECK (
    campaign_id IN (
        SELECT c.id FROM campaigns c
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can update assets for accessible campaigns"
ON creative_assets FOR UPDATE
USING (
    campaign_id IN (
        SELECT c.id FROM campaigns c
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Agency access
CREATE POLICY "Agencies can view assets for connected brands"
ON creative_assets FOR SELECT
USING (
    campaign_id IN (
        SELECT c.id FROM campaigns c
        WHERE c.brand_id IN (
            SELECT brand_id FROM agency_brand_access 
            WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
            AND status = 'active'
        )
    )
);

CREATE POLICY "Agencies can create assets for connected brands"
ON creative_assets FOR INSERT
WITH CHECK (
    campaign_id IN (
        SELECT c.id FROM campaigns c
        WHERE c.brand_id IN (
            SELECT brand_id FROM agency_brand_access 
            WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
            AND status = 'active'
            AND (permissions->>'can_generate')::boolean = true
        )
    )
);
