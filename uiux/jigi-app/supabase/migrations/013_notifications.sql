-- Notifications Table
-- In-app and email notification tracking

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

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- System can insert notifications for any user
-- In practice, this is done via service role or triggers
CREATE POLICY "Service can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());
