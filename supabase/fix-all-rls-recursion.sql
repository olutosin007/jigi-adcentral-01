-- =============================================================================
-- FIX: All RLS recursion issues across all tables
-- =============================================================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/beoannnizmvoeixumbpo/sql/new
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper function (if not already created)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organisation_id FROM users WHERE id = auth.uid()
$$;

-- =============================================================================
-- BRANDS TABLE - Fix recursion
-- =============================================================================
DROP POLICY IF EXISTS "Users can view own org brands" ON brands;
DROP POLICY IF EXISTS "Users can create brands for own org" ON brands;
DROP POLICY IF EXISTS "Users can update own org brands" ON brands;
DROP POLICY IF EXISTS "Users can delete own org brands" ON brands;
DROP POLICY IF EXISTS "Agencies can view accessible brands" ON brands;

CREATE POLICY "Users can view own org brands"
ON brands FOR SELECT
USING (organisation_id = get_user_org_id());

CREATE POLICY "Users can create brands for own org"
ON brands FOR INSERT
WITH CHECK (organisation_id = get_user_org_id() OR get_user_org_id() IS NULL);

CREATE POLICY "Users can update own org brands"
ON brands FOR UPDATE
USING (organisation_id = get_user_org_id());

CREATE POLICY "Users can delete own org brands"
ON brands FOR DELETE
USING (organisation_id = get_user_org_id());

-- =============================================================================
-- CAMPAIGNS TABLE - Fix recursion
-- =============================================================================
DROP POLICY IF EXISTS "Users can view campaigns for their org brands" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns for their org brands" ON campaigns;
DROP POLICY IF EXISTS "Users can update campaigns for their org brands" ON campaigns;
DROP POLICY IF EXISTS "Users can delete campaigns for their org brands" ON campaigns;
DROP POLICY IF EXISTS "Agencies can view campaigns for connected brands" ON campaigns;
DROP POLICY IF EXISTS "Agencies can create campaigns for connected brands" ON campaigns;

-- Simpler approach: users can access campaigns for brands in their org
CREATE POLICY "Users can view campaigns for their org brands"
ON campaigns FOR SELECT
USING (
  brand_id IN (SELECT id FROM brands WHERE organisation_id = get_user_org_id())
  OR brand_id IS NULL
);

CREATE POLICY "Users can create campaigns"
ON campaigns FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their campaigns"
ON campaigns FOR UPDATE
USING (
  created_by = auth.uid() 
  OR brand_id IN (SELECT id FROM brands WHERE organisation_id = get_user_org_id())
);

CREATE POLICY "Users can delete their campaigns"
ON campaigns FOR DELETE
USING (
  created_by = auth.uid()
  OR brand_id IN (SELECT id FROM brands WHERE organisation_id = get_user_org_id())
);

-- =============================================================================
-- CREATIVE_ASSETS TABLE - Fix recursion
-- =============================================================================
DROP POLICY IF EXISTS "Users can view assets for accessible campaigns" ON creative_assets;
DROP POLICY IF EXISTS "Users can create assets for accessible campaigns" ON creative_assets;
DROP POLICY IF EXISTS "Users can update assets for accessible campaigns" ON creative_assets;
DROP POLICY IF EXISTS "Agencies can view assets for connected brands" ON creative_assets;
DROP POLICY IF EXISTS "Agencies can create assets for connected brands" ON creative_assets;

CREATE POLICY "Users can view assets"
ON creative_assets FOR SELECT
USING (
  created_by = auth.uid()
  OR campaign_id IN (
    SELECT id FROM campaigns WHERE created_by = auth.uid()
    OR brand_id IN (SELECT id FROM brands WHERE organisation_id = get_user_org_id())
  )
);

CREATE POLICY "Users can create assets"
ON creative_assets FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update assets"
ON creative_assets FOR UPDATE
USING (
  created_by = auth.uid()
  OR campaign_id IN (
    SELECT id FROM campaigns WHERE created_by = auth.uid()
    OR brand_id IN (SELECT id FROM brands WHERE organisation_id = get_user_org_id())
  )
);

-- =============================================================================
-- GENERATION_LOG TABLE - Fix recursion
-- =============================================================================
DROP POLICY IF EXISTS "Users can view own generation logs" ON generation_log;
DROP POLICY IF EXISTS "Users can view org generation logs" ON generation_log;
DROP POLICY IF EXISTS "Users can insert generation logs" ON generation_log;
DROP POLICY IF EXISTS "Service can insert generation logs" ON generation_log;

CREATE POLICY "Users can view own generation logs"
ON generation_log FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert generation logs"
ON generation_log FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- AGENCY_BRAND_ACCESS TABLE - Fix recursion
-- =============================================================================
DROP POLICY IF EXISTS "Agencies can view own access records" ON agency_brand_access;
DROP POLICY IF EXISTS "Brands can view access to their brands" ON agency_brand_access;
DROP POLICY IF EXISTS "Brands can invite agencies" ON agency_brand_access;
DROP POLICY IF EXISTS "Brands can manage access" ON agency_brand_access;
DROP POLICY IF EXISTS "Brands can revoke access" ON agency_brand_access;

CREATE POLICY "Users can view agency brand access"
ON agency_brand_access FOR SELECT
USING (
  agency_organisation_id = get_user_org_id()
  OR brand_id IN (SELECT id FROM brands WHERE organisation_id = get_user_org_id())
);

CREATE POLICY "Users can manage agency brand access"
ON agency_brand_access FOR ALL
USING (
  brand_id IN (SELECT id FROM brands WHERE organisation_id = get_user_org_id())
);

-- =============================================================================
-- Done! All recursion issues should be fixed now.
-- =============================================================================
