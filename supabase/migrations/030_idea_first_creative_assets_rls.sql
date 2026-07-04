-- Migration: 030_idea_first_creative_assets_rls
-- Allow saving/viewing creative assets on idea-first campaigns (brand_id IS NULL)
-- and campaigns owned by the current user. Backfill created_by on orphaned campaigns.

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id FROM users WHERE id = auth.uid()
$$;

-- Backfill campaign owners from the most recent generation_log entry per campaign.
UPDATE campaigns c
SET created_by = gl.user_id
FROM (
  SELECT DISTINCT ON (campaign_id) campaign_id, user_id
  FROM generation_log
  WHERE user_id IS NOT NULL
  ORDER BY campaign_id, created_at DESC
) gl
WHERE c.id = gl.campaign_id
  AND c.created_by IS NULL;

DROP POLICY IF EXISTS "Users can view assets for accessible campaigns" ON creative_assets;
DROP POLICY IF EXISTS "Users can create assets for accessible campaigns" ON creative_assets;
DROP POLICY IF EXISTS "Users can update assets for accessible campaigns" ON creative_assets;
DROP POLICY IF EXISTS "Agencies can view assets for connected brands" ON creative_assets;
DROP POLICY IF EXISTS "Agencies can create assets for connected brands" ON creative_assets;
DROP POLICY IF EXISTS "Users can view assets" ON creative_assets;
DROP POLICY IF EXISTS "Users can create assets" ON creative_assets;
DROP POLICY IF EXISTS "Users can update assets" ON creative_assets;

CREATE POLICY "Users can view assets"
ON creative_assets FOR SELECT
USING (
  created_by = auth.uid()
  OR campaign_id IN (
    SELECT c.id
    FROM campaigns c
    WHERE c.created_by = auth.uid()
      OR c.brand_id IN (
        SELECT id FROM brands WHERE organisation_id = get_user_org_id()
      )
  )
);

CREATE POLICY "Users can create assets"
ON creative_assets FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND campaign_id IN (
    SELECT c.id
    FROM campaigns c
    WHERE c.created_by = auth.uid()
      OR c.brand_id IN (
        SELECT id FROM brands WHERE organisation_id = get_user_org_id()
      )
  )
);

CREATE POLICY "Users can update assets"
ON creative_assets FOR UPDATE
USING (
  created_by = auth.uid()
  OR campaign_id IN (
    SELECT c.id
    FROM campaigns c
    WHERE c.created_by = auth.uid()
      OR c.brand_id IN (
        SELECT id FROM brands WHERE organisation_id = get_user_org_id()
      )
  )
);
