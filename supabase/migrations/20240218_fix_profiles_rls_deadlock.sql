-- Fix recursive RLS policies on profiles table

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Org admins can read org profiles" ON profiles;

-- 2. Create a secure function to check role WITHOUT triggering RLS recursively
-- We use SECURITY DEFINER to bypass RLS on the profiles table lookup
CREATE OR REPLACE FUNCTION public.get_my_role_secure()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First try to get from JWT metadata (fastest, no DB lookup)
  -- This breaks the recursion loop immediately
  IF current_setting('request.jwt.claim.user_metadata', true)::jsonb ? 'role' THEN
    RETURN (current_setting('request.jwt.claim.user_metadata', true)::jsonb ->> 'role');
  END IF;

  -- Fallback to DB lookup if metadata is missing (should be rare)
  -- SECURITY DEFINER ensures this select doesn't trigger the caller's RLS
  RETURN (SELECT role::text FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- 3. Re-create the policies using the new secure function (or direct JWT check)

-- Policy: Platform Admins can read all profiles
CREATE POLICY "Admins can read all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'platform_admin'
  OR 
  get_my_role_secure() = 'platform_admin'
);

-- Policy: Org Admins can read profiles in their organization
CREATE POLICY "Org admins can read org profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'org_admin' 
  AND 
  organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
);
