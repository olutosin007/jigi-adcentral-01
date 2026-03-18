-- Fix organisation creation: use auth.uid() instead of auth.role()
-- auth.role() = 'authenticated' can fail in some Supabase/JWT setups
-- Run: supabase db push or execute in Supabase SQL Editor

DROP POLICY IF EXISTS "Authenticated users can create organisations" ON organisations;

CREATE POLICY "Authenticated users can create organisations"
ON organisations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
