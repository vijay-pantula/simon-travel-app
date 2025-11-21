/*
  # Add origin and destination fields to flight_options

  1. Changes
    - Add `origin_airport` column to store departure airport code (e.g., TPA)
    - Add `destination_airport` column to store arrival airport code (e.g., LAX)
    
  2. Purpose
    - Enable generation of proper booking URLs with specific airport codes
    - Support deep linking to flight booking sites with exact search parameters
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flight_options' AND column_name = 'origin_airport'
  ) THEN
    ALTER TABLE flight_options ADD COLUMN origin_airport text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flight_options' AND column_name = 'destination_airport'
  ) THEN
    ALTER TABLE flight_options ADD COLUMN destination_airport text;
  END IF;
END $$;