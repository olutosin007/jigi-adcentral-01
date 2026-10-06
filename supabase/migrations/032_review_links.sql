-- Migration: 032_review_links
-- Guest Decide links (Handoff OS Phase 3).
--
-- Security model:
-- - Raw tokens are never stored; only a SHA-256 hash (token_hash).
-- - All writes go through server APIs using the service role. No INSERT/UPDATE/
--   DELETE policies exist for clients.
-- - Authenticated users may SELECT link metadata for campaigns they can already
--   see (campaigns RLS applies inside the subquery). token_hash is excluded from
--   the column grant so it never reaches the browser.

CREATE TABLE IF NOT EXISTS review_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  asset_id UUID NOT NULL REFERENCES creative_assets(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  recipient_name TEXT,
  recipient_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  use_count INTEGER NOT NULL DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decision TEXT CHECK (decision IN ('approve', 'reject', 'request_changes')),
  guest_name TEXT,
  guest_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_links_asset ON review_links(asset_id);
CREATE INDEX IF NOT EXISTS idx_review_links_campaign ON review_links(campaign_id);

ALTER TABLE review_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View review links for visible campaigns" ON review_links;
CREATE POLICY "View review links for visible campaigns"
ON review_links FOR SELECT
TO authenticated
USING (campaign_id IN (SELECT id FROM campaigns));

REVOKE ALL ON review_links FROM anon, authenticated;
GRANT SELECT (
  id, asset_id, campaign_id, brand_id, created_by, recipient_name, recipient_email,
  expires_at, revoked_at, max_uses, use_count, first_opened_at, last_used_at,
  decided_at, decision, guest_name, guest_email, created_at
) ON review_links TO authenticated;

-- Audit: distinguish guest-link decisions from in-app decisions.
ALTER TABLE asset_status_history ADD COLUMN IF NOT EXISTS reviewed_via TEXT;
ALTER TABLE approval_actions ADD COLUMN IF NOT EXISTS reviewed_via TEXT;
ALTER TABLE approval_actions ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE approval_actions ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE approval_actions ADD COLUMN IF NOT EXISTS review_link_id UUID REFERENCES review_links(id) ON DELETE SET NULL;
