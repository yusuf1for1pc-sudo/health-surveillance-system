-- Migration to ensure phone column can store international format (e.g., +91...)
-- Changes column type to TEXT to remove length constraints
ALTER TABLE patients ALTER COLUMN phone TYPE text;

-- Also fix profiles table which stores the user's phone number
ALTER TABLE profiles ALTER COLUMN phone TYPE text;
