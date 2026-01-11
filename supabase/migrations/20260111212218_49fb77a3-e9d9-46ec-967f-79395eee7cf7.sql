-- 1) Tighten profiles SELECT access: only profile owner OR executives (ADMIN/MANAGER) in a shared org
DROP POLICY IF EXISTS "Users can view profiles of users in their org" ON public.profiles;

CREATE POLICY "Owner or executives can view profiles" ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.user_organizations viewer
    JOIN public.user_organizations target
      ON target.org_id = viewer.org_id
    WHERE viewer.user_id = auth.uid()
      AND target.user_id = profiles.user_id
      AND public.is_executive(auth.uid(), viewer.org_id)
  )
);

-- (Keep UPDATE policy: users update own profile)


-- 2) Prevent non-executives from changing client assignments + server-side audit trail
CREATE OR REPLACE FUNCTION public.enforce_client_assignment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only validate when assignment changes
  IF NEW.assigned_officer_id IS DISTINCT FROM OLD.assigned_officer_id THEN

    -- Must be authenticated
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Only executives may change assignments
    IF NOT public.is_executive(auth.uid(), NEW.org_id) THEN
      RAISE EXCEPTION 'Only executives can change client assignments';
    END IF;

    -- Server-side audit log (tamper-resistant)
    INSERT INTO public.activity_audit_log (
      org_id,
      action_type,
      entity_type,
      entity_id,
      old_values,
      new_values,
      user_id,
      user_agent,
      metadata
    ) VALUES (
      NEW.org_id,
      'CLIENT_ASSIGNMENT_CHANGED',
      'CLIENT',
      NEW.client_id,
      jsonb_build_object('assigned_officer_id', OLD.assigned_officer_id),
      jsonb_build_object('assigned_officer_id', NEW.assigned_officer_id),
      auth.uid(),
      NULL,
      jsonb_build_object('source', 'db_trigger')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_client_assignment_change ON public.clients;
CREATE TRIGGER trg_enforce_client_assignment_change
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.enforce_client_assignment_change();


-- 3) Remove direct INSERTs into activity_audit_log; route through a server-side function
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.activity_audit_log;

CREATE OR REPLACE FUNCTION public.log_activity(
  _org_id uuid,
  _action_type text,
  _entity_type text,
  _entity_id uuid DEFAULT NULL,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _org_id IS NULL OR _action_type IS NULL OR _entity_type IS NULL THEN
    RAISE EXCEPTION 'Missing required fields';
  END IF;

  IF NOT public.user_belongs_to_org(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  INSERT INTO public.activity_audit_log (
    org_id,
    action_type,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata,
    user_id,
    user_agent
  ) VALUES (
    _org_id,
    _action_type,
    _entity_type,
    _entity_id,
    _old_values,
    _new_values,
    _metadata,
    auth.uid(),
    NULL
  );
END;
$$;

-- Ensure only authenticated users can call it
REVOKE ALL ON FUNCTION public.log_activity(uuid, text, text, uuid, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_activity(uuid, text, text, uuid, jsonb, jsonb, jsonb) TO authenticated;

-- Executives/board can still VIEW logs via existing SELECT policy (already in place)
