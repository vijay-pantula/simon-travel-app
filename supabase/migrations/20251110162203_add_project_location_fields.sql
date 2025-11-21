/*
  # Add Project Location Fields

  ## Changes
  - Add `project_location` column to store full address where consultants need to go
  - Add `project_city` column to store city for flight search purposes
  
  ## Fields Added
  1. `project_location` (text): Full address of the project site
  2. `project_city` (text): City name used for finding flights
  
  ## Notes
  - Both fields are optional to maintain compatibility with existing data
  - project_city will be used by flight search functionality
*/

-- Add project_location column for full address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_location'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_location text;
  END IF;
END $$;

-- Add project_city column for flight search
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_city'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_city text;
  END IF;
END $$;