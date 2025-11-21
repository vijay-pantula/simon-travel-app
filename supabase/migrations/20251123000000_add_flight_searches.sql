-- Create flight_searches table for consistency with hotel_searches and car_searches
CREATE TABLE IF NOT EXISTS flight_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES project_assignments(id) ON DELETE CASCADE,
  search_params jsonb NOT NULL,
  executed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE flight_searches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all flight searches" ON flight_searches;
DROP POLICY IF EXISTS "Admins can create flight searches" ON flight_searches;
DROP POLICY IF EXISTS "Consultants can view their own assignment searches" ON flight_searches;

-- RLS Policies for flight_searches
CREATE POLICY "Admins can view all flight searches"
  ON flight_searches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create flight searches"
  ON flight_searches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Consultants can view their own assignment searches"
  ON flight_searches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_assignments.id = flight_searches.assignment_id
      AND project_assignments.consultant_id IN (
        SELECT id FROM consultants WHERE user_id = auth.uid()
      )
    )
  );

-- Add search_id foreign key to flight_options to link to flight_searches safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_options' AND column_name = 'search_id') THEN
        ALTER TABLE flight_options ADD COLUMN search_id uuid REFERENCES flight_searches(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_flight_searches_assignment ON flight_searches(assignment_id);
CREATE INDEX IF NOT EXISTS idx_flight_options_search ON flight_options(search_id);
