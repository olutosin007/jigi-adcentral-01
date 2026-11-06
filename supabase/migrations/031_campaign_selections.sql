-- Migration: 031_campaign_selections
-- Persist production concept/copy selections on campaigns (P1 Sprint 2).

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS selected_concept_asset_id UUID
    REFERENCES creative_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS selected_copy_asset_id UUID
    REFERENCES creative_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS selection_updated_at TIMESTAMPTZ;

-- Validates selection lineage on write. Auto-clears stale copy when concept changes or clears.
CREATE OR REPLACE FUNCTION validate_campaign_selection()
RETURNS TRIGGER AS $$
DECLARE
  asset_row creative_assets%ROWTYPE;
BEGIN
  IF NEW.selected_concept_asset_id IS NULL AND NEW.selected_copy_asset_id IS NOT NULL THEN
    NEW.selected_copy_asset_id := NULL;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.selected_concept_asset_id IS NOT NULL
     AND NEW.selected_concept_asset_id IS DISTINCT FROM OLD.selected_concept_asset_id
     AND NEW.selected_copy_asset_id IS NOT NULL THEN
    SELECT * INTO asset_row FROM creative_assets WHERE id = NEW.selected_copy_asset_id;
    IF NOT FOUND OR asset_row.parent_asset_id IS DISTINCT FROM NEW.selected_concept_asset_id THEN
      NEW.selected_copy_asset_id := NULL;
    END IF;
  END IF;

  IF NEW.selected_concept_asset_id IS NOT NULL THEN
    SELECT * INTO asset_row FROM creative_assets WHERE id = NEW.selected_concept_asset_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected concept asset not found';
    END IF;
    IF asset_row.campaign_id <> NEW.id THEN
      RAISE EXCEPTION 'Selected concept must belong to this campaign';
    END IF;
    IF asset_row.type <> 'concept' THEN
      RAISE EXCEPTION 'Selected concept asset must be type concept';
    END IF;
  END IF;

  IF NEW.selected_copy_asset_id IS NOT NULL THEN
    IF NEW.selected_concept_asset_id IS NULL THEN
      RAISE EXCEPTION 'Select a concept before selecting copy';
    END IF;
    SELECT * INTO asset_row FROM creative_assets WHERE id = NEW.selected_copy_asset_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected copy asset not found';
    END IF;
    IF asset_row.campaign_id <> NEW.id THEN
      RAISE EXCEPTION 'Selected copy must belong to this campaign';
    END IF;
    IF asset_row.type <> 'copy' THEN
      RAISE EXCEPTION 'Selected copy asset must be type copy';
    END IF;
    IF asset_row.parent_asset_id IS DISTINCT FROM NEW.selected_concept_asset_id THEN
      RAISE EXCEPTION 'Copy must belong to the selected concept';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_campaign_selection_trigger ON campaigns;

CREATE TRIGGER validate_campaign_selection_trigger
  BEFORE INSERT OR UPDATE OF selected_concept_asset_id, selected_copy_asset_id
  ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION validate_campaign_selection();
