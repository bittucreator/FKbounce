-- =====================================================
-- FKBOUNCE COMPLETE DATABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- This includes ALL tables, indexes, RLS policies, and storage
-- =====================================================

-- =====================================================
-- PART 1: HELPER FUNCTIONS
-- =====================================================

-- Create updated_at trigger function (used by multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 2: VERIFICATION HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS verification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('single', 'bulk')),
    email_count INTEGER NOT NULL DEFAULT 1,
    valid_count INTEGER NOT NULL DEFAULT 0,
    invalid_count INTEGER NOT NULL DEFAULT 0,
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_verification_history_user_id ON verification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_created_at ON verification_history(created_at DESC);

ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own verification history" ON verification_history;
DROP POLICY IF EXISTS "Users can insert own verification history" ON verification_history;
DROP POLICY IF EXISTS "Users can delete own verification history" ON verification_history;

CREATE POLICY "Users can view own verification history"
    ON verification_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification history"
    ON verification_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own verification history"
    ON verification_history FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- PART 3: USER PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    verifications_used INTEGER NOT NULL DEFAULT 0,
    verifications_limit INTEGER NOT NULL DEFAULT 500,
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can insert own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can update own plan" ON user_plans;

CREATE POLICY "Users can view own plan"
    ON user_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan"
    ON user_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plan"
    ON user_plans FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to reset monthly verification counts
CREATE OR REPLACE FUNCTION reset_monthly_verifications()
RETURNS void AS $$
BEGIN
    UPDATE user_plans
    SET verifications_used = 0,
        updated_at = TIMEZONE('utc', NOW())
    WHERE billing_cycle = 'monthly'
    AND updated_at < (NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    dodo_customer_id TEXT,
    dodo_subscription_id TEXT UNIQUE,
    dodo_checkout_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    plan TEXT NOT NULL CHECK (plan IN ('free', 'pro')),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_id ON subscriptions(dodo_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- PART 5: LISTS TABLE (Smart Lists)
-- =====================================================

CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own lists" ON lists;
DROP POLICY IF EXISTS "Users can create their own lists" ON lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON lists;

CREATE POLICY "Users can view their own lists"
  ON lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lists"
  ON lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON lists FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_lists_updated_at ON lists;
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 6: LIST EMAILS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS list_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  verification_status TEXT,
  verification_result JSONB,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, email_address)
);

CREATE INDEX IF NOT EXISTS idx_list_emails_list_id ON list_emails(list_id);
CREATE INDEX IF NOT EXISTS idx_list_emails_email ON list_emails(email_address);
CREATE INDEX IF NOT EXISTS idx_list_emails_status ON list_emails(verification_status);

ALTER TABLE list_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view emails in their lists" ON list_emails;
DROP POLICY IF EXISTS "Users can add emails to their lists" ON list_emails;
DROP POLICY IF EXISTS "Users can update emails in their lists" ON list_emails;
DROP POLICY IF EXISTS "Users can delete emails from their lists" ON list_emails;

CREATE POLICY "Users can view emails in their lists"
  ON list_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_emails.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add emails to their lists"
  ON list_emails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_emails.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update emails in their lists"
  ON list_emails FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_emails.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete emails from their lists"
  ON list_emails FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_emails.list_id
      AND lists.user_id = auth.uid()
    )
  );

-- =====================================================
-- PART 7: USER SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_catch_all_check BOOLEAN DEFAULT true,
  smtp_timeout INTEGER DEFAULT 10000,
  max_retries INTEGER DEFAULT 3,
  enable_domain_cache BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_settings_updated_at ON user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 8: API KEYS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;

CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PART 9: INTEGRATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  account_name TEXT,
  account_email TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user_provider ON integrations(user_id, provider);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can insert their own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON integrations;

CREATE POLICY "Users can view their own integrations"
  ON integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON integrations FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS integrations_updated_at ON integrations;
CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 10: WEBHOOK CONFIGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['bulk_verification_complete'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_url CHECK (url ~* '^https?://.*')
);

CREATE INDEX IF NOT EXISTS idx_webhook_configs_user_id ON webhook_configs(user_id);

ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own webhook configs" ON webhook_configs;
DROP POLICY IF EXISTS "Users can create their own webhook configs" ON webhook_configs;
DROP POLICY IF EXISTS "Users can update their own webhook configs" ON webhook_configs;
DROP POLICY IF EXISTS "Users can delete their own webhook configs" ON webhook_configs;

CREATE POLICY "Users can view their own webhook configs"
  ON webhook_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook configs"
  ON webhook_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook configs"
  ON webhook_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook configs"
  ON webhook_configs FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_webhook_configs_updated_at ON webhook_configs;
CREATE TRIGGER update_webhook_configs_updated_at
  BEFORE UPDATE ON webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 11: VERIFICATION JOBS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS verification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_emails INTEGER NOT NULL,
  processed_emails INTEGER DEFAULT 0,
  valid_count INTEGER DEFAULT 0,
  invalid_count INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  results JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_verification_jobs_user_id ON verification_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_jobs_status ON verification_jobs(status);

ALTER TABLE verification_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own verification jobs" ON verification_jobs;
DROP POLICY IF EXISTS "Users can create their own verification jobs" ON verification_jobs;
DROP POLICY IF EXISTS "Users can update their own verification jobs" ON verification_jobs;

CREATE POLICY "Users can view their own verification jobs"
  ON verification_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verification jobs"
  ON verification_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification jobs"
  ON verification_jobs FOR UPDATE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_verification_jobs_updated_at ON verification_jobs;
CREATE TRIGGER update_verification_jobs_updated_at
  BEFORE UPDATE ON verification_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 12: WEBHOOK DELIVERIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  verification_job_id UUID REFERENCES verification_jobs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  response_code INTEGER,
  response_body TEXT,
  attempt_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_config_id ON webhook_deliveries(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their webhook deliveries" ON webhook_deliveries;

CREATE POLICY "Users can view their webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhook_configs
      WHERE webhook_configs.id = webhook_deliveries.webhook_config_id
      AND webhook_configs.user_id = auth.uid()
    )
  );

-- =====================================================
-- PART 13: STORAGE BUCKET (User Avatars)
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Storage Policies
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;

CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- Tables created:
-- 1. verification_history
-- 2. user_plans
-- 3. subscriptions
-- 4. lists
-- 5. list_emails
-- 6. user_settings
-- 7. api_keys
-- 8. integrations
-- 9. webhook_configs
-- 10. verification_jobs
-- 11. webhook_deliveries
-- 
-- Storage:
-- - user-avatars bucket with policies
-- =====================================================
