# Developer Handoff: MFI Clarity — Microfinance Management System

## 🚨 CRITICAL ISSUE TO RESOLVE

### Error: `new row violates row-level security policy for table "organisations"`

**Where it occurs:** `/onboarding` page — when a newly registered user tries to create their organisation.

**File:** `src/pages/OrganisationOnboarding.tsx` (line 52-70)

---

## Root Cause Analysis

The onboarding flow performs 4 sequential inserts when a user creates an organisation:

1. **INSERT into `organisations`** — creates the org record
2. **INSERT into `user_organizations`** — links user to org
3. **INSERT into `user_roles`** — assigns ADMIN role
4. **INSERT into `organisation_settings`** — creates default settings

The error occurs at **Step 1** because of a **chicken-and-egg problem** in the RLS design:

### The Chicken-and-Egg Problem

- The `organisations` INSERT policy requires `auth.uid() IS NOT NULL` (simple auth check) — this should work.
- However, other tables' policies depend on `user_belongs_to_org()` which checks the `user_organizations` table.
- The `user_organizations` INSERT policy allows `auth.uid() = user_id` — this should also work.
- **BUT**: The `user_organizations` SELECT policy requires `user_belongs_to_org(auth.uid(), org_id)` — which creates a circular dependency during onboarding because the user isn't in any org yet.

### What Has Been Attempted

1. **Migration 1:** Converted all RLS policies from `RESTRICTIVE` to `PERMISSIVE` — policies now show `polpermissive: true` in `pg_policy`.
2. **Migration 2:** Added `GRANT SELECT, INSERT, UPDATE, DELETE` on all tables to the `authenticated` role.
3. **Migration 3:** Wrapped GRANTs in `DO $$ BEGIN EXECUTE ... END $$` block to ensure execution.

### Current State (as of 2026-02-23)

- All RLS policies are `PERMISSIVE` ✅
- `has_table_privilege('authenticated', 'public.organisations', 'INSERT')` returns `true` ✅
- The error **may still persist** due to PostgREST caching or session token issues.

---

## Debugging Steps for the Developer

### 1. Test with a Fresh User
Register a completely new account and try the onboarding flow. Old sessions may have stale JWTs.

### 2. Verify GRANTs Are Active
Run in the Supabase SQL Editor:
```sql
SELECT has_table_privilege('authenticated', 'public.organisations', 'INSERT');
SELECT has_table_privilege('authenticated', 'public.organisations', 'SELECT');
SELECT has_table_privilege('authenticated', 'public.user_organizations', 'INSERT');
SELECT has_table_privilege('authenticated', 'public.user_roles', 'INSERT');
SELECT has_table_privilege('authenticated', 'public.organisation_settings', 'INSERT');
```
All should return `true`.

### 3. Verify RLS Policies
```sql
SELECT polname, polpermissive, polcmd,
  pg_get_expr(polqual, polrelid) as using_expr,
  pg_get_expr(polwithcheck, polrelid) as check_expr
FROM pg_policy
WHERE polrelid = 'public.organisations'::regclass;
```

Expected output:
- `Authenticated users can create organisations` — permissive=true, cmd=INSERT, check=`(auth.uid() IS NOT NULL)`
- `Users can view their organisations` — permissive=true, cmd=SELECT
- `Executives can update organisation details` — permissive=true, cmd=UPDATE

### 4. Test INSERT Directly via SQL Editor
Log in as the user, then run:
```sql
INSERT INTO public.organisations (name, country, is_demo)
VALUES ('Test Org', 'Ghana', false)
RETURNING org_id;
```

### 5. If Still Failing — Nuclear Option
If GRANTs and policies are correct but it still fails, the issue may be in PostgREST configuration. Try:
```sql
-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Or restart the Supabase project from the dashboard
```

### 6. Alternative Fix: Use a Database Function
If RLS continues to be problematic, bypass it with a `SECURITY DEFINER` function:

