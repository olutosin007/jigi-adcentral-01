-- Migration: 028_idea_first_campaign_policies
-- Relax RLS to allow idea-first campaigns without a brand_id, while keeping existing
-- brand-grounded behaviour intact.
--
-- Existing policies on campaigns only allow rows where brand_id is present and
-- linked to the user's organisation (or agency access). That blocks creation of
-- idea-first campaigns where brand_id is NULL.
--
-- This migration adds *additional* policies so that:
-- - Users can create, view, update, and delete campaigns they created with
--   brand_id IS NULL.
-- - Existing brand-based policies remain unchanged.

-- Users can view their own idea-first campaigns (brand_id IS NULL).
CREATE POLICY "Users can view their idea-first campaigns"
ON campaigns FOR SELECT
USING (
  brand_id IS NULL
  AND created_by = auth.uid()
);

-- Users can create idea-first campaigns (brand_id IS NULL).
CREATE POLICY "Users can create idea-first campaigns"
ON campaigns FOR INSERT
WITH CHECK (
  brand_id IS NULL
  AND created_by = auth.uid()
);

-- Users can update their own idea-first campaigns.
CREATE POLICY "Users can update their idea-first campaigns"
ON campaigns FOR UPDATE
USING (
  brand_id IS NULL
  AND created_by = auth.uid()
)
WITH CHECK (
  brand_id IS NULL
  AND created_by = auth.uid()
);

-- Users can delete their own idea-first campaigns.
CREATE POLICY "Users can delete their idea-first campaigns"
ON campaigns FOR DELETE
USING (
  brand_id IS NULL
  AND created_by = auth.uid()
);

