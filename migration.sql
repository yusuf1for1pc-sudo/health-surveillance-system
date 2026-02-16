-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Identity)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('platform_admin', 'org_admin', 'doctor', 'lab_staff', 'patient', 'government')),
    organization_id UUID, -- FK will be added after organizations table
    phone TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Hospital, Clinic, Laboratory
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    pincode TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    certificate_url TEXT,
    certificate_status TEXT DEFAULT 'pending' CHECK (certificate_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if table exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'city') THEN
        ALTER TABLE public.organizations ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'state') THEN
        ALTER TABLE public.organizations ADD COLUMN state TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'country') THEN
        ALTER TABLE public.organizations ADD COLUMN country TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'pincode') THEN
        ALTER TABLE public.organizations ADD COLUMN pincode TEXT;
    END IF;
END $$;

-- Link profiles to organizations (Constraint)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_organization_id_fkey'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
    END IF;
END $$;

-- 3. PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id TEXT UNIQUE NOT NULL, -- TMP-YYYY-XXXX
    profile_id UUID REFERENCES public.profiles(id),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    gender TEXT,
    date_of_birth DATE,
    blood_type TEXT,
    allergies TEXT,
    emergency_contact TEXT,
    address TEXT,
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    country TEXT DEFAULT '',
    pincode TEXT DEFAULT '',
    organization_id UUID REFERENCES public.organizations(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing location columns to patients
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'city') THEN
        ALTER TABLE public.patients ADD COLUMN city TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'state') THEN
        ALTER TABLE public.patients ADD COLUMN state TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'country') THEN
        ALTER TABLE public.patients ADD COLUMN country TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'pincode') THEN
        ALTER TABLE public.patients ADD COLUMN pincode TEXT DEFAULT '';
    END IF;
END $$;

-- 4. ICD CODES
CREATE TABLE IF NOT EXISTS public.icd_codes (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    body_system TEXT,
    description TEXT
);

-- Seed ICD Codes (Subset)
INSERT INTO public.icd_codes (code, name, category) VALUES
('A00', 'Cholera', 'Infectious'),
('A01', 'Typhoid and paratyphoid fevers', 'Infectious'),
('A09', 'Infectious gastroenteritis and colitis', 'Infectious'),
('J00', 'Acute nasopharyngitis (common cold)', 'Respiratory'),
('J18', 'Pneumonia, unspecified organism', 'Respiratory'),
('U07.1', 'COVID-19, virus identified', 'Viral'),
('E11', 'Type 2 diabetes mellitus', 'Endocrine'),
('I10', 'Essential (primary) hypertension', 'Cardiovascular')
ON CONFLICT (code) DO NOTHING;

-- 5. MEDICAL RECORDS
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    record_type TEXT NOT NULL, -- Prescription, Lab Report, Clinical Note
    icd_code TEXT REFERENCES public.icd_codes(code),
    icd_label TEXT,
    title TEXT NOT NULL,
    description TEXT, -- Maps to 'notes'
    diagnosis TEXT,
    attachment_url TEXT,
    attachment_name TEXT,
    creator_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id),
    uploaded_by UUID REFERENCES public.profiles(id),
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES (Idempotent)
DO $$
BEGIN
    -- PROFILES
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- ORGANIZATIONS
    ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Orgs viewable by everyone') THEN
        CREATE POLICY "Orgs viewable by everyone" ON public.organizations FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Orgs insertable by users') THEN
        CREATE POLICY "Orgs insertable by users" ON public.organizations FOR INSERT WITH CHECK (true);
    END IF;

    -- PATIENTS
    ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Patients viewable by authenticated') THEN
        CREATE POLICY "Patients viewable by authenticated" ON public.patients FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Patients insertable by authenticated') THEN
        CREATE POLICY "Patients insertable by authenticated" ON public.patients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- MEDICAL RECORDS
    ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_records' AND policyname = 'Records viewable by authenticated') THEN
        CREATE POLICY "Records viewable by authenticated" ON public.medical_records FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_records' AND policyname = 'Records insertable by authenticated') THEN
        CREATE POLICY "Records insertable by authenticated" ON public.medical_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- ICD CODES
    ALTER TABLE public.icd_codes ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'icd_codes' AND policyname = 'ICD codes viewable by everyone') THEN
        CREATE POLICY "ICD codes viewable by everyone" ON public.icd_codes FOR SELECT USING (true);
    END IF;

END $$;