```sql
CREATE OR REPLACE FUNCTION public.create_organisation_with_admin(
  _name text,
  _trading_name text DEFAULT NULL,
  _address text DEFAULT NULL,
  _city text DEFAULT NULL,
  _region text DEFAULT NULL,
  _country text DEFAULT 'Ghana',
  _phone text DEFAULT NULL,
  _email text DEFAULT NULL,
  _registration_number text DEFAULT NULL,
  _tax_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create organisation
  INSERT INTO public.organisations (name, trading_name, address, city, region, country, phone, email, registration_number, tax_id, is_demo)
  VALUES (_name, _trading_name, _address, _city, _region, _country, _phone, _email, _registration_number, _tax_id, false)
  RETURNING org_id INTO _org_id;

  -- Link user to org
  INSERT INTO public.user_organizations (user_id, org_id)
  VALUES (_user_id, _org_id);

  -- Assign ADMIN role
  INSERT INTO public.user_roles (user_id, org_id, role)
  VALUES (_user_id, _org_id, 'ADMIN');

  -- Create default settings
  INSERT INTO public.organisation_settings (org_id, bog_tier)
  VALUES (_org_id, 'TIER_4_MFC');

  RETURN _org_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organisation_with_admin TO authenticated;
```

Then update `src/pages/OrganisationOnboarding.tsx` to call:
```typescript
const { data, error } = await supabase.rpc('create_organisation_with_admin', {
  _name: formData.name,
  _trading_name: formData.trading_name || null,
  _address: formData.address || null,
  _city: formData.city || null,
  _region: formData.region || null,
  _country: formData.country,
  _phone: formData.phone || null,
  _email: formData.email || null,
  _registration_number: formData.registration_number || null,
  _tax_id: formData.tax_id || null,
});
```

---

## Architecture Overview

### Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL + PostgREST + Auth)
- **State:** React Query (TanStack Query v5)

### Authentication Flow
1. User registers at `/register` → Supabase Auth creates account
2. Email verification required (auto-confirm is OFF)
3. User redirected to `/onboarding` to create organisation
4. Onboarding creates: organisation → user_organizations → user_roles (ADMIN) → organisation_settings
5. User lands on Executive Dashboard (`/`)

### Multi-Tenancy
- All data tables have an `org_id` column
- RLS policies use `user_belongs_to_org(auth.uid(), org_id)` to enforce tenant isolation
- Demo mode uses a fixed org ID: `a0000000-0000-0000-0000-000000000001`

### Role-Based Access Control (RBAC)
| Role | Access Level |
|------|-------------|
| ADMIN | Full CRUD on all org data |
| MANAGER | Full CRUD on all org data |
| FIELD_OFFICER | CRUD only on assigned clients |
| TELLER | CRUD only on assigned clients |
| BOARD_DIRECTOR | Read-only access to all org data |

### Key Security Functions (SECURITY DEFINER)
- `user_belongs_to_org(_user_id, _org_id)` — checks user_organizations table
- `is_executive(_user_id, _org_id)` — checks for ADMIN or MANAGER role
- `is_board_member(_user_id, _org_id)` — checks for BOARD_DIRECTOR role
- `has_role(_user_id, _org_id, _role)` — checks for specific role
- `can_access_client(_user_id, _org_id, _client_id)` — field officer assignment check

### Database Tables
| Table | Purpose |
|-------|---------|
| organisations | MFI institution details |
| user_organizations | User-to-org membership |
| user_roles | RBAC role assignments |
| profiles | User display names/emails |
| organisation_settings | BOG tier config per org |
| clients | Borrower/client records |
| loans | Loan applications and tracking |
| repayments | Payment records |
| field_collections | Field officer collections with GPS |
| shareholders | Shareholder registry |
| dividend_payouts | Dividend payment tracking |
| activity_audit_log | Tamper-resistant audit trail |

### Key Files
| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Authentication state management |
| `src/contexts/OrganisationContext.tsx` | Multi-tenant org selection |
| `src/pages/OrganisationOnboarding.tsx` | **THE FILE WITH THE BUG** |
| `src/pages/Login.tsx` | Login page |
| `src/pages/Register.tsx` | Registration page |
| `src/components/auth/ProtectedRoute.tsx` | Route guard |
| `src/integrations/supabase/client.ts` | Supabase client (auto-generated) |
| `src/integrations/supabase/types.ts` | Database types (auto-generated) |

### External Supabase Connection
The project also has an external Supabase connection configured in:
- `src/integrations/external-supabase/client.ts`
- Secrets: `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_ANON_KEY`

---

## Environment Variables
```
VITE_SUPABASE_URL=https://uutolexfqparpiftiekw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=uutolexfqparpiftiekw
```

## Supabase Project
- **Project ID:** uutolexfqparpiftiekw
- **Region:** Check Supabase dashboard

---

## Summary of Recommended Fix

**The safest and most reliable fix is Option 6 above** — create a `SECURITY DEFINER` function that handles the entire onboarding transaction atomically. This bypasses all RLS complexity during the critical onboarding step while maintaining security (the function still validates `auth.uid()` is not null).
