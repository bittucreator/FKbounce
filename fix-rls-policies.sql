-- Fix RLS policies for user_plans table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can update own plan" ON user_plans;

-- Create comprehensive policies for user_plans
CREATE POLICY "Users can view own plan"
    ON user_plans
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan"
    ON user_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plan"
    ON user_plans
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Fix RLS policies for subscriptions table
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;

CREATE POLICY "Users can view own subscription"
    ON subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
    ON subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);
