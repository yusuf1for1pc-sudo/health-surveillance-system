-- Grant permissions on the sequence to authenticated users
GRANT USAGE, SELECT ON SEQUENCE public.patient_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.patient_id_seq TO service_role;

-- Grant table permissions (just in case)
GRANT ALL ON TABLE public.patients TO authenticated;
GRANT ALL ON TABLE public.patients TO service_role;

-- Make the trigger function SECURITY DEFINER to ensure it runs with owner privileges
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.patient_id IS NULL OR NEW.patient_id = '' THEN
    NEW.patient_id := 'TMP-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('public.patient_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;
