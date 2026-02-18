-- Drop the old metadata-dependent policy
DROP POLICY IF EXISTS "Staff can create records" ON medical_records;

-- Create new policy validation against profiles table
CREATE POLICY "Staff can create records" ON medical_records
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('doctor', 'lab_staff')
    AND organization_id = medical_records.organization_id
  )
);
