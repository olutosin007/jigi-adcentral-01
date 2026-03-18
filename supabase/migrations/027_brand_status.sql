-- Migration: 027_brand_status
-- Add status column for brand archive (soft delete).
-- Fix generation_log FK so brand deletion can succeed.

-- Add status column to brands (active | archived)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
UPDATE brands SET status = 'active' WHERE status IS NULL;
ALTER TABLE brands ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE brands ALTER COLUMN status SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brands_status_check'
  ) THEN
    ALTER TABLE brands ADD CONSTRAINT brands_status_check
      CHECK (status IN ('active', 'archived'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_brands_status_active ON brands(status) WHERE status = 'active';

-- Allow brand deletion when generation_log has rows: set brand_id to NULL on delete
ALTER TABLE generation_log ALTER COLUMN brand_id DROP NOT NULL;
ALTER TABLE generation_log DROP CONSTRAINT IF EXISTS generation_log_brand_id_fkey;
ALTER TABLE generation_log ADD CONSTRAINT generation_log_brand_id_fkey
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
