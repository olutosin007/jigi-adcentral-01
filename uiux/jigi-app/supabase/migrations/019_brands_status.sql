-- Migration: 019_brands_status
-- Add status column for archive/unarchive (active | archived)

ALTER TABLE brands
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'));

-- Index for filtering active vs archived brands
CREATE INDEX IF NOT EXISTS idx_brands_archive_status ON brands(status);
