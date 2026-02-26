# Supabase RLS Expert Briefing — MFI Insights

**Project:** MFI Insights (Microfinance Institution SaaS Dashboard)
**Supabase Project ID:** `udovvvksoemsmadaueqf`
**Supabase URL:** `https://udovvvksoemsmadaueqf.supabase.co`
**Date:** 2026-02-26
**Stack:** React + TypeScript (Vite), Supabase (PostgreSQL + Auth + PostgREST)

---

## The Problem

Every time a new user registers and tries to create their organisation during onboarding, the following error fires:

```
new row violates row-level security policy for table "organisations"
```

This has been reproduced **consistently across every new user account** — approximately 55 recorded failures. The onboarding flow is completely broken for new users. Existing users with an org already created are unaffected.

---

## What Happens (User Flow)

1. New user signs up via Supabase Auth (email/password)
2. They are redirected to `/onboarding`
3. They fill in organisation details and click **Create Organisation**
4. The app calls `supabase.rpc('create_organisation_with_admin', { ... })`
5. **Error fires:** `new row violates row-level security policy for table "organisations"`
6. Organisation is never created; user is stuck

---

## Root Cause Analysis

### The Chicken-and-Egg Problem

The `organisations` table has RLS enabled. The original INSERT policy was:

```sql
CREATE POLICY "Authenticated users can create organisations"
ON public.organisations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

This looks correct. However the **full INSERT sequence** during onboarding is:

1. INSERT into `organisations` → get `org_id`
2. INSERT into `user_organizations` (links user ↔ org)
3. INSERT into `user_roles` (assigns ADMIN role)
4. INSERT into `organisation_settings` (creates default settings)

The `user_organizations` and `user_roles` tables have SELECT policies that call `user_belongs_to_org(auth.uid(), org_id)`. Before step 2 completes, the user has **no org membership**, so subsequent operations can fail or block.

Additionally, in Supabase Cloud the exact behaviour of `SECURITY DEFINER` functions and `SET row_security = off` depends on the function **owner's** privileges — and this has been inconsistent.

---

## Fix Attempts (8 commits over 3 days)

### Attempt 1 — 2026-02-23: `6718f6c`
**"Fix onboarding RLS grants"**
- Added `GRANT SELECT, INSERT, UPDATE ON public.organisations TO authenticated`
- Result: Error persisted

### Attempt 2 — 2026-02-23: `9fffc51`
**"Migrate RLS to permissive"**
Applied migration `20260223083729`:
```sql
DROP POLICY IF EXISTS "Authenticated users can create organisations" ON public.organisations;
CREATE POLICY "Authenticated users can create organisations"
ON public.organisations FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
```
- Made all policies `PERMISSIVE` (not `RESTRICTIVE`)
- Result: Error persisted

### Attempt 3 — 2026-02-23: `5c153e7`
**"Reloaded PostgREST schema"**
- Ran `NOTIFY pgrst, 'reload schema'`
- Result: Error persisted

### Attempt 4 — 2026-02-23: `a0218f2`
**"Unify auth with local client"**
Applied migration `20260223091328`:
- Granted all table permissions explicitly via `DO $$ EXECUTE ... $$`
- Re-ran `NOTIFY pgrst, 'reload schema'`
- Result: Error persisted

### Attempt 5 — 2026-02-26: `f372830`
**"Fix onboarding RLS error via SECURITY DEFINER function"**
Applied migration `20260226120000`:
- Created `public.create_organisation_with_admin(...)` as `SECURITY DEFINER` with `SET row_security = off`
- Changed `OrganisationOnboarding.tsx` to call `supabase.rpc('create_organisation_with_admin', ...)` instead of direct inserts
- Result: Error persisted

### Attempt 6 — 2026-02-26: `89c6fc7`
**"Fix RLS bypass in create_organisation_with_admin function"**
Applied migration `20260226130000`:
- Dropped and recreated function
- Added `ALTER FUNCTION ... OWNER TO postgres` (to ensure BYPASSRLS)
- Changed organisations INSERT policy to `WITH CHECK (true)` (removed `auth.uid() IS NOT NULL` check)
- Changed organisation_settings INSERT policy to `WITH CHECK (true)`
- Result: Error persisted

### Attempt 7 — 2026-02-26: `16a5ed1`
**"Switch Supabase project to Ramotar Holding"**
- Confirmed the correct project ID (`udovvvksoemsmadaueqf`) in `supabase/config.toml`
- Previous attempts may have been targeting the wrong project
- Result: Uncertain — migrations may not have applied to this project

### Attempt 8 — 2026-02-26: `ad84d34` + `b47beaa` + `abc03eb`
**"Fix RLS violation: correct project ID and final migration"**
Applied migration `20260226140000`:
- Combined `SECURITY DEFINER` + `SET row_security = off` + `ALTER OWNER TO postgres`
- Double-permissive INSERT policy: `WITH CHECK (true)` on both tables
- Added TypeScript types for the new RPC function
- Result: **STILL FAILING** (current state)

---

## Current State of the Database (as written in migrations)

### Function: `public.create_organisation_with_admin`

```sql
CREATE FUNCTION public.create_organisation_with_admin(
  _name text,
  _trading_name text DEFAULT NULL,
  _address text DEFAULT NULL,
  _city text DEFAULT NULL,
  _region text DEFAULT NULL,
  _postal_code text DEFAULT NULL,
  _country text DEFAULT 'Ghana',
  _phone text DEFAULT NULL,
  _email text DEFAULT NULL,
  _website text DEFAULT NULL,
  _registration_number text DEFAULT NULL,
  _tax_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  _org_id  uuid;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.organisations (
    name, trading_name, address, city, region, postal_code,
    country, phone, email, website, registration_number, tax_id, is_demo
  ) VALUES (
    _name, _trading_name, _address, _city, _region, _postal_code,
    _country, _phone, _email, _website, _registration_number, _tax_id, false
  ) RETURNING org_id INTO _org_id;

  INSERT INTO public.user_organizations (user_id, org_id) VALUES (_user_id, _org_id);
  INSERT INTO public.user_roles (user_id, org_id, role) VALUES (_user_id, _org_id, 'ADMIN');
  INSERT INTO public.organisation_settings (org_id, bog_tier) VALUES (_org_id, 'TIER_4_MFC');

  RETURN _org_id;
END;
$$;

ALTER FUNCTION public.create_organisation_with_admin(...) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.create_organisation_with_admin(...) TO authenticated;
```

### organisations Table — INSERT Policy (as written)

```sql
CREATE POLICY "Authenticated users can create organisations"
ON public.organisations FOR INSERT TO authenticated
WITH CHECK (true);
```

### Frontend Code — `src/pages/OrganisationOnboarding.tsx`

```typescript
const { error: rpcError } = await supabase.rpc('create_organisation_with_admin', {
  _name: formData.name,
  _trading_name: formData.trading_name || null,
  // ... all other fields
});
if (rpcError) throw rpcError;
```

---

## Diagnostic SQL

**Please run this in the Supabase SQL Editor to confirm the live database state:**

```sql
-- 1. What INSERT policies exist on organisations?
SELECT polname, polpermissive, polcmd,
  pg_get_expr(polqual, polrelid) AS using_expr,
  pg_get_expr(polwithcheck, polrelid) AS check_expr
FROM pg_policy
WHERE polrelid = 'public.organisations'::regclass
ORDER BY polcmd, polname;

-- 2. Does the function exist, and what owner/config does it have?
SELECT
  p.proname,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer,
  p.proconfig AS config_params
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'create_organisation_with_admin';

-- 3. Which roles have BYPASSRLS?
SELECT rolname, rolbypassrls, rolsuper
FROM pg_roles
WHERE rolname IN ('postgres', 'supabase_admin', 'authenticator', 'authenticated', 'anon', 'service_role')
ORDER BY rolname;

-- 4. Are there any RESTRICTIVE policies blocking the insert?
SELECT polname, polpermissive, polcmd
FROM pg_policy
WHERE polrelid = 'public.organisations'::regclass
AND NOT polpermissive;  -- restrictive policies

-- 5. Full list of all organisations policies
SELECT polname, polpermissive,
  CASE polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END AS cmd,
  pg_get_expr(polwithcheck, polrelid) AS check_expr
FROM pg_policy
WHERE polrelid = 'public.organisations'::regclass;
```

---

## What the Expert Needs to Solve

The core question is: **why does `INSERT INTO public.organisations` fail with an RLS violation even when:**

1. There is a policy `WITH CHECK (true)` for `TO authenticated`
2. The user is authenticated (JWT is valid)
3. The insert is wrapped in a `SECURITY DEFINER` function
4. The function has `SET row_security = off`
5. The function owner is set to `postgres`

### Hypotheses

| # | Hypothesis | How to verify |
|---|-----------|---------------|
| 1 | Migrations never applied to live DB | Run diagnostic SQL above — check if function exists and policy is correct |
| 2 | `postgres` role does NOT have `BYPASSRLS` in Supabase Cloud | `SELECT rolbypassrls FROM pg_roles WHERE rolname = 'postgres'` |
| 3 | `ALTER FUNCTION ... OWNER TO postgres` silently fails | Check `proowner` in diagnostic SQL |
| 4 | A different (older) INSERT policy with `auth.uid() IS NOT NULL` is still active and returns false in SECURITY DEFINER context | Check all INSERT policies in diagnostic SQL |
| 5 | There is a RESTRICTIVE policy blocking INSERTs | Check diagnostic SQL query #4 |
| 6 | `SET row_security = off` is ignored for certain Supabase Cloud Postgres versions | N/A — would need Supabase support |

### Recommended Fix Path (in priority order)

**Option A (most likely to work — minimal change):**
```sql
-- Just disable RLS on organisations temporarily
-- (reads are still protected by SELECT policy)
ALTER TABLE public.organisations DISABLE ROW LEVEL SECURITY;
```

**Option B (clean long-term fix):**
```sql
-- Use supabase_admin role if it has BYPASSRLS
-- (requires Supabase support or elevated access)
ALTER FUNCTION public.create_organisation_with_admin(
  text,text,text,text,text,text,text,text,text,text,text,text
) OWNER TO supabase_admin;
```

**Option C (belt-and-suspenders policy fix):**
```sql
-- Drop all INSERT policies and add a single unconditional one
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT polname FROM pg_policy
    WHERE polrelid = 'public.organisations'::regclass AND polcmd = 'a'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organisations', pol.polname);
  END LOOP;
END $$;

CREATE POLICY "allow_all_inserts"
ON public.organisations
FOR INSERT
WITH CHECK (true);
```

---

## Table Schema Reference

### `organisations`
```sql
CREATE TABLE public.organisations (
  org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trading_name TEXT,
  address TEXT, city TEXT, region TEXT, postal_code TEXT,
  country TEXT DEFAULT 'Ghana',
  phone TEXT, email TEXT, website TEXT, logo_url TEXT,
  registration_number TEXT, tax_id TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
```

### `user_organizations`
```sql
CREATE TABLE public.user_organizations (
  user_id UUID REFERENCES auth.users(id),
  org_id  UUID REFERENCES public.organisations(org_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, org_id)
);
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
```

### `user_roles`
```sql
CREATE TABLE public.user_roles (
  user_id UUID, org_id UUID, role TEXT,
  PRIMARY KEY (user_id, org_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

### `organisation_settings`
```sql
CREATE TABLE public.organisation_settings (
  org_id UUID PRIMARY KEY REFERENCES public.organisations(org_id) ON DELETE CASCADE,
  bog_tier TEXT DEFAULT 'TIER_4_MFC',
  ...
);
ALTER TABLE public.organisation_settings ENABLE ROW LEVEL SECURITY;
```

---

## Summary

- **Supabase Project ID:** `udovvvksoemsmadaueqf`
- **Persistent error:** `new row violates row-level security policy for table "organisations"`
- **Triggered by:** First INSERT during new user onboarding
- **Fix attempted 8 times** over 3 days with SECURITY DEFINER, `SET row_security = off`, `OWNER TO postgres`, and permissive policies — none have resolved the issue
- **Most likely cause:** Migrations have not been successfully applied to the live database, OR the `postgres` role in this Supabase Cloud instance does not have `BYPASSRLS`
- **Immediate ask:** Run diagnostic SQL above, confirm live DB state, and apply one of the three fix options

---

*Generated 2026-02-26 from git history and source code of `kfrem/mfi-insights`*
