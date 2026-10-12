-- Migration: 036_brand_image_presets
-- Generation Studio P4: brand-scoped image "looks" (style words + tier + aspect).
-- Presets are not review state, so direct client writes under RLS are fine.
-- CHECK lists are guarded by server/api/lib/brand-preset-migration.test.ts.

CREATE TABLE IF NOT EXISTS brand_image_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  style_prompt TEXT NOT NULL CHECK (char_length(btrim(style_prompt)) BETWEEN 1 AND 500),
  image_tier TEXT NOT NULL DEFAULT 'refine' CHECK (image_tier IN ('draft', 'refine', 'final')),
  aspect_ratio TEXT NOT NULL DEFAULT '1:1' CHECK (aspect_ratio IN ('1:1', '4:5', '9:16', '16:9')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT brand_image_presets_brand_name_key UNIQUE (brand_id, name)
);

CREATE INDEX IF NOT EXISTS idx_brand_image_presets_brand ON brand_image_presets(brand_id);

DROP TRIGGER IF EXISTS update_brand_image_presets_updated_at ON brand_image_presets;
CREATE TRIGGER update_brand_image_presets_updated_at
  BEFORE UPDATE ON brand_image_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE brand_image_presets ENABLE ROW LEVEL SECURITY;

-- Brands visible to the caller: own org's brands, or brands an agency org has active access to.
CREATE OR REPLACE FUNCTION brand_preset_accessible(target_brand UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM brands b
    WHERE b.id = target_brand
      AND b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM agency_brand_access aba
    WHERE aba.brand_id = target_brand
      AND aba.agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
      AND aba.status = 'active'
  );
$$;

DROP POLICY IF EXISTS "Brand members and agencies can read presets" ON brand_image_presets;
CREATE POLICY "Brand members and agencies can read presets"
ON brand_image_presets FOR SELECT
USING (brand_preset_accessible(brand_id));

DROP POLICY IF EXISTS "Brand members and agencies can create presets" ON brand_image_presets;
CREATE POLICY "Brand members and agencies can create presets"
ON brand_image_presets FOR INSERT
WITH CHECK (created_by = auth.uid() AND brand_preset_accessible(brand_id));

DROP POLICY IF EXISTS "Creators can update their presets" ON brand_image_presets;
CREATE POLICY "Creators can update their presets"
ON brand_image_presets FOR UPDATE
USING (created_by = auth.uid() AND brand_preset_accessible(brand_id))
WITH CHECK (created_by = auth.uid() AND brand_preset_accessible(brand_id));

DROP POLICY IF EXISTS "Creators or org admins can delete presets" ON brand_image_presets;
CREATE POLICY "Creators or org admins can delete presets"
ON brand_image_presets FOR DELETE
USING (
  brand_preset_accessible(brand_id)
  AND (
    created_by = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
);
