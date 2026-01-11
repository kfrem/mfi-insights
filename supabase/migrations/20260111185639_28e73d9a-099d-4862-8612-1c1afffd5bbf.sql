-- SECURITY HARDENING: Add NULL checks and authentication validation to all helper functions
-- This prevents potential bypass attacks where NULL parameters could cause unexpected behavior

-- 1. Harden user_belongs_to_org - requires valid user_id and org_id
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Reject NULL parameters - prevents bypass attacks
    WHEN _user_id IS NULL OR _org_id IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1
      FROM public.user_organizations
      WHERE user_id = _user_id
        AND org_id = _org_id
    )
  END
$$;

-- 2. Harden has_role - requires valid user_id, org_id, and role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _org_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Reject NULL parameters
    WHEN _user_id IS NULL OR _org_id IS NULL OR _role IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND org_id = _org_id
        AND role = _role
    )
  END
$$;

-- 3. Harden has_any_role
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _org_id IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND org_id = _org_id
    )
  END
$$;

-- 4. Harden is_executive
CREATE OR REPLACE FUNCTION public.is_executive(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _org_id IS NULL THEN FALSE
    ELSE has_role(_user_id, _org_id, 'ADMIN') 
      OR has_role(_user_id, _org_id, 'MANAGER')
  END
$$;

-- 5. Harden is_board_member
CREATE OR REPLACE FUNCTION public.is_board_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _org_id IS NULL THEN FALSE
    ELSE has_role(_user_id, _org_id, 'BOARD_DIRECTOR')
  END
$$;

-- 6. Harden can_access_client
CREATE OR REPLACE FUNCTION public.can_access_client(_user_id uuid, _org_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Reject NULL parameters
    WHEN _user_id IS NULL OR _org_id IS NULL OR _client_id IS NULL THEN FALSE
    -- Must belong to org first (defense in depth)
    WHEN NOT user_belongs_to_org(_user_id, _org_id) THEN FALSE
    -- Executives and board members can access all clients in their org
    WHEN is_executive(_user_id, _org_id) OR is_board_member(_user_id, _org_id) THEN TRUE
    -- Field officers can only access clients assigned to them
    ELSE EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = _client_id 
      AND c.org_id = _org_id
      AND c.assigned_officer_id = _user_id
    )
  END
$$;

-- 7. Harden can_access_loan
CREATE OR REPLACE FUNCTION public.can_access_loan(_user_id uuid, _org_id uuid, _loan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Reject NULL parameters
    WHEN _user_id IS NULL OR _org_id IS NULL OR _loan_id IS NULL THEN FALSE
    -- Must belong to org first
    WHEN NOT user_belongs_to_org(_user_id, _org_id) THEN FALSE
    -- Executives and board members can access all loans in their org
    WHEN is_executive(_user_id, _org_id) OR is_board_member(_user_id, _org_id) THEN TRUE
    -- Field officers can only access loans for clients assigned to them
    ELSE EXISTS (
      SELECT 1 FROM public.loans l
      JOIN public.clients c ON l.client_id = c.client_id
      WHERE l.loan_id = _loan_id 
      AND l.org_id = _org_id
      AND c.assigned_officer_id = _user_id
    )
  END
$$;

-- 8. Add helper function to verify authenticated user
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;