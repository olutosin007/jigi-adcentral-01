-- Migration: 006_campaigns
-- Create campaigns table

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    
    name TEXT NOT NULL,
    brief JSONB DEFAULT '{}',
    -- Structure: { 
    --   objective: "", 
    --   audience: "", 
    --   channels: [], 
    --   requirements: "" 
    -- }
    
    journey_mode TEXT DEFAULT 'brand_first' CHECK (journey_mode IN ('brand_first', 'idea_first')),
    seed_idea TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Add updated_at trigger
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view campaigns for their org brands"
ON campaigns FOR SELECT
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can create campaigns for their org brands"
ON campaigns FOR INSERT
WITH CHECK (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can update campaigns for their org brands"
ON campaigns FOR UPDATE
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can delete campaigns for their org brands"
ON campaigns FOR DELETE
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Agency access policy
CREATE POLICY "Agencies can view campaigns for connected brands"
ON campaigns FOR SELECT
USING (
    brand_id IN (
        SELECT brand_id FROM agency_brand_access 
        WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND status = 'active'
    )
);

CREATE POLICY "Agencies can create campaigns for connected brands"
ON campaigns FOR INSERT
WITH CHECK (
    brand_id IN (
        SELECT brand_id FROM agency_brand_access 
        WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND status = 'active'
        AND (permissions->>'can_generate')::boolean = true
    )
);
