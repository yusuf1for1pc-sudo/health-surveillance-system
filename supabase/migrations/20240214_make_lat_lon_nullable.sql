-- Make latitude and longitude nullable in patients table
-- This prevents registration failure if precise location cannot be determined
ALTER TABLE patients ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN longitude DROP NOT NULL;
