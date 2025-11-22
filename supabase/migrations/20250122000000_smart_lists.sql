-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create list_emails junction table (many-to-many)
CREATE TABLE IF NOT EXISTS list_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  verification_status TEXT,
  verification_result JSONB,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, email_address)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_emails_list_id ON list_emails(list_id);
CREATE INDEX IF NOT EXISTS idx_list_emails_email ON list_emails(email_address);
CREATE INDEX IF NOT EXISTS idx_list_emails_status ON list_emails(verification_status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to lists table
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lists
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

-- RLS Policies for list_emails
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
