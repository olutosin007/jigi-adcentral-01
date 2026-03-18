-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'generated-images',
    'generated-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for generated-images bucket

-- Allow authenticated users to upload images to their campaign folders
CREATE POLICY "Users can upload generated images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'generated-images'
    AND (storage.foldername(name))[1] IN (
        SELECT c.id::text
        FROM campaigns c
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (
            SELECT organisation_id FROM users WHERE id = auth.uid()
        )
    )
);

-- Allow authenticated users to view images from their org's campaigns
CREATE POLICY "Users can view org generated images"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'generated-images'
    AND (storage.foldername(name))[1] IN (
        SELECT c.id::text
        FROM campaigns c
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (
            SELECT organisation_id FROM users WHERE id = auth.uid()
        )
    )
);

-- Allow public access to generated images (for MVP simplicity)
CREATE POLICY "Public can view generated images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'generated-images');

-- Allow users to delete their own generated images
CREATE POLICY "Users can delete own generated images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'generated-images'
    AND (storage.foldername(name))[1] IN (
        SELECT c.id::text
        FROM campaigns c
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (
            SELECT organisation_id FROM users WHERE id = auth.uid()
        )
    )
);
