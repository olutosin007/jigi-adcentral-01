-- Handoff OS P4 · Sprint 4.2 — review rounds & "what changed"
-- Rounds are derived from asset_status_history (count of to_status = 'submitted').
-- Each client send stores the content as sent, so the next round can be compared.

ALTER TABLE asset_status_history ADD COLUMN IF NOT EXISTS content_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_status_history_asset_submitted
  ON asset_status_history (asset_id, created_at)
  WHERE to_status = 'submitted';

COMMENT ON COLUMN asset_status_history.content_snapshot IS
  'creative_assets.content at the moment of a client send (to_status = submitted); powers Compare to previous round';
