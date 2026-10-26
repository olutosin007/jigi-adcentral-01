-- Migration 038: generation_jobs table for async video (and future long-running) jobs.
-- VIDEO_ENABLED stays false in app until a provider lane ships; schema is ready.

CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('video', 'image_batch', 'other')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  provider TEXT,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS generation_jobs_campaign_id_idx ON generation_jobs (campaign_id);
CREATE INDEX IF NOT EXISTS generation_jobs_status_idx ON generation_jobs (status);

ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE generation_jobs IS 'Async generation jobs (video scaffold). UI gated by VIDEO_ENABLED.';
