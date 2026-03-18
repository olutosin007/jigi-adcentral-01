-- =============================================================================
-- FIX: Infinite recursion in RLS policies
-- =============================================================================
-- The issue: policies on "users" and "organisations" reference each other,
-- causing infinite recursion when checking permissions.
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/beoannnizmvoeixumbpo/sql/new
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Drop problematic policies on organisations
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own organisation" ON organisations;
DROP POLICY IF EXISTS "Users can update own organisation" ON organisations;
DROP POLICY IF EXISTS "Authenticated users can create organisations" ON organisations;

-- -----------------------------------------------------------------------------
-- Step 2: Drop problematic policies on users
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view org members" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- -----------------------------------------------------------------------------
-- Step 3: Recreate users policies WITHOUT referencing users table
-- -----------------------------------------------------------------------------

-- Users can view their own profile (simple - just check auth.uid())
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Users can view other members of their org
-- Use a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organisation_id FROM users WHERE id = auth.uid()
$$;

CREATE POLICY "Users can view org members"
ON users FOR SELECT
USING (
  organisation_id IS NOT NULL 
  AND organisation_id = get_user_org_id()
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users can insert their own profile (for trigger)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (id = auth.uid());

-- -----------------------------------------------------------------------------
-- Step 4: Recreate organisations policies using the helper function
-- -----------------------------------------------------------------------------

-- Authenticated users can create organisations
CREATE POLICY "Authenticated users can create organisations"
ON organisations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view their own organisation
CREATE POLICY "Users can view own organisation"
ON organisations FOR SELECT
USING (id = get_user_org_id());

-- Users can update their own organisation
CREATE POLICY "Users can update own organisation"
ON organisations FOR UPDATE
USING (id = get_user_org_id());

-- -----------------------------------------------------------------------------
-- Done! The get_user_org_id() function breaks the recursion cycle
-- by using SECURITY DEFINER to bypass RLS when looking up the user's org
-- -----------------------------------------------------------------------------
