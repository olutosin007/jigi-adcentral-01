-- Fix: Organisation creation fails on /setup/organisation
-- Run this in Supabase SQL Editor (Project: jigi-adaptation / jigi-adstation).
-- Safe to run multiple times (idempotent).

-- 1. Fix organisations INSERT policy (auth.role() can fail; auth.uid() is more reliable)
DROP POLICY IF EXISTS "Authenticated users can create organisations" ON organisations;

CREATE POLICY "Authenticated users can create organisations"
ON organisations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
