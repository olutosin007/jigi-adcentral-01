-- Migration: 004_brands
-- Create brands table for brand profiles

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    
    -- Identity (JSONB)
    identity JSONB DEFAULT '{}',
    -- Structure: { colours: { primary, secondary, accent, neutral }, fonts: { heading, body }, logo_url: "" }
    
    -- Voice (JSONB)
    voice JSONB DEFAULT '{}',
    -- Structure: { tone: [], preferred_words: [], avoided_words: [], samples: [] }
    
    -- Strategy (optional, JSONB)
    strategy JSONB DEFAULT '{}',
    -- Structure: { positioning: "", differentiators: [], competitors: [] }
    
    -- Governance (JSONB)
    governance JSONB DEFAULT '{}',
    -- Structure: { approval_workflow: [], backup_approvers: [] }
    
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    journey_mode TEXT DEFAULT 'brand_first' CHECK (journey_mode IN ('brand_first', 'idea_first')),
    brand_profile_status TEXT DEFAULT 'starter' CHECK (brand_profile_status IN ('starter', 'partial', 'complete')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brands_organisation_id ON brands(organisation_id);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(brand_profile_status);

-- Add updated_at trigger
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own org brands"
ON brands FOR SELECT
USING (organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create brands for own org"
ON brands FOR INSERT
WITH CHECK (organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own org brands"
ON brands FOR UPDATE
USING (organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org brands"
ON brands FOR DELETE
USING (organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));
