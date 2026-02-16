-- Add latitude and longitude columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS longitude NUMERIC;
