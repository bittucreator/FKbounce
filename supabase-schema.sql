-- Create verification_history table
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

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_verification_history_user_id ON verification_history(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_verification_history_created_at ON verification_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own verification history
CREATE POLICY "Users can view own verification history"
    ON verification_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own verification history
CREATE POLICY "Users can insert own verification history"
    ON verification_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own verification history
CREATE POLICY "Users can delete own verification history"
    ON verification_history
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create user_plans table
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

-- Create subscriptions table for Dodo Payments
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

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Create index on dodo_subscription_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_id ON subscriptions(dodo_subscription_id);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own subscription
CREATE POLICY "Users can view own subscription"
    ON subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own subscription
CREATE POLICY "Users can insert own subscription"
    ON subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own subscription
CREATE POLICY "Users can update own subscription"
    ON subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);

-- Enable Row Level Security
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own plan
CREATE POLICY "Users can view own plan"
    ON user_plans
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own plan
CREATE POLICY "Users can insert own plan"
    ON user_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own plan
CREATE POLICY "Users can update own plan"
    ON user_plans
    FOR UPDATE
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
