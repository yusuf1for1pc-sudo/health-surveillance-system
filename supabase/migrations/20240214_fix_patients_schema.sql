-- Ensure Gender Check Constraint exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_gender_check') THEN
        ALTER TABLE patients ADD CONSTRAINT patients_gender_check 
        CHECK (gender IN ('Male', 'Female', 'Other'));
    END IF;
END $$;

-- Ensure Patient ID generation function exists
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.patient_id IS NULL OR NEW.patient_id = '' THEN
    NEW.patient_id := 'TMP-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('public.patient_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure Patient ID sequence exists (for the function above)
CREATE SEQUENCE IF NOT EXISTS public.patient_id_seq;

-- Ensure Trigger exists
DROP TRIGGER IF EXISTS set_patient_id ON patients;
CREATE TRIGGER set_patient_id
BEFORE INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION generate_patient_id();
