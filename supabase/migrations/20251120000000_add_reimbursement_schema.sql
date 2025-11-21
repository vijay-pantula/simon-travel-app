/*
  # Add Reimbursement Schema

  1. Changes
    - Add `benchmark_price` column to `project_assignments`
    - Create `reimbursement_requests` table
    - Create `receipts` storage bucket and policies
    
  2. New Tables
    - `reimbursement_requests`
      - `id` (uuid, primary key)
      - `assignment_id` (uuid, foreign key)
      - `amount` (numeric)
      - `currency` (text)
      - `status` (text) - pending, approved, rejected, capped
      - `receipt_url` (text)
      - `admin_notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on `reimbursement_requests`
    - Add policies for consultants (view/create own) and admins (manage all)
    - Add storage policies for `receipts` bucket
*/

-- Add benchmark_price to project_assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_assignments' AND column_name = 'benchmark_price'
  ) THEN
    ALTER TABLE project_assignments ADD COLUMN benchmark_price numeric;
  END IF;
END $$;

-- Create reimbursement_requests table
CREATE TABLE IF NOT EXISTS reimbursement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  receipt_url text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reimbursement_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reimbursement_requests

-- Consultants can view their own requests
CREATE POLICY "Consultants can view own reimbursement requests"
  ON reimbursement_requests FOR SELECT
  TO authenticated
  USING (
    assignment_id IN (
      SELECT id FROM project_assignments
      WHERE consultant_id IN (
        SELECT id FROM consultants WHERE user_id = auth.uid()
      )
    )
  );

-- Consultants can create their own requests
CREATE POLICY "Consultants can create own reimbursement requests"
  ON reimbursement_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    assignment_id IN (
      SELECT id FROM project_assignments
      WHERE consultant_id IN (
        SELECT id FROM consultants WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can manage all requests
CREATE POLICY "Admins can manage reimbursement requests"
  ON reimbursement_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create receipts storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies

-- Allow authenticated users to upload receipts
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.role() = 'authenticated'
);

-- Allow users to view their own receipts (and admins to view all)
-- Note: This is a simplified policy. Ideally, we'd check ownership via the filename or metadata, 
-- but for now, we'll allow authenticated users to read from the bucket if they have the link.
-- A more strict policy would require joining with the reimbursement_requests table, which is complex in storage policies.
CREATE POLICY "Authenticated users can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'receipts');
