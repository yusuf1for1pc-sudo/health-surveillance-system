CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_org_id uuid;
BEGIN
  -- 1. Create Organization if role is org_admin
  IF (NEW.raw_user_meta_data->>'role' = 'org_admin') THEN
    INSERT INTO public.organizations (
      name,
      type,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      status,
      certificate_status,
      latitude,
      longitude
    ) VALUES (
      NEW.raw_user_meta_data->>'org_name',
      NEW.raw_user_meta_data->>'org_type',
      NEW.email,
      NEW.raw_user_meta_data->>'org_phone',
      NEW.raw_user_meta_data->>'org_address',
      NEW.raw_user_meta_data->>'org_city',
      NEW.raw_user_meta_data->>'org_state',
      NEW.raw_user_meta_data->>'org_country',
      NEW.raw_user_meta_data->>'org_pincode',
      'pending',
      'pending',
      NULLIF(NEW.raw_user_meta_data->>'org_latitude', '')::numeric,
      NULLIF(NEW.raw_user_meta_data->>'org_longitude', '')::numeric
    ) RETURNING id INTO new_org_id;

    -- UPDATE auth.users metadata with new_org_id
    -- This ensures the 'Org admins can read org profiles' RLS policy works correctly
    -- avoiding the need for recursive table queries.
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('organization_id', new_org_id)
    WHERE id = NEW.id;
  END IF;

  -- 2. Insert into profiles (with organization_id if created above)
  INSERT INTO public.profiles (id, email, full_name, role, phone, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    NEW.raw_user_meta_data->>'phone',
    new_org_id
  );

  -- 3. Insert into patients if role is patient
  IF (NEW.raw_user_meta_data->>'role' = 'patient') THEN
    INSERT INTO public.patients (
      id,
      full_name,
      email,
      phone,
      gender,
      date_of_birth,
      blood_type,
      allergies,
      emergency_contact,
      address,
      city,
      state,
      country,
      pincode,
      latitude,
      longitude
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NULLIF(NEW.raw_user_meta_data->>'gender', ''),
      NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::date,
      NULLIF(NEW.raw_user_meta_data->>'blood_type', ''),
      NULLIF(NEW.raw_user_meta_data->>'allergies', ''),
      NULLIF(NEW.raw_user_meta_data->>'emergency_contact', ''),
      NULLIF(NEW.raw_user_meta_data->>'address', ''),
      NULLIF(NEW.raw_user_meta_data->>'city', ''),
      NULLIF(NEW.raw_user_meta_data->>'state', ''),
      NULLIF(NEW.raw_user_meta_data->>'country', ''),
      NULLIF(NEW.raw_user_meta_data->>'pincode', ''),
      NULLIF(NEW.raw_user_meta_data->>'latitude', '')::numeric,
      NULLIF(NEW.raw_user_meta_data->>'longitude', '')::numeric
    );
  END IF;

  RETURN NEW;
END;
$function$;
