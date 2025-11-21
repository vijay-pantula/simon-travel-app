-- Rename benchmark_price to flight_benchmark_price
ALTER TABLE project_assignments 
RENAME COLUMN benchmark_price TO flight_benchmark_price;

-- Add hotel_benchmark_price
ALTER TABLE project_assignments 
ADD COLUMN IF NOT EXISTS hotel_benchmark_price numeric;

-- Add category to reimbursement_requests
ALTER TABLE reimbursement_requests 
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('flight', 'hotel', 'other')) DEFAULT 'other';
