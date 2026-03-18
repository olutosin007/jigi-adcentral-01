-- Migration: 018_creative_assets_review_fields
-- Add submission and review fields for in-app human review flow (Flow 3)

ALTER TABLE creative_assets ADD COLUMN IF NOT EXISTS submission_note TEXT;
ALTER TABLE creative_assets ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE creative_assets ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE creative_assets ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
