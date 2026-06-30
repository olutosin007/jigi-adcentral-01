-- Sprint 5 (p2): lightweight copy prompt / schema lineage for generation_log telemetry

ALTER TABLE generation_log
  ADD COLUMN IF NOT EXISTS copy_prompt_revision TEXT;

COMMENT ON COLUMN generation_log.copy_prompt_revision IS
  'Semantic revision id for copy system prompt / JSON contract (e.g. p2-suite-2026-04).';
