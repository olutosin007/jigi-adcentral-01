-- Allow users (brand org) to delete draft assets for campaigns they can access.
CREATE POLICY "Users can delete draft assets for accessible campaigns"
ON creative_assets FOR DELETE
USING (
    status = 'draft'
    AND campaign_id IN (
        SELECT c.id FROM campaigns c
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Allow agencies to delete draft assets for connected brands (can_generate).
CREATE POLICY "Agencies can delete draft assets for connected brands"
ON creative_assets FOR DELETE
USING (
    status = 'draft'
    AND campaign_id IN (
        SELECT c.id FROM campaigns c
        WHERE c.brand_id IN (
            SELECT brand_id FROM agency_brand_access
            WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
            AND status = 'active'
            AND (permissions->>'can_generate')::boolean = true
        )
    )
);
