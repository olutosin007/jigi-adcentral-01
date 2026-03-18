-- =============================================================================
-- JIGI MVP - COMBINED DATABASE MIGRATIONS
-- =============================================================================
-- Run this entire script in Supabase SQL Editor
-- Created: February 2026
-- Version: 1.0
-- =============================================================================

-- Migration 001: Organisations
-- =============================================================================
CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('brand', 'agency')),
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organisations_type ON organisations(type);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organisations_updated_at
    BEFORE UPDATE ON organisations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Migration 002: Users
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    name TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'approver', 'reviewer', 'creator')),
    journey_mode TEXT CHECK (journey_mode IN ('brand_first', 'idea_first')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_organisation_id ON users(organisation_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create user record on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        'admin'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- Migration 003: RLS Policies for organisations and users
-- =============================================================================
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organisation"
ON organisations FOR SELECT
USING (id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own organisation"
ON organisations FOR UPDATE
USING (id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Authenticated users can create organisations"
ON organisations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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


-- Migration 004: Brands
-- =============================================================================
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    identity JSONB DEFAULT '{}',
    voice JSONB DEFAULT '{}',
    strategy JSONB DEFAULT '{}',
    governance JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    journey_mode TEXT DEFAULT 'brand_first' CHECK (journey_mode IN ('brand_first', 'idea_first')),
    brand_profile_status TEXT DEFAULT 'starter' CHECK (brand_profile_status IN ('starter', 'partial', 'complete')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_organisation_id ON brands(organisation_id);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(brand_profile_status);

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org brands"
ON brands FOR SELECT
USING (organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create brands for own org"
ON brands FOR INSERT
WITH CHECK (organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own org brands"
ON brands FOR UPDATE
USING (organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org brands"
ON brands FOR DELETE
USING (organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));


-- Migration 005: Agency Brand Access
-- =============================================================================
CREATE TABLE IF NOT EXISTS agency_brand_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{"can_generate": true, "can_view_approved": true}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    invited_email TEXT,
    granted_at TIMESTAMPTZ,
    granted_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_organisation_id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_brand_access_agency ON agency_brand_access(agency_organisation_id);
CREATE INDEX IF NOT EXISTS idx_agency_brand_access_brand ON agency_brand_access(brand_id);
CREATE INDEX IF NOT EXISTS idx_agency_brand_access_status ON agency_brand_access(status);

ALTER TABLE agency_brand_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view own access records"
ON agency_brand_access FOR SELECT
USING (agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Brands can view access to their brands"
ON agency_brand_access FOR SELECT
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Brands can invite agencies"
ON agency_brand_access FOR INSERT
WITH CHECK (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Brands can manage access"
ON agency_brand_access FOR UPDATE
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Brands can revoke access"
ON agency_brand_access FOR DELETE
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Agencies can view accessible brands"
ON brands FOR SELECT
USING (
    id IN (
        SELECT brand_id FROM agency_brand_access 
        WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND status = 'active'
    )
);


-- Migration 006: Campaigns
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    name TEXT NOT NULL,
    brief JSONB DEFAULT '{}',
    journey_mode TEXT DEFAULT 'brand_first' CHECK (journey_mode IN ('brand_first', 'idea_first')),
    seed_idea TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaigns for their org brands"
ON campaigns FOR SELECT
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can create campaigns for their org brands"
ON campaigns FOR INSERT
WITH CHECK (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can update campaigns for their org brands"
ON campaigns FOR UPDATE
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can delete campaigns for their org brands"
ON campaigns FOR DELETE
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Agencies can view campaigns for connected brands"
ON campaigns FOR SELECT
USING (
    brand_id IN (
        SELECT brand_id FROM agency_brand_access 
        WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND status = 'active'
    )
);

CREATE POLICY "Agencies can create campaigns for connected brands"
ON campaigns FOR INSERT
WITH CHECK (
    brand_id IN (
        SELECT brand_id FROM agency_brand_access 
        WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND status = 'active'
        AND (permissions->>'can_generate')::boolean = true
    )
);


-- Migration 007: Creative Assets
-- =============================================================================
CREATE TABLE IF NOT EXISTS creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('concept', 'copy', 'image')),
    generation_mode TEXT NOT NULL CHECK (generation_mode IN ('brand_grounded', 'idea_first')),
    content JSONB NOT NULL,
    source TEXT DEFAULT 'ai' CHECK (source IN ('ai', 'uploaded')),
    original_filename TEXT,
    version INTEGER DEFAULT 1,
    parent_asset_id UUID REFERENCES creative_assets(id),
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 
        'agency_review', 
        'submitted', 
        'brand_review', 
        'changes_requested', 
        'approved', 
        'rejected'
    )),
    submission_note TEXT,
    review_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    compliance_check JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creative_assets_campaign_id ON creative_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_type ON creative_assets(type);
CREATE INDEX IF NOT EXISTS idx_creative_assets_status ON creative_assets(status);
CREATE INDEX IF NOT EXISTS idx_creative_assets_parent ON creative_assets(parent_asset_id);

CREATE TRIGGER update_creative_assets_updated_at
    BEFORE UPDATE ON creative_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets for accessible campaigns"
ON creative_assets FOR SELECT
USING (
    campaign_id IN (
        SELECT c.id FROM campaigns c
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can create assets for accessible campaigns"
ON creative_assets FOR INSERT
WITH CHECK (
    campaign_id IN (
        SELECT c.id FROM campaigns c
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can update assets for accessible campaigns"
ON creative_assets FOR UPDATE
USING (
    campaign_id IN (
        SELECT c.id FROM campaigns c
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Agencies can view assets for connected brands"
ON creative_assets FOR SELECT
USING (
    campaign_id IN (
        SELECT c.id FROM campaigns c
        WHERE c.brand_id IN (
            SELECT brand_id FROM agency_brand_access 
            WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
            AND status = 'active'
        )
    )
);

CREATE POLICY "Agencies can create assets for connected brands"
ON creative_assets FOR INSERT
WITH CHECK (
    campaign_id IN (
        SELECT c.id FROM campaigns c
        WHERE c.brand_id IN (
            SELECT brand_id FROM agency_brand_access 
            WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
            AND status = 'active'
            AND (permissions->>'can_generate')::boolean = true
        )
    )
);


-- Migration 008: Generation Log
-- =============================================================================
CREATE TABLE IF NOT EXISTS generation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    brand_id UUID REFERENCES brands(id),
    campaign_id UUID REFERENCES campaigns(id),
    type TEXT NOT NULL,
    model TEXT NOT NULL,
    generation_mode TEXT NOT NULL CHECK (generation_mode IN ('brand_grounded', 'idea_first')),
    prompt_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    latency_ms INTEGER,
    tokens_used INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_log_user_id ON generation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_log_brand_id ON generation_log(brand_id);
CREATE INDEX IF NOT EXISTS idx_generation_log_campaign_id ON generation_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_generation_log_created_at ON generation_log(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_log_status ON generation_log(status);

ALTER TABLE generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generation logs"
ON generation_log FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view org generation logs"
ON generation_log FOR SELECT
USING (
    brand_id IN (
        SELECT id FROM brands 
        WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can insert generation logs"
ON generation_log FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow service role to insert
CREATE POLICY "Service can insert generation logs"
ON generation_log FOR INSERT
WITH CHECK (true);


-- Migration 009: Storage Buckets
-- =============================================================================
-- Brand assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'brand-assets',
    'brand-assets',
    true,
    10485760, -- 10MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Generated images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'generated-images',
    'generated-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for brand-assets
CREATE POLICY "Users can upload brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-assets');

CREATE POLICY "Users can view brand assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'brand-assets');

CREATE POLICY "Public can view brand assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-assets');

CREATE POLICY "Users can delete own brand assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'brand-assets');

-- Storage policies for generated-images
CREATE POLICY "Users can upload generated images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "Users can view generated images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'generated-images');

CREATE POLICY "Public can view generated images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'generated-images');

CREATE POLICY "Users can delete generated images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'generated-images');


-- Migration 010: Asset Status History
-- =============================================================================
CREATE TABLE IF NOT EXISTS asset_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    from_status TEXT,
    to_status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_history_asset ON asset_status_history(asset_id);
CREATE INDEX idx_status_history_created ON asset_status_history(created_at DESC);
CREATE INDEX idx_status_history_user ON asset_status_history(user_id);

ALTER TABLE asset_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view status history for org assets"
ON asset_status_history FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Agencies can view status history for connected brand assets"
ON asset_status_history FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        JOIN agency_brand_access aba ON b.id = aba.brand_id
        WHERE aba.agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND aba.status = 'active'
    )
);

CREATE POLICY "Users can insert status history for accessible assets"
ON asset_status_history FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Agencies can insert status history for connected brand assets"
ON asset_status_history FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        JOIN agency_brand_access aba ON b.id = aba.brand_id
        WHERE aba.agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND aba.status = 'active'
    )
);


-- Migration 011: Approval Actions
-- =============================================================================
CREATE TABLE IF NOT EXISTS approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_actions_asset ON approval_actions(asset_id);
CREATE INDEX idx_approval_actions_user ON approval_actions(user_id);
CREATE INDEX idx_approval_actions_created ON approval_actions(created_at DESC);

ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approval actions for org assets"
ON approval_actions FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Agencies can view approval actions for connected brand assets"
ON approval_actions FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        JOIN agency_brand_access aba ON b.id = aba.brand_id
        WHERE aba.agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND aba.status = 'active'
    )
);

CREATE POLICY "Users can insert approval actions for accessible assets"
ON approval_actions FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Agencies can insert approval actions for connected brand assets"
ON approval_actions FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        JOIN agency_brand_access aba ON b.id = aba.brand_id
        WHERE aba.agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND aba.status = 'active'
    )
);


-- Migration 012: Asset Comments
-- =============================================================================
CREATE TABLE IF NOT EXISTS asset_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES asset_comments(id),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asset_comments_asset ON asset_comments(asset_id);
CREATE INDEX idx_asset_comments_user ON asset_comments(user_id);
CREATE INDEX idx_asset_comments_parent ON asset_comments(parent_comment_id);
CREATE INDEX idx_asset_comments_created ON asset_comments(created_at DESC);

ALTER TABLE asset_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments for org assets"
ON asset_comments FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Agencies can view comments for connected brand assets"
ON asset_comments FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        JOIN agency_brand_access aba ON b.id = aba.brand_id
        WHERE aba.agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND aba.status = 'active'
    )
);

CREATE POLICY "Users can insert comments for accessible assets"
ON asset_comments FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Agencies can insert comments for connected brand assets"
ON asset_comments FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        JOIN agency_brand_access aba ON b.id = aba.brand_id
        WHERE aba.agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
        AND aba.status = 'active'
    )
);

CREATE POLICY "Users can update own comments"
ON asset_comments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can resolve comments on org assets"
ON asset_comments FOR UPDATE
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can delete own comments"
ON asset_comments FOR DELETE
USING (user_id = auth.uid());


-- Migration 013: Notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'submission',
        'approval', 
        'rejection',
        'changes_requested',
        'nudge_reminder',
        'comment_added',
        'comment_reply',
        'comment_resolved'
    )),
    title TEXT NOT NULL,
    body TEXT,
    related_asset_id UUID REFERENCES creative_assets(id) ON DELETE SET NULL,
    related_campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    related_comment_id UUID REFERENCES asset_comments(id) ON DELETE SET NULL,
    generation_mode TEXT CHECK (generation_mode IN ('brand_grounded', 'idea_first')),
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());


-- Migration 014: Nudge Log
-- =============================================================================
CREATE TABLE IF NOT EXISTS nudge_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    nudge_type TEXT NOT NULL CHECK (nudge_type IN (
        'pending_24h',
        'pending_48h',
        'opened_no_action'
    )),
    email_sent BOOLEAN DEFAULT FALSE,
    notification_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nudge_log_asset ON nudge_log(asset_id);
CREATE INDEX idx_nudge_log_user ON nudge_log(user_id);
CREATE INDEX idx_nudge_log_created ON nudge_log(created_at DESC);
CREATE INDEX idx_nudge_log_type ON nudge_log(nudge_type);
CREATE INDEX idx_nudge_log_asset_date ON nudge_log(asset_id, created_at);

ALTER TABLE nudge_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view nudge logs for org assets"
ON nudge_log FOR SELECT
USING (
    asset_id IN (
        SELECT ca.id FROM creative_assets ca
        JOIN campaigns c ON ca.campaign_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE b.organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Service can insert nudge logs"
ON nudge_log FOR INSERT
WITH CHECK (true);


-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Tables created: 12
-- Storage buckets: 2
-- RLS policies: 50+
-- Triggers: 5
-- =============================================================================
