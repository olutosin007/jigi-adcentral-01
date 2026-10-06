-- Handoff OS P4 · Sprint 4.3 — north-star metrics, queryable without a dashboard.
-- One row per decision (approve / request changes / decline) on a client send.
--   hours_to_decision   : last client send -> decision
--   round               : client sends up to and including this decision
--   decide_via          : 'guest_link' or 'app'
--   approved_first_round: approve on round 1 (avg = approved_first_round_rate)
-- Requires 032 (reviewed_via). security_invoker keeps base-table RLS in force.

CREATE OR REPLACE VIEW handoff_decision_metrics
WITH (security_invoker = true) AS
SELECT
  d.id AS history_id,
  d.asset_id,
  a.campaign_id,
  c.brand_id,
  a.type AS asset_type,
  COALESCE(a.source, 'ai') AS candidate_source,
  d.to_status AS decision,
  COALESCE(d.reviewed_via, 'app') AS decide_via,
  d.created_at AS decided_at,
  s.sent_at,
  ROUND((EXTRACT(EPOCH FROM (d.created_at - s.sent_at)) / 3600)::numeric, 1) AS hours_to_decision,
  s.round,
  (d.to_status = 'approved' AND s.round = 1) AS approved_first_round
FROM asset_status_history d
JOIN creative_assets a ON a.id = d.asset_id
JOIN campaigns c ON c.id = a.campaign_id
CROSS JOIN LATERAL (
  SELECT
    MAX(h.created_at) AS sent_at,
    COUNT(*)::int AS round
  FROM asset_status_history h
  WHERE h.asset_id = d.asset_id
    AND h.to_status = 'submitted'
    AND h.created_at <= d.created_at
) s
WHERE d.to_status IN ('approved', 'changes_requested', 'rejected')
  AND d.from_status IN ('submitted', 'brand_review')
  AND s.round > 0;

COMMENT ON VIEW handoff_decision_metrics IS
  'Handoff OS north-star: SELECT avg(hours_to_decision) FILTER (WHERE round = 1), avg(approved_first_round::int) FROM handoff_decision_metrics';
