-- Add car_benchmark_price to project_assignments safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_assignments' AND column_name = 'car_benchmark_price') THEN
        ALTER TABLE project_assignments ADD COLUMN car_benchmark_price numeric;
    END IF;
END $$;

-- Add car-specific fields to project_rules safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_rules' AND column_name = 'max_daily_car_rate') THEN
        ALTER TABLE project_rules ADD COLUMN max_daily_car_rate numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_rules' AND column_name = 'preferred_car_agencies') THEN
        ALTER TABLE project_rules ADD COLUMN preferred_car_agencies text[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_rules' AND column_name = 'required_car_features') THEN
        ALTER TABLE project_rules ADD COLUMN required_car_features text[];
    END IF;
END $$;

-- Create car_searches table
CREATE TABLE IF NOT EXISTS car_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES project_assignments(id) ON DELETE CASCADE,
  search_params jsonb NOT NULL,
  executed_at timestamptz DEFAULT now()
);

-- Create car_options table
CREATE TABLE IF NOT EXISTS car_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid REFERENCES car_searches(id) ON DELETE CASCADE,
  provider_code text NOT NULL, -- e.g., 'HERTZ', 'AVIS'
  provider_name text NOT NULL,
  vehicle_class text, -- e.g., 'Economy', 'Compact', 'SUV'
  vehicle_description text,
  price_total numeric NOT NULL,
  currency text NOT NULL,
  pickup_location text NOT NULL,
  dropoff_location text NOT NULL,
  pickup_date timestamptz NOT NULL,
  dropoff_date timestamptz NOT NULL,
  image_url text,
  booking_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE car_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_options ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all car searches" ON car_searches;
DROP POLICY IF EXISTS "Admins can create car searches" ON car_searches;
DROP POLICY IF EXISTS "Consultants can view their own car searches" ON car_searches;

DROP POLICY IF EXISTS "Admins can view all car options" ON car_options;
DROP POLICY IF EXISTS "Admins can create car options" ON car_options;
DROP POLICY IF EXISTS "Consultants can view their own car options" ON car_options;

-- RLS Policies for car_searches
CREATE POLICY "Admins can view all car searches"
  ON car_searches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create car searches"
  ON car_searches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Consultants can view their own car searches"
  ON car_searches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE id = car_searches.assignment_id
      AND consultant_id IN (
        SELECT id FROM consultants WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for car_options
CREATE POLICY "Admins can view all car options"
  ON car_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create car options"
  ON car_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Consultants can view their own car options"
  ON car_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM car_searches
      JOIN project_assignments ON car_searches.assignment_id = project_assignments.id
      WHERE car_searches.id = car_options.search_id
      AND project_assignments.consultant_id IN (
        SELECT id FROM consultants WHERE user_id = auth.uid()
      )
    )
  );
