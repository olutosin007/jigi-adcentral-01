-- Migration: 005_agency_brand_access
-- Create agency-brand access table for agency connections

CREATE TABLE IF NOT EXISTS agency_brand_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{"can_generate": true, "can_view_approved": true}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    invited_email TEXT,
    granted_at TIMESTAMPTZ,
    granted_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agency_organisation_id, brand_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agency_brand_access_agency ON agency_brand_access(agency_organisation_id);
CREATE INDEX IF NOT EXISTS idx_agency_brand_access_brand ON agency_brand_access(brand_id);
CREATE INDEX IF NOT EXISTS idx_agency_brand_access_status ON agency_brand_access(status);

-- Enable RLS
ALTER TABLE agency_brand_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Agencies can view their own access records
CREATE POLICY "Agencies can view own access records"
ON agency_brand_access FOR SELECT
USING (agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

-- Brands can view access records for their brands
CREATE POLICY "Brands can view access to their brands"
ON agency_brand_access FOR SELECT
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Brands can create access records (invite agencies)
CREATE POLICY "Brands can invite agencies"
ON agency_brand_access FOR INSERT
WITH CHECK (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Brands can update access records (accept/revoke)
CREATE POLICY "Brands can manage access"
ON agency_brand_access FOR UPDATE
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Brands can delete access records
CREATE POLICY "Brands can revoke access"
ON agency_brand_access FOR DELETE
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Additional policy: Agencies can view brands they have access to
CREATE POLICY "Agencies can view accessible brands"
ON brands FOR SELECT
USING (
    id IN (
        SELECT brand_id FROM agency_brand_access 
        WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND status = 'active'
    )
);
