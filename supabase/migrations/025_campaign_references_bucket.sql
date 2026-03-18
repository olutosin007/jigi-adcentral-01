-- Migration: 025_campaign_references_bucket
-- Storage bucket for campaign brief reference assets (mood boards, competitor examples)
-- PRD: 02-prd-ctxt-brief-input

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-references',
  'campaign-references',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to campaign folders (path: {campaign_id}/...)
CREATE POLICY "Users can upload campaign references"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-references');

-- Authenticated users can view campaign references
CREATE POLICY "Users can view campaign references"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'campaign-references');

-- Public can view (for shared links)
CREATE POLICY "Public can view campaign references"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaign-references');

-- Authenticated users can delete their org's campaign references
CREATE POLICY "Users can delete campaign references"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-references');
