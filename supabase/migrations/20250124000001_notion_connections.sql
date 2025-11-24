-- Create notion_connections table
CREATE TABLE IF NOT EXISTS notion_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  workspace_name TEXT NOT NULL,
  workspace_icon TEXT,
  bot_id TEXT NOT NULL,
  selected_database_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notion_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own Notion connections"
  ON notion_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Notion connections"
  ON notion_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Notion connections"
  ON notion_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Notion connections"
  ON notion_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_notion_connections_user_id ON notion_connections(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notion_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notion_connections_updated_at
  BEFORE UPDATE ON notion_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_notion_connections_updated_at();
