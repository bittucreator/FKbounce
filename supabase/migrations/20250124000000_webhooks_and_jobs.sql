-- Create webhook_configs table
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

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_configs_user_id ON webhook_configs(user_id);

-- Create verification_jobs table for async bulk verification tracking
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

-- Create index on user_id and status for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_jobs_user_id ON verification_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_jobs_status ON verification_jobs(status);

-- Create webhook_deliveries table to track webhook delivery attempts
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

-- Create index for tracking delivery status
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_config_id ON webhook_deliveries(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);

-- Enable RLS
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_configs
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

-- RLS Policies for verification_jobs
CREATE POLICY "Users can view their own verification jobs"
  ON verification_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verification jobs"
  ON verification_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification jobs"
  ON verification_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for webhook_deliveries (read-only for users)
CREATE POLICY "Users can view their webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhook_configs
      WHERE webhook_configs.id = webhook_deliveries.webhook_config_id
      AND webhook_configs.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_webhook_configs_updated_at
  BEFORE UPDATE ON webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_jobs_updated_at
  BEFORE UPDATE ON verification_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
