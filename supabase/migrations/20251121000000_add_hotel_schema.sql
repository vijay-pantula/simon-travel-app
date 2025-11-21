-- Create hotel_searches table
CREATE TABLE IF NOT EXISTS hotel_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES project_assignments(id) ON DELETE CASCADE,
  search_params jsonb NOT NULL,
  executed_at timestamptz DEFAULT now()
);

-- Create hotel_options table
CREATE TABLE IF NOT EXISTS hotel_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid REFERENCES hotel_searches(id) ON DELETE CASCADE,
  hotel_name text NOT NULL,
  hotel_chain_code text,
  city_code text NOT NULL,
  price_total numeric NOT NULL,
  currency text DEFAULT 'USD',
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  rating text,
  amenities text[],
  booking_url text,
  created_at timestamptz DEFAULT now()
);

-- Add hotel-specific fields to project_rules safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_rules' AND column_name = 'max_nightly_rate') THEN
        ALTER TABLE project_rules ADD COLUMN max_nightly_rate numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_rules' AND column_name = 'preferred_hotel_chains') THEN
        ALTER TABLE project_rules ADD COLUMN preferred_hotel_chains text[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_rules' AND column_name = 'required_hotel_amenities') THEN
        ALTER TABLE project_rules ADD COLUMN required_hotel_amenities text[];
    END IF;
END $$;

-- Enable RLS
ALTER TABLE hotel_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_options ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all hotel searches" ON hotel_searches;
DROP POLICY IF EXISTS "Admins can create hotel searches" ON hotel_searches;
DROP POLICY IF EXISTS "Consultants can view their own assignment searches" ON hotel_searches;

DROP POLICY IF EXISTS "Admins can view all hotel options" ON hotel_options;
DROP POLICY IF EXISTS "Admins can create hotel options" ON hotel_options;
DROP POLICY IF EXISTS "Consultants can view options for their assignments" ON hotel_options;

-- RLS Policies for hotel_searches
CREATE POLICY "Admins can view all hotel searches"
  ON hotel_searches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create hotel searches"
  ON hotel_searches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Consultants can view their own assignment searches"
  ON hotel_searches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_assignments.id = hotel_searches.assignment_id
      AND project_assignments.consultant_id IN (
        SELECT id FROM consultants WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for hotel_options
CREATE POLICY "Admins can view all hotel options"
  ON hotel_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create hotel options"
  ON hotel_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Consultants can view options for their assignments"
  ON hotel_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hotel_searches
      JOIN project_assignments ON project_assignments.id = hotel_searches.assignment_id
      WHERE hotel_searches.id = hotel_options.search_id
      AND project_assignments.consultant_id IN (
        SELECT id FROM consultants WHERE user_id = auth.uid()
      )
    )
  );
