-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('Feature_Request', 'Bug', 'Other')),
  feedback_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by clinic
CREATE INDEX IF NOT EXISTS idx_feedback_clinic_id ON feedback(clinic_id);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Create index for faster queries by type
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);

-- Create index for faster queries by created_at
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to insert their own feedback
CREATE POLICY feedback_insert_policy ON feedback
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND clinic_id IN (
      SELECT clinic_id FROM users WHERE user_id = auth.uid()
    )
  );

-- Create RLS policy for users to view their own feedback
CREATE POLICY feedback_select_policy ON feedback
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR clinic_id IN (
      SELECT clinic_id FROM users WHERE user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_feedback_timestamp
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();
