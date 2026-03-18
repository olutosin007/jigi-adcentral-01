-- Migration: 022_agency_campaigns_update_policy
-- Allow agencies to update campaigns for brands they have access to (e.g. archive/unarchive)

CREATE POLICY "Agencies can update campaigns for connected brands"
ON campaigns FOR UPDATE
USING (
    brand_id IN (
        SELECT brand_id FROM agency_brand_access 
        WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND status = 'active'
    )
);
