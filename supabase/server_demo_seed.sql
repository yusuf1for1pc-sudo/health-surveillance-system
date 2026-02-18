-- 0. Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Cleanup Old Demo Data (Order matters for FK constraints!)

-- First, delete medical records created by OR linked to demo users
DELETE FROM public.medical_records 
WHERE created_by IN (SELECT id FROM public.profiles WHERE email LIKE '%@tempest.demo')
   OR organization_id IN (SELECT id FROM public.organizations WHERE email = 'demo@tempest.health');

-- Second, delete patients created by demo users
DELETE FROM public.patients 
WHERE created_by IN (SELECT id FROM public.profiles WHERE email LIKE '%@tempest.demo');

-- Third, delete the users (Cascades to profiles)
DELETE FROM auth.users WHERE email IN (
    'admin_demo@tempest.demo',
    'government_demo@tempest.demo',
    'org_admin_demo@tempest.demo',
    'doctor_demo@tempest.demo',
    'lab_demo@tempest.demo',
    'patient_demo@tempest.demo'
);

-- Fourth, delete orphaned demo organization
DELETE FROM public.organizations WHERE email = 'demo@tempest.health' OR name = 'Tempest Demo Hospital';

-- 2. Create Platform Admin
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'admin_demo@tempest.demo', 
    crypt('Demo@123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"platform_admin","full_name":"Platform Admin Demo"}', 
    now(), now()
);

-- 3. Create Government User
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'government_demo@tempest.demo', 
    crypt('Demo@123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"government","full_name":"Government Demo"}', 
    now(), now()
);

-- 4. Create Org Admin (Trigger will create Organization as Pending)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'org_admin_demo@tempest.demo', 
    crypt('Demo@123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"org_admin","full_name":"Org Admin Demo","org_name":"Tempest Demo Hospital","org_type":"Hospital","org_phone":"9999999999","org_city":"Mumbai","org_state":"Maharashtra","org_country":"India","org_pincode":"400001","org_address":"Demo City"}', 
    now(), now()
);

-- Fix Organization Details and Get ID
UPDATE public.organizations 
SET 
  status = 'approved', 
  certificate_status = 'verified',
  email = 'demo@tempest.health'
WHERE name = 'Tempest Demo Hospital' OR email = 'org_admin_demo@tempest.demo';

-- 5. Create Doctor
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'doctor_demo@tempest.demo', 
    crypt('Demo@123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"doctor","full_name":"Dr. Demo"}', 
    now(), now()
);
-- Link Doctor to Org in Profiles AND Auth Metadata
DO $$
DECLARE
  org_id uuid;
BEGIN
  SELECT id INTO org_id FROM public.organizations WHERE name = 'Tempest Demo Hospital' LIMIT 1;
  
  -- Update Profile
  UPDATE public.profiles 
  SET organization_id = org_id 
  WHERE email = 'doctor_demo@tempest.demo';
  
  -- Update Auth Metadata
  UPDATE auth.users 
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('organization_id', org_id)
  WHERE email = 'doctor_demo@tempest.demo';
END $$;


-- 6. Create Lab Staff
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'lab_demo@tempest.demo', 
    crypt('Demo@123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"lab_staff","full_name":"Lab Demo"}', 
    now(), now()
);
-- Link Lab Staff to Org in Profiles AND Auth Metadata
DO $$
DECLARE
  org_id uuid;
BEGIN
  SELECT id INTO org_id FROM public.organizations WHERE name = 'Tempest Demo Hospital' LIMIT 1;
  
  -- Update Profile
  UPDATE public.profiles 
  SET organization_id = org_id 
  WHERE email = 'lab_demo@tempest.demo';
  
  -- Update Auth Metadata
  UPDATE auth.users 
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('organization_id', org_id)
  WHERE email = 'lab_demo@tempest.demo';
END $$;


-- 7. Create Demo Patient (Login Account)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'patient_demo@tempest.demo', 
    crypt('Demo@123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"patient","full_name":"Patient Demo"}', 
    now(), now()
);
-- Update Demo Patient details
UPDATE public.patients
SET 
    city = 'Mumbai', 
    state = 'Maharashtra', 
    country = 'India',
    latitude = 19.0760,
    longitude = 72.8777,
    created_by = (SELECT id FROM public.profiles WHERE email = 'doctor_demo@tempest.demo')
WHERE email = 'patient_demo@tempest.demo';


-- 8. Seed Bulk Patients
INSERT INTO public.patients (
    id, full_name, email, phone, gender, date_of_birth, blood_type, 
    city, state, country, pincode, latitude, longitude, created_by, created_at
)
SELECT
    gen_random_uuid(),
    'Demo Patient ' || generate_series,
    'demo_pt_' || generate_series || '@tempest.dummy',
    '99990000' || lpad(generate_series::text, 2, '0'),
    CASE WHEN random() > 0.5 THEN 'Male' ELSE 'Female' END,
    (CURRENT_DATE - (floor(random() * 20000) || ' days')::interval)::date,
    'O+',
    'Mumbai', 'Maharashtra', 'India', '400001',
    19.07 + (random() * 0.08 - 0.04),
    72.87 + (random() * 0.08 - 0.04),
    (SELECT id FROM public.profiles WHERE email = 'doctor_demo@tempest.demo'),
    now()
FROM generate_series(1, 20);

-- 9. Seed Medical Records
INSERT INTO public.medical_records (
    id, patient_id, organization_id, created_by, creator_name, record_type,
    title, diagnosis, icd_code, icd_label, description, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    p.id,
    (SELECT id FROM public.organizations WHERE name = 'Tempest Demo Hospital'),
    (SELECT id FROM public.profiles WHERE email = 'doctor_demo@tempest.demo'),
    'Dr. Demo',
    'Clinical Note',
    CASE floor(random()*10)
        WHEN 0 THEN 'Dengue Fever'
        WHEN 1 THEN 'Dengue Fever'
        WHEN 2 THEN 'Dengue Fever'
        WHEN 3 THEN 'Flu Symptoms'
        WHEN 4 THEN 'Flu Symptoms'
        WHEN 5 THEN 'COVID-19 Positive'
        WHEN 6 THEN 'Malaria Test'
        ELSE 'General Checkup'
    END,
    'Provisional Diagnosis',
    CASE floor(random()*10)
        WHEN 0 THEN 'A90'
        WHEN 1 THEN 'A90'
        WHEN 2 THEN 'A90'
        WHEN 3 THEN 'J09'
        WHEN 4 THEN 'J09'
        WHEN 5 THEN 'U07.1'
        WHEN 6 THEN 'B51'
        ELSE 'Z00.0'
    END,
    'ICD Label',
    'Auto-generated demo record.',
    NOW() - (floor(random() * 30) || ' days')::interval,
    NOW()
FROM public.patients p
WHERE p.created_by = (SELECT id FROM public.profiles WHERE email = 'doctor_demo@tempest.demo')
OR p.email = 'patient_demo@tempest.demo';

-- 10. Generate Alerts
SELECT public.refresh_gov_analytics();
SELECT public.generate_alerts();
