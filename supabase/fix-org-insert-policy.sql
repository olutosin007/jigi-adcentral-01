-- Fix organisation insert policy
-- Run this in Supabase SQL Editor if organisation creation fails

-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can create organisations" ON organisations;

-- Create a more permissive policy using auth.uid() instead of auth.role()
CREATE POLICY "Authenticated users can create organisations"
ON organisations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure the user record exists - check if trigger is working
-- If user record doesn't exist in public.users, create it manually:
-- INSERT INTO public.users (id, email, name, role)
-- SELECT id, email, raw_user_meta_data->>'name', 'admin'
-- FROM auth.users
-- WHERE id = auth.uid()
-- ON CONFLICT (id) DO NOTHING;
