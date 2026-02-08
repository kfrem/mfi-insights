-- License keys table for server-side license validation
-- Replaces hardcoded client-side license codes

CREATE TABLE IF NOT EXISTS license_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('TRIAL', 'STARTER', 'PRO', 'ENTERPRISE')),
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  max_users INTEGER NOT NULL DEFAULT 5,
  valid_days INTEGER NOT NULL DEFAULT 365,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  used_by_org_id UUID REFERENCES organisations(org_id),
  notes TEXT
);

-- RLS: license_keys is accessed via RPC function, not direct queries
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;

-- Only allow reading license keys via the validate_license_key function (no direct SELECT)
-- Admins of an org can see their own used license
CREATE POLICY "org_admins_view_own_license"
  ON license_keys FOR SELECT
  USING (
    used_by_org_id IS NOT NULL
    AND user_belongs_to_org(auth.uid(), used_by_org_id)
    AND is_executive(auth.uid(), used_by_org_id)
  );

-- RPC function to validate and claim a license key (runs as SECURITY DEFINER)
CREATE OR REPLACE FUNCTION validate_license_key(license_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_record RECORD;
BEGIN
  -- Normalize the input
  license_code := UPPER(TRIM(license_code));

  -- Validate input
  IF license_code IS NULL OR license_code = '' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License code is required');
  END IF;

  -- Look up the key
  SELECT * INTO key_record
  FROM license_keys
  WHERE code = license_code;

  -- Key not found
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid license code');
  END IF;

  -- Key already used
  IF key_record.is_used THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This license code has already been used');
  END IF;

  -- Key is valid — return details (don't mark as used yet; that happens during org creation)
  RETURN jsonb_build_object(
    'valid', true,
    'tier', key_record.tier,
    'max_users', key_record.max_users,
    'valid_days', key_record.valid_days
  );
END;
$$;

-- Function to claim a license key during org registration
CREATE OR REPLACE FUNCTION claim_license_key(license_code TEXT, org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  license_code := UPPER(TRIM(license_code));

  UPDATE license_keys
  SET is_used = TRUE,
      used_at = now(),
      used_by_org_id = org_id
  WHERE code = license_code
    AND is_used = FALSE;

  RETURN FOUND;
END;
$$;

-- Seed some initial license keys for launch
INSERT INTO license_keys (code, tier, max_users, valid_days, notes) VALUES
  ('MFI-2024-TRIAL',      'TRIAL',      3,   30,  'Trial license - 30 days'),
  ('MFI-2024-STARTER',    'STARTER',    10,  365, 'Starter tier - 1 year'),
  ('MFI-2024-PRO',        'PRO',        50,  365, 'Professional tier - 1 year'),
  ('MFI-2024-ENTERPRISE', 'ENTERPRISE', 200, 365, 'Enterprise tier - 1 year');
