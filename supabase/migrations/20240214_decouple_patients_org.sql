-- Make patients.organization_id nullable to allow global patient identity
ALTER TABLE patients ALTER COLUMN organization_id DROP NOT NULL;

-- Ensure medical_records.organization_id is NOT NULL (authoritative link)
-- Note: It might already be NOT NULL, but enforcing it here ensures the requirement.
ALTER TABLE medical_records ALTER COLUMN organization_id SET NOT NULL;

-- Ensure patients has profile_id for linkage (already exists, but good to verify if we were doing a full schema script)
-- ALTER TABLE patients ALTER COLUMN profile_id DROP NOT NULL; -- It's usually null for non-signup patients
