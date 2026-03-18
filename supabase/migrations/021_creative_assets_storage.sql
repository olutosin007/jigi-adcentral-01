-- Unified Creative Pipeline: Storage bucket for uploaded assets
-- Path pattern: {campaign_id}/{asset_id}/{filename}
-- Run: supabase db push or execute in Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creative-assets',
  'creative-assets',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for creative-assets (authenticated users with campaign access)
CREATE POLICY "Users can upload creative assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'creative-assets');

CREATE POLICY "Users can view creative assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'creative-assets');

CREATE POLICY "Public can view creative assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creative-assets');

CREATE POLICY "Users can delete creative assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'creative-assets');
