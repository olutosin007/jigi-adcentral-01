-- Migration: 003_rls_policies
-- Enable Row Level Security and create policies

-- Enable RLS on organisations
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- Organisations policies
CREATE POLICY "Users can view own organisation"
ON organisations FOR SELECT
USING (id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own organisation"
ON organisations FOR UPDATE
USING (id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Authenticated users can create organisations"
ON organisations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can view org members"
ON users FOR SELECT
USING (
    organisation_id IS NOT NULL AND
    organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (id = auth.uid());
