-- Create water_entries table
CREATE TABLE IF NOT EXISTS water_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  glasses_consumed INTEGER NOT NULL CHECK (glasses_consumed >= 0),
  ist_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ist_date)
);

-- Add RLS policies
ALTER TABLE water_entries ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own water entries
CREATE POLICY "Users can read their own water entries"
  ON water_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own water entries
CREATE POLICY "Users can insert their own water entries"
  ON water_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own water entries
CREATE POLICY "Users can update their own water entries"
  ON water_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX water_entries_user_id_ist_date_idx ON water_entries(user_id, ist_date);

-- Add comment
COMMENT ON TABLE water_entries IS 'Stores daily water intake records for users'; 